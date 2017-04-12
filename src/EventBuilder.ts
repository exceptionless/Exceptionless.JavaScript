import { ExceptionlessClient } from './ExceptionlessClient';
import { IEvent } from './models/IEvent';
import { IManualStackingInfo } from './models/IManualStackingInfo';
import { IUserInfo } from './models/IUserInfo';
import { ContextData } from './plugins/ContextData';
import { EventPluginContext } from './plugins/EventPluginContext';
import { Utils } from './Utils';

export class EventBuilder {
  public target: IEvent;
  public client: ExceptionlessClient;
  public pluginContextData: ContextData;

  private _validIdentifierErrorMessage: string = 'must contain between 8 and 100 alphanumeric or \'-\' characters.'; // optimization for minifier.

  constructor(event: IEvent, client: ExceptionlessClient, pluginContextData?: ContextData) {
    this.target = event;
    this.client = client;
    this.pluginContextData = pluginContextData || new ContextData();
  }

  public setType(type: string): EventBuilder {
    if (!!type) {
      this.target.type = type;
    }

    return this;
  }

  public setSource(source: string): EventBuilder {
    if (!!source) {
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
   * @returns {EventBuilder}
   */
  public setEventReference(name: string, id: string): EventBuilder {
    if (!name) {
      throw new Error('Invalid name');
    }

    if (!id || !this.isValidIdentifier(id)) {
      throw new Error(`Id ${this._validIdentifierErrorMessage}`);
    }

    this.setProperty('@ref:' + name, id);
    return this;
  }

  public setMessage(message: string): EventBuilder {
    if (!!message) {
      this.target.message = message;
    }

    return this;
  }

  public setGeo(latitude: number, longitude: number): EventBuilder {
    if (latitude < -90.0 || latitude > 90.0) {
      throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
    }

    if (longitude < -180.0 || longitude > 180.0) {
      throw new Error('Must be a valid longitude value between -180.0 and 180.0.');
    }

    this.target.geo = `${latitude},${longitude}`;
    return this;
  }

  public setUserIdentity(userInfo: IUserInfo): EventBuilder;
  public setUserIdentity(identity: string): EventBuilder;
  public setUserIdentity(identity: string, name: string): EventBuilder;
  public setUserIdentity(userInfoOrIdentity: IUserInfo | string, name?: string): EventBuilder {
    const userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name };
    if (!userInfo || (!userInfo.identity && !userInfo.name)) {
      return this;
    }

    this.setProperty('@user', userInfo);
    return this;
  }

  /**
   * Sets the user's description of the event.
   *
   * @param emailAddress The email address
   * @param description The user's description of the event.
   * @returns {EventBuilder}
   */
  public setUserDescription(emailAddress: string, description: string): EventBuilder {
    if (emailAddress && description) {
      this.setProperty('@user_description', { email_address: emailAddress, description });
    }

    return this;
  }

  /**
   * Changes default stacking behavior by setting manual
   * stacking information.
   * @param signatureData A dictionary of strings to use for stacking.
   * @param title An optional title for the stacking information.
   * @returns {EventBuilder}
   */
  public setManualStackingInfo(signatureData: any, title?: string) {
    if (signatureData) {
      const stack: IManualStackingInfo = { signature_data: signatureData };
      if (title) {
        stack.title = title;
      }

      this.setProperty('@stack', stack);
    }

    return this;
  }

  /**
   * Changes default stacking behavior by setting the stacking key.
   * @param manualStackingKey The manual stacking key.
   * @param title An optional title for the stacking information.
   * @returns {EventBuilder}
   */
  public setManualStackingKey(manualStackingKey: string, title?: string): EventBuilder {
    if (manualStackingKey) {
      const data = { ManualStackingKey: manualStackingKey };
      this.setManualStackingInfo(data, title);
    }

    return this;
  }

  public setValue(value: number): EventBuilder {
    if (!!value) {
      this.target.value = value;
    }

    return this;
  }

  public addTags(...tags: string[]): EventBuilder {
    this.target.tags = Utils.addRange<string>(this.target.tags, ...tags);
    return this;
  }

  /**
   * Adds the object to extended data. Uses @excludedPropertyNames
   * to exclude data from being included in the event.
   * @param name The data object to add.
   * @param value The name of the object to add.
   * @param maxDepth The max depth of the object to include.
   * @param excludedPropertyNames Any property names that should be excluded.
   */
  public setProperty(name: string, value: any, maxDepth?: number, excludedPropertyNames?: string[]): EventBuilder {
    if (!name || (value === undefined || value == null)) {
      return this;
    }

    if (!this.target.data) {
      this.target.data = {};
    }

    const result = JSON.parse(Utils.stringify(value, this.client.config.dataExclusions.concat(excludedPropertyNames || []), maxDepth));
    if (!Utils.isEmpty(result)) {
      this.target.data[name] = result;
    }

    return this;
  }

  public markAsCritical(critical: boolean): EventBuilder {
    if (critical) {
      this.addTags('Critical');
    }

    return this;
  }

  public addRequestInfo(request: object): EventBuilder {
    if (!!request) {
      this.pluginContextData['@request'] = request;
    }

    return this;
  }

  public submit(callback?: (context: EventPluginContext) => void): void {
    this.client.submitEvent(this.target, this.pluginContextData, callback);
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
      const isDigit = (code >= 48) && (code <= 57);
      const isLetter = ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
      const isMinus = code === 45;

      if (!(isDigit || isLetter) && !isMinus) {
        return false;
      }
    }

    return true;
  }
}
