import { CallbackLog, ConsoleLog } from "@exceptionless/react-native";

import type { LogEntry } from "@exceptionless/react-native";

const MAX_LOG_ENTRIES = 200;

/** Module-level log entry storage that persists across screen navigations. */
let _entries: LogEntry[] = [];
let _listeners: Array<() => void> = [];

function notifyListeners(): void {
  for (const listener of _listeners) {
    listener();
  }
}

/** Shared CallbackLog instance that wraps ConsoleLog. Use in config.services.log. */
export const callbackLog = new CallbackLog(new ConsoleLog());

// Automatically capture all log entries into the module-level store
callbackLog.subscribe((entry: LogEntry) => {
  _entries = [..._entries, entry];
  if (_entries.length > MAX_LOG_ENTRIES) {
    _entries = _entries.slice(_entries.length - MAX_LOG_ENTRIES);
  }
  notifyListeners();
});

/** Get the current log entries snapshot. */
export function getLogEntries(): LogEntry[] {
  return _entries;
}

/** Clear all stored log entries. */
export function clearLogEntries(): void {
  _entries = [];
  notifyListeners();
}

/** Subscribe to log entry changes. Returns an unsubscribe function. */
export function subscribeToLogs(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
}
