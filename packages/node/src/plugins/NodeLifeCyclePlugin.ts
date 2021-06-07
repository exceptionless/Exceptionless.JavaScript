import {
  ExceptionlessClient,
  IEventPlugin,
  PluginContext
} from "@exceptionless/core";

export class NodeLifeCyclePlugin implements IEventPlugin {
  public priority: number = 105;
  public name: string = "NodeLifeCyclePlugin";

  private _client: ExceptionlessClient | null = null;

  public startup(context: PluginContext): Promise<void> {
    if (this._client) {
      return Promise.resolve();
    }

    this._client = context.client;

    process.on("beforeExit", (code: number) => {
      const message = this.getExitCodeReason(code);
      if (message) {
        void this._client?.submitLog("beforeExit", message, "Error");
      }

      void this._client?.suspend();
      // Application will now exit.
    });

    return Promise.resolve();
  }

  /**
  * exit codes: https://nodejs.org/api/process.html#process_event_exit
  * From now on, only synchronous code may run. As soon as this method
  * ends, the application inevitably will exit.
  */
  private getExitCodeReason(exitCode: number): string | null {
    if (exitCode === 1) {
      return "Uncaught Fatal Exception";
    }

    if (exitCode === 3) {
      return "Internal JavaScript Parse Error";
    }

    if (exitCode === 4) {
      return "Internal JavaScript Evaluation Failure";
    }

    if (exitCode === 5) {
      return "Fatal Exception";
    }

    if (exitCode === 6) {
      return "Non-function Internal Exception Handler ";
    }

    if (exitCode === 7) {
      return "Internal Exception Handler Run-Time Failure";
    }

    if (exitCode === 8) {
      return "Uncaught Exception";
    }

    if (exitCode === 9) {
      return "Invalid Argument";
    }

    if (exitCode === 10) {
      return "Internal JavaScript Run-Time Failure";
    }

    if (exitCode === 12) {
      return "Invalid Debug Argument";
    }

    return null;
  }
}
