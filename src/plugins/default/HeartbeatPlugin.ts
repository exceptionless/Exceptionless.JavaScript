import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IUserInfo } from '../../models/IUserInfo';

export class HeartbeatPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = 'HeartbeatPlugin';

  private _heartbeatIntervalId: any;
  private _lastUser: IUserInfo;

  public run(context: EventPluginContext, next?: () => void): void {
    let clearHeartbeatInterval = () => {
      if (this._heartbeatIntervalId) {
        clearInterval(this._heartbeatIntervalId);
        this._heartbeatIntervalId = 0;
      }
    };

    let type = context.event.type;
    if (type !== 'heartbeat') {
      if (type === 'sessionend') {
        clearHeartbeatInterval();
      } else {
        let user: IUserInfo = context.event.data['@user'];
        if (user && user.identity) {
          let submitHeartbeatFn = () => context.client.createSessionHeartbeat().setUserIdentity(user).submit();

          if (!this._heartbeatIntervalId) {
            this._lastUser = user;
          } else {
            clearHeartbeatInterval();
          }

          this._heartbeatIntervalId = setInterval(submitHeartbeatFn, 30000);
        }
      }
    }

    next && next();
  }
}
