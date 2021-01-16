export interface ILastReferenceIdManager {
  getLast(): string;
  clearLast(): void;
  setLast(eventId: string): void;
}
