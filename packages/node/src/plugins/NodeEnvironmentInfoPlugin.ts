import {
  argv,
  memoryUsage,
  pid,
  title,
  version
} from "process";

import {
  arch,
  cpus,
  endianness,
  freemem,
  hostname,
  loadavg,
  networkInterfaces,
  platform,
  release,
  tmpdir,
  totalmem,
  type,
  uptime,
} from "os";

import {
  EnvironmentInfo,
  EventPluginContext,
  IEventPlugin,
  KnownEventDataKeys
} from "@exceptionless/core";

export class NodeEnvironmentInfoPlugin implements IEventPlugin {
  public priority: number = 80;
  public name: string = "NodeEnvironmentInfoPlugin";
  private _environmentInfo: EnvironmentInfo | undefined;

  public run(context: EventPluginContext): Promise<void> {
    if (context.event.data && !context.event.data[KnownEventDataKeys.EnvironmentInfo]) {
      const info: EnvironmentInfo | undefined = this.getEnvironmentInfo(context);
      if (info) {
        context.event.data[KnownEventDataKeys.EnvironmentInfo] = info;
      }
    }

    return Promise.resolve();
  }

  private getEnvironmentInfo(context: EventPluginContext): EnvironmentInfo | undefined {
    function getIpAddresses(): string {
      const ips: string[] = [];

      for (const ni of Object.values(networkInterfaces())) {
        for (const network of ni || []) {
          if (!network.internal && "IPv4" === network.family) {
            ips.push(network.address);
          }
        }
      }

      return ips.join(", ");
    }

    function populateMemoryAndUptimeInfo(ei: EnvironmentInfo) {
      ei.process_memory_size = memoryUsage().heapTotal;
      ei.total_physical_memory = totalmem();
      ei.available_physical_memory = freemem();
      (ei.data as Record<string, unknown>).loadavg = loadavg();
      (ei.data as Record<string, unknown>).uptime = uptime();
    }

    if (!cpus) {
      return;
    }

    if (this._environmentInfo) {
      populateMemoryAndUptimeInfo(this._environmentInfo);
      return this._environmentInfo;
    }

    const info: EnvironmentInfo = {
      processor_count: cpus().length,
      command_line: argv.join(" "),
      process_name: (title || "").replace(/[\uE000-\uF8FF]/g, ""),
      process_id: pid + "",
      process_memory_size: memoryUsage().heapTotal,
      // thread_id: "",
      architecture: arch(),
      o_s_name: type(),
      o_s_version: release(),
      // install_id: "",
      runtime_version: version,
      data: {
        platform: platform(),
        tmpdir: tmpdir()
      },
    };

    const config = context.client.config;
    if (config.includeMachineName) {
      info.machine_name = hostname();
    }

    if (config.includeIpAddress) {
      info.ip_address = getIpAddresses();
    }

    if (endianness) {
      (info.data as Record<string, unknown>).endianness = endianness();
    }

    populateMemoryAndUptimeInfo(info);

    this._environmentInfo = info;
    return this._environmentInfo;
  }
}
