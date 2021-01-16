import { IInnerError } from './IInnerError';
import { IModule } from './IModule';

export interface IError extends IInnerError {
  modules?: IModule[];
}
