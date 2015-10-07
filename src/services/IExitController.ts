import { Configuration } from '../configuration/Configuration';

export interface IExitController {
  isApplicationExiting:boolean;
  processExit(config:Configuration):void;
}
