export interface Event {
  /** The event type (ie. error, log message, feature usage). */
  type?: string;
  /** The event source (ie. machine name, log name, feature name). */
  source?: string;
  /** The date that the event occurred on. */
  date?: Date;
  /** A list of tags used to categorize this event. */
  tags?: string[];
  /** The event message. */
  message?: string;
  /** The geo coordinates where the event happened. */
  geo?: string;
  /** The value of the event if any. */
  value?: number;
  /** The number of duplicated events. */
  count?: number;
  /** An optional identifier to be used for referencing this event instance at a later time. */
  reference_id?: string;
  /** Optional data entries that contain additional information about this event. */
  data?: Record<string, any>; // TODO: Add typing for known keys.
}

export const enum KnownEventDataKeys {
  Error = "@error",
  SimpleError = "@simple_error",
  RequestInfo = "@request",
  TraceLog = "@trace",
  EnvironmentInfo = "@environment",
  UserInfo = "@user",
  UserDescription = "@user_description",
  Version = "@version",
  Level = "@level",
  SubmissionMethod = "@submission_method",
  ManualStackingInfo = "@stack"
}
