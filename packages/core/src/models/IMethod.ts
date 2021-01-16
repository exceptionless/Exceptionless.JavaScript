import { IParameter } from './IParameter';

export interface IMethod {
  data?: any;
  generic_arguments?: string[];
  parameters?: IParameter[];

  is_signature_target?: boolean;
  declaring_namespace?: string;
  declaring_type?: string;
  name?: string;
  module_id?: number;
}
