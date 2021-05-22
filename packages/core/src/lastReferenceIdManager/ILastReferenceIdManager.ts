export interface ILastReferenceIdManager {
  getLast(): string | null;
  clearLast(): void;
  setLast(eventId: string): void;
}
