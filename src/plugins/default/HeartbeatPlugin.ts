import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IUserInfo } from '../../models/IUserInfo';

export class HeartbeatPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = 'HeartbeatPlugin';

  private _interval: number;
  private _intervalId: any;

  constructor (heartbeatInterval: number = 30000) {
    this._interval = heartbeatInterval;
  }


  public run(context: EventPluginContext, next?: () => void): void {
    clearInterval(this._intervalId);

    let user: IUserInfo = context.event.data['@user'];
    if (user && user.identity) {
      this._intervalId = setInterval(() => context.client.submitSessionHeartbeat(user.identity), this._interval);
    }

    next && next();
  }
}
