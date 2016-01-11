import { ISessionManager } from './ISessionManager';
import { Utils } from '../Utils';

export class DefaultSessionManager implements ISessionManager {

  private sessionMap: { [identity: string]: string } = {};

  public getSessionId(identity: string): string {
    if (this.sessionMap.hasOwnProperty(identity)) {
      return this.sessionMap[identity];
    }

    return null;
  }

  public startSession(identity: string): string {
    let sessionId = Utils.guid();
    this.sessionMap[identity] = sessionId;
    return sessionId;
  }

  public endSession(sessionId: string): void {
    let identities = Object.keys(this.sessionMap);
    for (let i = 0; i < identities.length; i++) {
      let identity = identities[i];
      if (this.sessionMap[identity] === sessionId) {
        delete this.sessionMap[identity];
        return;
      }
    }
  }
}
