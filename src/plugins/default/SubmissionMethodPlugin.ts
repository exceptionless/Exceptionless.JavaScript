import { IEventPlugin } from '../IEventPlugin';
import { EventPluginContext } from '../EventPluginContext';

export class SubmissionMethodPlugin implements IEventPlugin {
  public priority:number = 100;
  public name:string = 'SubmissionMethodPlugin';

  run(context:EventPluginContext):Promise<any> {
    var submissionMethod:string = context.contextData.getSubmissionMethod();
    if (!!submissionMethod) {
      if (!context.event.data) {
        context.event.data = {};
      }

      context.event.data['@submission_method'] = submissionMethod;
    }

    return Promise.resolve();
  }
}
