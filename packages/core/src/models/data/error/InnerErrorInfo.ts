import { MethodInfo } from "./MethodInfo.js";
import { StackFrameInfo } from "./StackFrameInfo.js";

export class InnerErrorInfo {
  message?: string;
  type?: string;
  code?: string;
  data?: any;
  inner?: InnerErrorInfo;
  stack_trace?: StackFrameInfo[];
  target_method?: MethodInfo;
}
