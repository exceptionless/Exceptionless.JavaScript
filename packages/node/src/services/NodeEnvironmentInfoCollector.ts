import { IEnvironmentInfo } from '@exceptionless/core/models/IEnvironmentInfo';
import { EventPluginContext } from '@exceptionless/core/plugins/EventPluginContext';
import { IEnvironmentInfoCollector } from '@exceptionless/core/services/IEnvironmentInfoCollector';

import * as os from 'os'

export class NodeEnvironmentInfoCollector implements IEnvironmentInfoCollector {
  public getEnvironmentInfo(context: EventPluginContext): IEnvironmentInfo {
    function getIpAddresses(): string {
      const ips: string[] = [];
      const interfaces = os.networkInterfaces();
      Object.keys(interfaces).forEach((name) => {
        interfaces[name].forEach((iface: any) => {
          if ('IPv4' === iface.family && !iface.internal) {
            ips.push(iface.address);
          }
        });
      });

      return ips.join(', ');
    }

    if (!os) {
      return null;
    }

    const environmentInfo: IEnvironmentInfo = {
      processor_count: os.cpus().length,
      total_physical_memory: os.totalmem(),
      available_physical_memory: os.freemem(),
      command_line: process.argv.join(' '),
      process_name: (process.title || '').replace(/[\uE000-\uF8FF]/g, ''),
      process_id: process.pid + '',
      process_memory_size: process.memoryUsage().heapTotal,
      // thread_id: '',
      architecture: os.arch(),
      o_s_name: os.type(),
      o_s_version: os.release(),
      // install_id: '',
      runtime_version: process.version,
      data: {
        loadavg: os.loadavg(),
        platform: os.platform(),
        tmpdir: os.tmpdir(),
        uptime: os.uptime()
      }
    };

    const config = context.client.config;
    if (config.includeMachineName) {
      environmentInfo.machine_name = os.hostname();
    }

    if (config.includeIpAddress) {
      environmentInfo.ip_address = getIpAddresses();
    }

    if ((os as any).endianness) {
      environmentInfo.data.endianness = (os as any).endianness();
    }

    return environmentInfo;
  }
}
