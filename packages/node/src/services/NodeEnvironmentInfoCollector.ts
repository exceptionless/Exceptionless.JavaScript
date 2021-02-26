import { argv, memoryUsage, pid, title, version } from "process";

import {
  arch,
  cpus,
  endianness,
  freemem,
  hostname,
  loadavg,
  NetworkInterfaceInfo,
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
  IEnvironmentInfoCollector,
} from "@exceptionless/core";

export class NodeEnvironmentInfoCollector implements IEnvironmentInfoCollector {
  public getEnvironmentInfo(context: EventPluginContext): EnvironmentInfo {
    function getIpAddresses(): string {
      const ips: string[] = [];
      const interfaces = networkInterfaces();
      Object.keys(interfaces).forEach((name) => {
        interfaces[name].forEach((network: NetworkInterfaceInfo) => {
          if ("IPv4" === network.family && !network.internal) {
            ips.push(network.address);
          }
        });
      });

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
