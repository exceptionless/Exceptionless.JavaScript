export interface IEnvironmentInfo {
  processor_count?: number;
  total_physical_memory?: number;
  available_physical_memory?: number;
  command_line?: string;
  process_name?: string;
  process_id?: string;
  process_memory_size?: number;
  thread_id?: string;
  architecture?: string;
  o_s_name?: string;
  o_s_version?: string;
  ip_address?: string;
  machine_name?: string;
  install_id?: string;
  runtime_version?: string;
  data?: any;
}
