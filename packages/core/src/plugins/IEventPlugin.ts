import { EventPluginContext } from "#/plugins/EventPluginContext.js";
import { PluginContext } from "#/plugins/PluginContext.js";

export interface IEventPlugin {
  priority?: number;
  name?: string;
  startup?(context: PluginContext): Promise<void>;
  suspend?(context: PluginContext): Promise<void>;
  run?(context: EventPluginContext): Promise<void>;
}
