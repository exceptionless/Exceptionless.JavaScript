import { Configuration } from '../configuration/Configuration';
import { IExitController } from './IExitController';

export class NodeExitController implements IExitController {

  private _isApplicationExiting: boolean;

  public get isApplicationExiting() {
    return this._isApplicationExiting;
  }

  public processExit(config:Configuration):void {
    this._isApplicationExiting = true;
    config.queue.process();
  }
}
