import { EventPluginContext } from "./EventPluginContext.js";
import { PluginContext } from "./PluginContext.js";

export interface IEventPlugin {
  priority?: number;
  name?: string;
  // TODO: Seems like we need a marker on startup context to determine if it's being resumed?
  startup(context: PluginContext): Promise<void>;
  suspend(context: PluginContext): Promise<void>;
  run(context: EventPluginContext): Promise<void>;
}
