export interface IRequestInfo {
  user_agent?: string;
  http_method?: string;
  is_secure?: boolean;
  host?: string;
  port?: number;
  path?: string;
  referrer?: string;
  client_ip_address?: string;
  cookies?: any;
  post_data?: any;
  query_string?: any;
  data?: any;
}
