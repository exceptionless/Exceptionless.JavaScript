import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class SubmissionMethodPlugin implements IEventPlugin {
  public priority:number = 100;
  public name:string = 'SubmissionMethodPlugin';

  public run(context:EventPluginContext, next?:() => void): void {
    let submissionMethod:string = context.contextData.getSubmissionMethod();
    if (!!submissionMethod) {
      context.event.data['@submission_method'] = submissionMethod;
    }

    next && next();
  }
}
