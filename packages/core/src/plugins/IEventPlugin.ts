import { EventPluginContext } from "./EventPluginContext.js";
import { PluginContext } from "./PluginContext.js";

export interface IEventPlugin {
  priority?: number;
  name?: string;
  startup?(context: PluginContext): Promise<void>;
  suspend?(context: PluginContext): Promise<void>;
  run(context: EventPluginContext): Promise<void>;
}
