export class TextAreaSelfLogger {
  constructor(elementId, logger) {
    if (!elementId) {
      throw new Error("elementId is required");
    }

    this.logger = logger;
    this.messageBuffer = [];
    if (document.readyState === "complete") {
      this.element = document.getElementById(elementId);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        this.element = document.getElementById(elementId);
        this.element.innerHTML = this.messageBuffer.join("\n") + this.element.innerHTML;
        this.messageBuffer = [];
      });
    }
  }

  trace(message) {
    this.logger?.trace(message);
    this.log("debug", message);
  }
  info(message) {
    this.logger?.info(message);
    this.log("info", message);
  }
  warn(message) {
    this.logger?.warn(message);
    this.log("warn", message);
  }
  error(message) {
    this.logger?.error(message);
    this.log("error", message);
  }

  log(level, message) {
    if (this.element) {
      this.element.innerHTML += `\n[${level}] Exceptionless: ${message}`;
    } else {
      this.messageBuffer.push(`[${level}] Exceptionless: ${message}`)
    }
  }
}
