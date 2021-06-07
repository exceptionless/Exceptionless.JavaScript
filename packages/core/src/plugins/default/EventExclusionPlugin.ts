import { KnownEventDataKeys } from "../../models/Event.js";
import { isMatch, startsWith, toBoolean } from "../../Utils.js";
import { EventPluginContext } from "../EventPluginContext.js";
import { IEventPlugin } from "../IEventPlugin.js";

export class EventExclusionPlugin implements IEventPlugin {
  public priority = 45;
  public name = "EventExclusionPlugin";

  public run(context: EventPluginContext): Promise<void> {
    const ev = context.event;
    const log = context.log;
    const settings = context.client.config.settings;

    if (ev.type === "log") {
      const minLogLevel = this.getMinLogLevel(settings, ev.source);
      const logLevel = this.getLogLevel(ev.data && ev.data[KnownEventDataKeys.Level]);

      if (logLevel !== -1 && (logLevel === 6 || logLevel < minLogLevel)) {
        log.info("Cancelling log event due to minimum log level.");
        context.cancelled = true;
      }
    } else if (ev.type === "error") {
      let error = ev.data && ev.data[KnownEventDataKeys.Error];
      while (!context.cancelled && error) {
        if (this.getTypeAndSourceSetting(settings, ev.type, error.type, true) === false) {
          log.info(`Cancelling error from excluded exception type: ${<string>error.type}`);
          context.cancelled = true;
        }

        error = error.inner;
      }
    } else if (this.getTypeAndSourceSetting(settings, ev.type, ev.source, true) === false) {
      log.info(`Cancelling event from excluded type: ${<string>ev.type} and source: ${<string>ev.source}`);
      context.cancelled = true;
    }

    return Promise.resolve();
  }

  public getLogLevel(level: string | undefined): number {
    switch ((level || "").toLowerCase().trim()) {
      case "trace":
      case "true":
      case "1":
      case "yes":
        return 0;
      case "debug":
        return 1;
      case "info":
        return 2;
      case "warn":
        return 3;
      case "error":
        return 4;
      case "fatal":
        return 5;
      case "off":
      case "false":
      case "0":
      case "no":
        return 6;
      default:
        return -1;
    }
  }

  public getMinLogLevel(configSettings: Record<string, string>, source: string | undefined): number {
    return this.getLogLevel(this.getTypeAndSourceSetting(configSettings, "log", source, "other") + "");
  }

  private getTypeAndSourceSetting(
    configSettings: Record<string, string> = {},
    type: string | undefined,
    source: string | undefined,
    defaultValue: string | boolean,
  ): string | boolean {
    if (!type) {
      return defaultValue;
    }

    if (!source) {
      source = "";
    }

    const isLog: boolean = type === "log";
    const sourcePrefix = `@@${type}:`;

    const value: string = configSettings[sourcePrefix + source];
    if (value) {
      return isLog ? value : toBoolean(value);
    }

    // sort object keys longest first, then alphabetically.
    const sortedKeys = Object.keys(configSettings).sort((a, b) =>
      b.length - a.length || a.localeCompare(b)
    );
    for (const key of sortedKeys) {
      if (!startsWith(key.toLowerCase(), sourcePrefix)) {
        continue;
      }

      // check for wildcard match
      const cleanKey: string = key.substring(sourcePrefix.length);
      if (isMatch(source, [cleanKey])) {
        return isLog ? configSettings[key] : toBoolean(configSettings[key]);
      }
    }

    return defaultValue;
  }
}
