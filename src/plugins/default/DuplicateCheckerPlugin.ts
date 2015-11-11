import { IInnerError } from '../../models/IInnerError';
import { IStackFrame } from '../../models/IStackFrame';

import { ILog } from '../../logging/ILog';

import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

const ERROR_KEY: string = '@error';
const WINDOW_MILLISECONDS = 2000;
const MAX_QUEUE_LENGTH = 10;

export class DuplicateCheckerPlugin implements IEventPlugin {
  public priority: number = 40;
  public name: string = 'DuplicateCheckerPlugin';

  private recentlyProcessedErrors: TimestampedHash[] = [];

  public run(context: EventPluginContext, next?: () => void): void {
    if (context.event.type === 'error') {
      let error = context.event.data[ERROR_KEY];
      let isDuplicate = this.checkDuplicate(error, context.log);
      if (isDuplicate) {
        context.cancelled = true;
        return;
      }
    }

    next && next();
  }
  
  private getNow() {
    return Date.now();
  }

  private checkDuplicate(error: IInnerError, log: ILog): boolean {
    let now = this.getNow();
    let repeatWindow = now - WINDOW_MILLISECONDS;
    let hashCode: number;
    while (error) {
      hashCode = getHashCodeForError(error);
      
      // make sure that we don't process the same error multiple times within the repeat window
      if (hashCode && this.recentlyProcessedErrors.some(h =>
        h.hash == hashCode && h.timestamp >= repeatWindow)) {
        log.info(`Ignoring duplicate error event: hash=${hashCode}`);
        return true;
      }
        
      // add this exception to our list of recent errors that we have processed
      this.recentlyProcessedErrors.push({ hash: hashCode, timestamp: now });
      
      // only keep the last 10 recent errors
      while (this.recentlyProcessedErrors.length > MAX_QUEUE_LENGTH) {
        this.recentlyProcessedErrors.shift();
      }

      error = error.inner;
    }

    return false;
  }
}

interface TimestampedHash {
  hash: number;
  timestamp: number
}

function getHashCodeForError(error: IInnerError): number {
  if (!error.stack_trace) {
    return null;
  }

  let stack = JSON.stringify(error.stack_trace);
  return getHashCode(stack);
}

function getHashCode(s: string): number {
  let hash = 0, length = s.length, char;
  for (let i = 0; i < length; i++) {
    char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
