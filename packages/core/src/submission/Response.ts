
export class Response<T> {
  constructor(
    public status: number,
    public message: string,
    public settingsVersion: number,
    public data: T
  ) { }

  public get success(): boolean {
    return this.status >= 200 && this.status <= 299;
  }
}
