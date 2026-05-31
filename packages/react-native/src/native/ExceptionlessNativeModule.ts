import { NativeModules, Platform } from "react-native";

export interface CrashReportFrame {
  address: string;
  image: string | null;
  symbol: string | null;
  offset: number | null;
}

export interface CrashReportThread {
  thread_id: number;
  crashed: boolean;
  frames: CrashReportFrame[];
}

export interface CrashReport {
  timestamp: string;
  signal_name: string | null;
  signal_code: string | null;
  exception_type: string | null;
  exception_name: string | null;
  exception_reason: string | null;
  crashed_thread: number;
  threads: CrashReportThread[];
  device: {
    model: string;
    os_version: string;
    app_version: string | null;
  };
}

export interface ExceptionlessNativeModuleInterface {
  install(): void;
  hasPendingCrashReport(): Promise<boolean>;
  getPendingCrashReports(): Promise<CrashReport[]>;
  clearPendingCrashReports(): Promise<void>;
}

export function getNativeModule(): ExceptionlessNativeModuleInterface | null {
  if (Platform.OS !== "ios") {
    return null;
  }

  return (NativeModules.ExceptionlessReactNative as ExceptionlessNativeModuleInterface | undefined) ?? null;
}

export function isNativeModuleAvailable(): boolean {
  return getNativeModule() !== null;
}
