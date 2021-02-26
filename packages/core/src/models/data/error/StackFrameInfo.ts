import { MethodInfo } from "./MethodInfo.js";

export class StackFrameInfo extends MethodInfo {
  file_name?: string;
  line_number?: number;
  column?: number;
}
