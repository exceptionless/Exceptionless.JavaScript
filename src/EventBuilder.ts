import { Configuration } from './configuration/Configuration';
import { ExceptionlessClient } from './ExceptionlessClient';
import { IEvent } from './models/IEvent';
import { IUserInfo } from './models/IUserInfo';
import { ContextData } from './plugins/ContextData';
import { EventPluginContext } from './plugins/EventPluginContext';
import { Utils } from 'Utils';

export class EventBuilder {
  private _validIdentifierErrorMessage:string = "must contain between 8 and 100 alphanumeric or '-' characters.";

  public target:IEvent;
  public client:ExceptionlessClient;
  public pluginContextData:ContextData;

  constructor(event:IEvent, client:ExceptionlessClient, pluginContextData?:ContextData) {
    this.target = event;
    this.client = client;
    this.pluginContextData = pluginContextData || new ContextData();
  }

  public setType(type:string): EventBuilder {
    if (!!type && type.length > 0) {
      this.target.type = type;
    }

    return this;
  }

  public setSource(source:string): EventBuilder {
    if (!!source && source.length > 0) {
      this.target.source = source;
    }

    return this;
  }

  public setSessionId(sessionId:string): EventBuilder {
    if (!this.isValidIdentifier(sessionId)) {
      throw new Error(`SessionId ${this._validIdentifierErrorMessage}`);
    }

    this.target.session_id = sessionId;
    return this;
  }

  public setReferenceId(referenceId:string): EventBuilder {
    if (!this.isValidIdentifier(referenceId)) {
      throw new Error(`ReferenceId ${this._validIdentifierErrorMessage}`);
    }

    this.target.reference_id = referenceId;
    return this;
  }

  public setMessage(message:string): EventBuilder {
    if (!!message && message.length > 0) {
      this.target.message = message;
    }

    return this;
  }

  public setGeo(latitude: number, longitude: number): EventBuilder {
    if (latitude < -90.0 || latitude > 90.0)
      throw new Error('Must be a valid latitude value between -90.0 and 90.0.');
    if (longitude < -180.0 || longitude > 180.0)
      throw new Error('Must be a valid longitude value between -180.0 and 180.0.');

    this.target.geo = `${latitude},${longitude}`;
    return this;
  }

  public setUserIdentity(userInfo:IUserInfo): EventBuilder;
  public setUserIdentity(identity:string): EventBuilder;
  public setUserIdentity(identity:string, name:string): EventBuilder;
  public setUserIdentity(userInfoOrIdentity:IUserInfo|string, name?:string): EventBuilder {
    var userInfo = typeof userInfoOrIdentity !== 'string' ? userInfoOrIdentity : { identity: userInfoOrIdentity, name: name };
    if (!userInfo || (!userInfo.identity && !userInfo.name)) {
      return this;
    }

    this.setProperty('@user', userInfo);
    return this;
  }

  public setValue(value:number): EventBuilder {
    if (!!value) {
      this.target.value = value;
    }

    return this;
  }

  public addTags(...tags:string[]): EventBuilder {
    this.target.tags = Utils.addRange<string>(this.target.tags, ...tags);
    return this;
  }

  public setProperty(name:string, value:any): EventBuilder {
    if (!name || (value === undefined || value == null)) {
      return this;
    }

    if (!this.target.data) {
      this.target.data = {};
    }

    this.target.data[name] = value;
    return this;
  }

  public markAsCritical(critical:boolean): EventBuilder {
    if (critical) {
      this.addTags('Critical');
    }

    return this;
  }

  //todo: rename this
  public addRequestInfo(request:Object): EventBuilder {
    if (!!request) {
      this.pluginContextData['@request'] = request;
    }

    return this;
  }

  public submit(callback?:(context:EventPluginContext) => void): void {
    this.client.submitEvent(this.target, this.pluginContextData, callback);
  }

  private isValidIdentifier(value:string): boolean {
    if (!value || !value.length) {
      return true;
    }

    if (value.length < 8 || value.length > 100) {
      return false;
    }

    for (var index = 0; index < value.length; index++) {
      var code = value.charCodeAt(index);
      var isDigit = (code >= 48) && (code <= 57);
      var isLetter = ((code >= 65) && (code <= 90)) || ((code >= 97) && (code <= 122));
      var isMinus = code === 45;

      if (!(isDigit || isLetter) && !isMinus) {
        return false;
      }
    }

    return true;
  }
}
