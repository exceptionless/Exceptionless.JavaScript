import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';
import { IUserInfo } from '../../models/IUserInfo';

export class HeartbeatPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = 'HeartbeatPlugin';

  private _heartbeatInterval: number;
  private _heartbeatIntervalId: any;

  constructor (heartbeatInterval: number = 30000) {
    this._heartbeatInterval = heartbeatInterval;
  }


  public run(context: EventPluginContext, next?: () => void): void {
    let clearHeartbeatInterval = () => {
      if (this._heartbeatIntervalId) {
        clearInterval(this._heartbeatIntervalId);
        this._heartbeatIntervalId = 0;
      }
    };

    if (this._heartbeatIntervalId) {
      clearHeartbeatInterval();
    }

    let user: IUserInfo = context.event.data['@user'];
    if (user && user.identity) {
      this._heartbeatIntervalId = setInterval(() => context.client.submitSessionHeartbeat(user.identity), this._heartbeatInterval);
    }

    next && next();
  }
}
