import { Platform } from "react-native";

import { EnvironmentInfo, EventPluginContext, IEventPlugin, KnownEventDataKeys } from "@exceptionless/core";

interface ReactNativeVersion {
  major?: number;
  minor?: number;
  patch?: number;
  prerelease?: string | null;
}

interface ReactNativePlatformConstants extends Record<string, unknown> {
  Brand?: string;
  Manufacturer?: string;
  Model?: string;
  Release?: string;
  Version?: number;
  interfaceIdiom?: string;
  isTesting?: boolean;
  osVersion?: number | string;
  reactNativeVersion?: ReactNativeVersion;
  systemName?: string;
  uiMode?: string;
}

export class ReactNativeEnvironmentInfoPlugin implements IEventPlugin {
  public priority: number = 80;
  public name: string = "ReactNativeEnvironmentInfoPlugin";
  private _environmentInfo: EnvironmentInfo | undefined;

  public run(context: EventPluginContext): Promise<void> {
    if (context.event.data && !context.event.data[KnownEventDataKeys.EnvironmentInfo]) {
      const info = this.getEnvironmentInfo();
      if (info) {
        context.event.data[KnownEventDataKeys.EnvironmentInfo] = info;
      }
    }

    return Promise.resolve();
  }

  private getEnvironmentInfo(): EnvironmentInfo | undefined {
    if (this._environmentInfo) {
      return this._environmentInfo;
    }

    const constants = Platform.constants as ReactNativePlatformConstants | undefined;
    const info: EnvironmentInfo = {
      o_s_name: Platform.OS,
      o_s_version: this.getOsVersion(constants),
      runtime_version: this.getRuntimeVersion(constants),
      data: this.getPlatformData(constants)
    };

    if (Platform.OS === "android" && constants?.Model) {
      info.machine_name = constants.Model;
    }

    this._environmentInfo = info;
    return this._environmentInfo;
  }

  private getOsVersion(constants: ReactNativePlatformConstants | undefined): string {
    const version = constants?.osVersion ?? constants?.Release ?? Platform.Version;
    return version != null ? String(version) : "unknown";
  }

  private getRuntimeVersion(constants: ReactNativePlatformConstants | undefined): string {
    const version = constants?.reactNativeVersion;
    if (!version) {
      return "react-native unknown";
    }

    const prerelease = version.prerelease ? `-${version.prerelease}` : "";
    return `react-native ${version.major ?? 0}.${version.minor ?? 0}.${version.patch ?? 0}${prerelease}`;
  }

  private getPlatformData(constants: ReactNativePlatformConstants | undefined): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    this.setIfDefined(data, "isTesting", constants?.isTesting);
    this.setLocale(data);

    if (Platform.OS === "android") {
      this.setIfDefined(data, "deviceBrand", constants?.Brand);
      this.setIfDefined(data, "deviceManufacturer", constants?.Manufacturer);
      this.setIfDefined(data, "deviceModel", constants?.Model);
      this.setIfDefined(data, "uiMode", constants?.uiMode);
    }

    if (Platform.OS === "ios") {
      this.setIfDefined(data, "deviceIdiom", constants?.interfaceIdiom);
      this.setIfDefined(data, "systemName", constants?.systemName);
    }

    return data;
  }

  private setIfDefined(data: Record<string, unknown>, key: string, value: unknown): void {
    if (value !== undefined && value !== null && value !== "") {
      data[key] = value;
    }
  }

  private setLocale(data: Record<string, unknown>): void {
    try {
      const locale = Intl.DateTimeFormat().resolvedOptions().locale;
      this.setIfDefined(data, "locale", locale);
    } catch {
      // Intl can be unavailable in older embedded runtimes.
    }
  }
}
