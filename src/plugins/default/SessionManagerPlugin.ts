import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class SessionManagerPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = 'SessionManagerPlugin';

  public run(context: EventPluginContext, next?: () => void): void {

    // only manage session ids if the session id isn't specified manually
    if (!context.event.session_id) {
      return;
    }

    // let sessionManager = context.client.config.sessionManager;

  }
}
