export interface ISessionManager {
  getSessionId(identity: string): string;
  startSession(identity: string): string;
  endSession(sessionId: string): void;
}
