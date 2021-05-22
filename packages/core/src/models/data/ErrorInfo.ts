import { ModuleInfo } from "./ModuleInfo.js";

export interface SimpleError {
  message?: string;
  type?: string;
  stack_trace?: string;
  data?: Record<string, unknown>;
  inner?: SimpleError;
}

export interface InnerErrorInfo {
  message?: string;
  type?: string;
  code?: string;
  data?: Record<string, unknown>;
  inner?: InnerErrorInfo;
  stack_trace?: StackFrameInfo[];
  target_method?: MethodInfo;
}

export interface ErrorInfo extends InnerErrorInfo {
  modules?: ModuleInfo[];
}

export interface MethodInfo {
  data?: Record<string, unknown>;
  generic_arguments?: string[];
  parameters?: ParameterInfo[];
  is_signature_target?: boolean;
  declaring_namespace?: string;
  declaring_type?: string;
  name?: string;
  module_id?: number;
}

export interface ParameterInfo {
  data?: Record<string, unknown>;
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
