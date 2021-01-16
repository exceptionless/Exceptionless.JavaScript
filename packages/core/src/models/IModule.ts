export interface IModule {
  data?: any;

  module_id?: number;
  name?: string;
  version?: string;
  is_entry?: boolean;
  created_date?: Date;
  modified_date?: Date;
}
