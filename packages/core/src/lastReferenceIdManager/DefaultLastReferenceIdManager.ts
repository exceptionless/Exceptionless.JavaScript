import { ILastReferenceIdManager } from "./ILastReferenceIdManager.js";

export class DefaultLastReferenceIdManager implements ILastReferenceIdManager {
  /**
   * Gets the last event's reference id that was submitted to the server.
   */
  private _lastReferenceId: string | null = null;

  /**
   * Gets the last event's reference id that was submitted to the server.
   */
  public getLast(): string | null {
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
   */
  public setLast(eventId: string): void {
    this._lastReferenceId = eventId;
  }
}
