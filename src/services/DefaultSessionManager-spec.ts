import { expect } from 'chai';
import { DefaultSessionManager } from './DefaultSessionManager';

describe('DefaultSessionManager', () => {

  const identity = 'TestIdentity';

  let target: DefaultSessionManager;
  let sessionId: string;

  beforeEach(() => {
    target = new DefaultSessionManager();
    sessionId = target.startSession(identity);
  });

  it('should return the existing session', () => {
    let result = target.getSessionId(identity);
    expect(result).to.equal(sessionId);
  });

  it('should return null for nonexisting session', () => {
    let result = target.getSessionId('InvalidSessionId');
    expect(result).to.be.null;
  });

  it('should return different id for new session', () => {
    let result = target.startSession('OtherIdentity');
    expect(result).not.to.equal(sessionId);
  });

  it('should return null after ending session', () => {
    target.endSession(sessionId);
    let result = target.getSessionId(identity);
    expect(result).to.be.null;
  });

});
