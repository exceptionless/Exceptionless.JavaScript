import { EventPluginContext } from './EventPluginContext';
import { IEventPlugin } from './IEventPlugin';

export interface IEventPlugin {
  priority?: number;
  name?: string;
  run(context: EventPluginContext, next?: () => void): void;
}
