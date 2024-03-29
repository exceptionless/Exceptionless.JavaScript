import { ExceptionlessClient } from "./ExceptionlessClient.js";
import { Event, EventType, KnownEventDataKeys } from "./models/Event.js";
import { ManualStackingInfo } from "./models/data/ManualStackingInfo.js";
import { UserInfo } from "./models/data/UserInfo.js";
import { EventContext } from "./models/EventContext.js";
import { isEmpty, stringify } from "./Utils.js";
import { EventPluginContext } from "./plugins/EventPluginContext.js";

export class EventBuilder {
  public target: Event;
  public client: ExceptionlessClient;
  public context: EventContext;

  private _validIdentifierErrorMessage = "must contain between 8 and 100 alphanumeric or '-' characters.";

  constructor(event: Event, client: ExceptionlessClient, context?: EventContext) {
    this.target = event;
    this.client = client;
    this.context = context || new EventContext();
  }

  public setType(type: EventType): EventBuilder {
    if (type) {
      this.target.type = type;
    }

    return this;
  }

  public setSource(source: string): EventBuilder {
    if (source) {
      this.target.source = source;
    }

    return this;
  }

  public setReferenceId(referenceId: string): EventBuilder {
    if (!this.isValidIdentifier(referenceId)) {
      throw new Error(`ReferenceId ${this._validIdentifierErrorMessage}`);
    }

    this.target.reference_id = referenceId;
    return this;
  }

  /**
   * Allows you to reference a parent event by its ReferenceId property. This allows you to have parent and child relationships.
   * @param name Reference name
   * @param id The reference id that points to a specific event
   */
  public setEventReference(name: string, id: string): EventBuilder {
    if (!name) {
      throw new Error("Invalid name");
    }

    if (!id || !this.isValidIdentifier(id)) {
      throw new Error(`Id ${this._validIdentifierErrorMessage}`);
    }

    this.setProperty("@ref:" + name, id);
    return this;
  }

  public setMessage(message: string | null | undefined): EventBuilder {
    if (message) {
      this.target.message = message;
    }

    return this;
  }

  public setGeo(latitude: number, longitude: number): EventBuilder {
    if (latitude < -90.0 || latitude > 90.0) {
      throw new Error("Must be a valid latitude value between -90.0 and 90.0.");
    }

    if (longitude < -180.0 || longitude > 180.0) {
      throw new Error("Must be a valid longitude value between -180.0 and 180.0.");
    }

    this.target.geo = `${latitude},${longitude}`;
    return this;
  }

  public setUserIdentity(userInfo: UserInfo): EventBuilder;
  public setUserIdentity(identity: string): EventBuilder;
  public setUserIdentity(identity: string, name: string): EventBuilder;
  public setUserIdentity(userInfoOrIdentity: UserInfo | string, name?: string): EventBuilder {
    const userInfo = typeof userInfoOrIdentity !== "string" ? userInfoOrIdentity : { identity: userInfoOrIdentity, name };
    if (!userInfo || (!userInfo.identity && !userInfo.name)) {
      return this;
    }

    this.setProperty(KnownEventDataKeys.UserInfo, userInfo);
    return this;
  }

  /**
   * Sets the user"s description of the event.
   *
   * @param emailAddress The email address
   * @param description The user"s description of the event.
   */
  public setUserDescription(emailAddress: string, description: string): EventBuilder {
    if (emailAddress && description) {
      this.setProperty(KnownEventDataKeys.UserDescription, {
        email_address: emailAddress,
        description
      });
    }

    return this;
  }

  /**
   * Changes default stacking behavior by setting manual
   * stacking information.
   * @param signatureData A dictionary of strings to use for stacking.
   * @param title An optional title for the stacking information.
   */
  public setManualStackingInfo(signatureData: Record<string, string>, title?: string): EventBuilder {
    if (signatureData) {
      const stack: ManualStackingInfo = { signature_data: signatureData };
      if (title) {
        stack.title = title;
      }

      this.setProperty(KnownEventDataKeys.ManualStackingInfo, stack);
    }

    return this;
  }

  /**
   * Changes default stacking behavior by setting the stacking key.
   * @param manualStackingKey The manual stacking key.
   * @param title An optional title for the stacking information.
   */
  public setManualStackingKey(manualStackingKey: string, title?: string): EventBuilder {
    if (manualStackingKey) {
      const data = { ManualStackingKey: manualStackingKey };
      this.setManualStackingInfo(data, title);
    }

    return this;
  }

  /**
   * Sets the event value.
   * @param value The value of the event.
   */
  public setValue(value: number): EventBuilder {
    if (value) {
      this.target.value = value;
    }

    return this;
  }

  public addTags(...tags: string[]): EventBuilder {
    this.target.tags = [...(this.target.tags || []), ...tags];
    return this;
  }

  /**
   * Adds the object to extended data. Uses @excludedPropertyNames
   * to exclude data from being included in the event.
   * @param name The name of the object to add.
   * @param value The data object to add.
   * @param maxDepth The max depth of the object to include.
   * @param excludedPropertyNames Any property names that should be excluded.
   */
  public setProperty(name: string, value: unknown, maxDepth?: number, excludedPropertyNames?: string[]): EventBuilder {
    if (!name || value === undefined || value == null) {
      return this;
    }

    if (!this.target.data) {
      this.target.data = {};
    }

    const exclusions = this.client.config.dataExclusions.concat(excludedPropertyNames || []);
    const json = stringify(value, exclusions, maxDepth);
    if (!isEmpty(json)) {
      this.target.data[name] = JSON.parse(json);
    }

    return this;
  }

  public setContextProperty(name: string, value: unknown): EventBuilder {
    this.context[name] = value;
    return this;
  }

  public markAsCritical(critical: boolean): EventBuilder {
    if (critical) {
      this.addTags("Critical");
    }

    return this;
  }

  public submit(): Promise<EventPluginContext> {
    return this.client.submitEvent(this.target, this.context);
  }

  private isValidIdentifier(value: string): boolean {
    if (!value) {
      return true;
    }

    if (value.length < 8 || value.length > 100) {
      return false;
    }

    for (let index = 0; index < value.length; index++) {
      const code = value.charCodeAt(index);
      const isDigit = code >= 48 && code <= 57;
      const isLetter = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
      const isMinus = code === 45;

      if (!(isDigit || isLetter) && !isMinus) {
        return false;
      }
    }

    return true;
  }
}
