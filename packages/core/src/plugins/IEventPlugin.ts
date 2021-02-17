import { EventPluginContext } from './EventPluginContext.js';

export interface IEventPlugin {
  priority?: number;
  name?: string;
  run(context: EventPluginContext, next?: () => void): void;
}
