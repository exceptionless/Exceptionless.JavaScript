export class SettingsResponse {
  success:boolean = false;
  settings:any;
  settingsVersion:number = -1;
  message:string;
  exception:any;

  constructor(success:boolean, settings:any, settingsVersion:number = -1, exception:any = null, message:string = null) {
    this.success = success;
    this.settings = settings;
    this.settingsVersion = settingsVersion;
    this.exception = exception;
    this.message = message;
  }
}
