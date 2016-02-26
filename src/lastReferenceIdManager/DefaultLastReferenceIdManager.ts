import { ILastReferenceIdManager } from './ILastReferenceIdManager';

export class DefaultLastReferenceIdManager implements ILastReferenceIdManager {
  /**
   * Gets the last event's reference id that was submitted to the server.
   * @type {string}
   * @private
   */
  private _lastReferenceId: string = null;

  /**
   * Gets the last event's reference id that was submitted to the server.
   * @returns {string}
   */
  public getLast(): string {
    return this._lastReferenceId;
  }

  /**
   * Clears the last event's reference id.
   */
  public clearLast(): void {
    this._lastReferenceId = null;
  }

  /**
   * Sets the last event's reference id.
   * @param eventId
   */
  public setLast(eventId: string): void {
    this._lastReferenceId = eventId;
  }
}
