export interface RequestInfo {
  user_agent?: string;
  http_method?: string;
  is_secure?: boolean;
  host?: string;
  port?: number;
  path?: string;
  referrer?: string;
  client_ip_address?: string;
  cookies?: Record<string, string>;
  post_data?: Record<string, unknown>;
  query_string?: Record<string, string>;
  data?: Record<string, unknown>;
}
