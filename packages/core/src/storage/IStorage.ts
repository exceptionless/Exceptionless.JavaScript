export interface IStorage {
  readonly length: Promise<number>;
  clear(): Promise<void>;
  getItem(key: string): Promise<string | null>;
  key(index: number): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
}
