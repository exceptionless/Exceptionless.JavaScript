import { InnerErrorInfo } from "./InnerErrorInfo.js";
import { ModuleInfo } from "./ModuleInfo.js";

export class ErrorInfo extends InnerErrorInfo {
  modules?: ModuleInfo[];
}
