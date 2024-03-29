export class Response<T = void> {
  constructor(
    public status: number,
    public message: string,
    public rateLimitRemaining: number,
    public settingsVersion: number,
    public data: T
  ) {}

  public get success(): boolean {
    return this.status >= 200 && this.status <= 299;
  }
}
