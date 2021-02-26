import { ParameterInfo } from "./ParameterInfo.js";

export class MethodInfo {
  data?: any;
  generic_arguments?: string[];
  parameters?: ParameterInfo[];
  is_signature_target?: boolean;
  declaring_namespace?: string;
  declaring_type?: string;
  name?: string;
  module_id?: number;
}
