import { ModuleInfo } from "./ModuleInfo.js";

export class InnerErrorInfo {
  message?: string;
  type?: string;
  code?: string;
  data?: any;
  inner?: InnerErrorInfo;
  stack_trace?: StackFrameInfo[];
  target_method?: MethodInfo;
}

export class ErrorInfo extends InnerErrorInfo {
  modules?: ModuleInfo[];
}

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

export class ParameterInfo {
  data?: any;
  generic_arguments?: string[];
  name?: string;
  type?: string;
  type_namespace?: string;
}

export class StackFrameInfo extends MethodInfo {
  file_name?: string;
  line_number?: number;
  column?: number;
}
