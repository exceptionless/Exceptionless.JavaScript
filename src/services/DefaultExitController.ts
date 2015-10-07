import { Configuration } from '../configuration/Configuration';
import { IExitController } from './IExitController';

export class DefaultExitController implements IExitController {

  public get isApplicationExiting() {
    return false;
  }

  public processExit(config:Configuration): void {
  }
}
