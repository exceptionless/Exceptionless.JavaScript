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

  public run(context: EventPluginContext): Promise<void> {
    // PERF: Ensure module info is cached and rework below statement.
    if (!context.event.data[KnownEventDataKeys.EnvironmentInfo]) {
      const environmentInfo: EnvironmentInfo = this.getEnvironmentInfo(context);
      if (environmentInfo) {
        context.event.data[KnownEventDataKeys.EnvironmentInfo] = environmentInfo;
      }
    }

    return Promise.resolve();
  }

  private getEnvironmentInfo(context: EventPluginContext): EnvironmentInfo {
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

    if (!cpus) {
      return null;
    }

    const environmentInfo: EnvironmentInfo = {
      processor_count: cpus().length,
      total_physical_memory: totalmem(),
      available_physical_memory: freemem(),
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
        loadavg: loadavg(),
        platform: platform(),
        tmpdir: tmpdir(),
        uptime: uptime(),
      },
    };

    const config = context.client.config;
    if (config.includeMachineName) {
      environmentInfo.machine_name = hostname();
    }

    if (config.includeIpAddress) {
      environmentInfo.ip_address = getIpAddresses();
    }

    if (endianness) {
      environmentInfo.data.endianness = endianness();
    }

    return environmentInfo;
  }
}
