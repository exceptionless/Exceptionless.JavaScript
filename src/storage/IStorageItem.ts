export interface IStorageItem<T> {
  created: number;
  path: string;
  value: T;
}
