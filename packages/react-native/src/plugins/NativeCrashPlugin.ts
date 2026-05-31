import { ExceptionlessClient, IEventPlugin, PluginContext } from "@exceptionless/core";
import { Platform } from "react-native";

import { CrashReport, getNativeModule } from "../native/ExceptionlessNativeModule.js";

export class NativeCrashPlugin implements IEventPlugin {
  public priority = 1;
  public name = "NativeCrashPlugin";

  private _client: ExceptionlessClient | null = null;

  public async startup(context: PluginContext): Promise<void> {
    if (this._client || Platform.OS !== "ios") {
      return;
    }

    this._client = context.client;
    const nativeModule = getNativeModule();

    if (!nativeModule) {
      context.client.config.services.log.warn("Native crash reporter module not available. Native crashes will not be captured.");
      return;
    }

    nativeModule.install();

    await this.submitPendingCrashReports(nativeModule);
  }

  private async submitPendingCrashReports(nativeModule: NonNullable<ReturnType<typeof getNativeModule>>): Promise<void> {
    if (!this._client) {
      return;
    }

    try {
      const hasPending = await nativeModule.hasPendingCrashReport();
      if (!hasPending) {
        return;
      }

      const reports = await nativeModule.getPendingCrashReports();
      if (reports.length === 0) {
        this._client.config.services.log.warn("Native crash reporter indicated a pending crash, but no crash reports were returned.");
        return;
      }

      for (const report of reports) {
        await this.submitCrashReport(report);
      }

      await nativeModule.clearPendingCrashReports();
      this._client.config.services.log.info(`Submitted ${reports.length} native crash report(s) from previous session.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this._client.config.services.log.error(`Failed to process native crash reports: ${message}`);
    }
  }

  private async submitCrashReport(report: CrashReport): Promise<void> {
    if (!this._client) {
      return;
    }

    const errorMessage = this.buildErrorMessage(report);
    const error = new Error(errorMessage);
    error.name = report.exception_name ?? report.signal_name ?? "NativeCrash";
    error.stack = this.buildNativeStackTrace(report);

    await this._client
      .createUnhandledException(error, "NativeCrashReporter")
      .setProperty("native_crash", {
        signal_name: report.signal_name,
        signal_code: report.signal_code,
        exception_type: report.exception_type,
        crashed_thread: report.crashed_thread,
        device: report.device,
        timestamp: report.timestamp
      })
      .submit();
  }

  private buildErrorMessage(report: CrashReport): string {
    if (report.exception_reason) {
      return report.exception_reason;
    }

    if (report.signal_name) {
      const code = report.signal_code ? ` (${report.signal_code})` : "";
      return `Native crash: ${report.signal_name}${code}`;
    }

    return "Unknown native crash";
  }

  private buildNativeStackTrace(report: CrashReport): string {
    const crashedThread = report.threads.find((t) => t.crashed) ?? report.threads[0];
    if (!crashedThread) {
      return "";
    }

    const frames = crashedThread.frames.map((frame) => {
      const symbol = frame.symbol ?? frame.address;
      const image = frame.image ?? "unknown";
      const offset = frame.offset != null ? `+${frame.offset}` : "";
      return `    at ${symbol} (${image}${offset})`;
    });

    return frames.join("\n");
  }
}
