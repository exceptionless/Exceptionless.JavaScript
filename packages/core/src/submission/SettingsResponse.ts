export class SettingsResponse {
  public success: boolean = false;
  public settings: any;
  public settingsVersion: number = -1;
  public message: string;
  public exception: any;

  constructor(success: boolean, settings: any, settingsVersion: number = -1, exception: any = null, message: string = null) {
    this.success = success;
    this.settings = settings;
    this.settingsVersion = settingsVersion;
    this.exception = exception;
    this.message = message;
  }
}
