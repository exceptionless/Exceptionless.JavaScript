export interface IStorage {
  length(): Promise<number>;
  clear(): Promise<void>;
  getItem(key: string): Promise<string | null>;
  key(index: number): Promise<string | null>;
  keys(): Promise<string[]>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
}
