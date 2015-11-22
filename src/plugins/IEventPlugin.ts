import { IEventPlugin } from './IEventPlugin';
import { EventPluginContext } from './EventPluginContext';

export interface IEventPlugin {
  priority?: number;
  name?: string;
  run(context: EventPluginContext, next?: () => void): void;
}
