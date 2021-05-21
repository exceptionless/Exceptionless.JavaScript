import { ModuleInfo } from "./ModuleInfo.js";

export interface SimpleError {
  message?: string;
  type?: string;
  stack_trace?: string;
  data?: any;
  inner?: SimpleError;
}

export interface InnerErrorInfo {
  message?: string;
  type?: string;
  code?: string;
  data?: any;
  inner?: InnerErrorInfo;
  stack_trace?: StackFrameInfo[];
  target_method?: MethodInfo;
}

export interface ErrorInfo extends InnerErrorInfo {
  modules?: ModuleInfo[];
}

export interface MethodInfo {
  data?: any;
  generic_arguments?: string[];
  parameters?: ParameterInfo[];
  is_signature_target?: boolean;
  declaring_namespace?: string;
  declaring_type?: string;
  name?: string;
  module_id?: number;
}

export interface ParameterInfo {
  data?: any;
  generic_arguments?: string[];
  name?: string;
  type?: string;
  type_namespace?: string;
}

export interface StackFrameInfo extends MethodInfo {
  file_name?: string;
  line_number?: number;
  column?: number;
}
