import { ErrorInfo, SimpleError } from "./data/ErrorInfo.js";
import { EnvironmentInfo } from "./data/EnvironmentInfo.js";
import { RequestInfo } from "./data/RequestInfo.js";
import { UserInfo } from "./data/UserInfo.js";
import { UserDescription } from "./data/UserDescription.js";
import { ManualStackingInfo } from "./data/ManualStackingInfo.js";

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
  data?: IEventData;
}

export enum KnownEventDataKeys {
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
  ManualStackingInfo = "@stack",
}

export interface IEventData extends Record<string, unknown> {
  "@error"?: ErrorInfo;
  "@simple_error"?: SimpleError;
  "@request"?: RequestInfo;
  "@environment"?: EnvironmentInfo;
  "@user"?: UserInfo;
  "@user_description"?: UserDescription;
  "@version"?: string;
  "@level"?: string;
  "@submission_method"?: string;
  "@stack"?: ManualStackingInfo;
}
