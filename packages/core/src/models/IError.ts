import { IInnerError } from './IInnerError.js';
import { IModule } from './IModule.js';

export interface IError extends IInnerError {
  modules?: IModule[];
}
