import { IUserInfo } from '../../models/IUserInfo';
import { EventPluginContext } from '../EventPluginContext';
import { IEventPlugin } from '../IEventPlugin';

export class HeartbeatPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = 'HeartbeatPlugin';

  private _interval: number;
  private _intervalId: any;

  constructor(heartbeatInterval: number = 30000) {
    this._interval = heartbeatInterval;
  }

  public run(context: EventPluginContext, next?: () => void): void {
    clearInterval(this._intervalId);

    const user: IUserInfo = context.event.data['@user'];
    if (user && user.identity) {
      this._intervalId = setInterval(() => context.client.submitSessionHeartbeat(user.identity), this._interval);
    }

    next && next();
  }
}
