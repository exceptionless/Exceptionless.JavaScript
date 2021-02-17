import { EventPluginContext } from '../EventPluginContext.js';
import { IEventPlugin } from '../IEventPlugin.js';

export class SubmissionMethodPlugin implements IEventPlugin {
  public priority: number = 100;
  public name: string = 'SubmissionMethodPlugin';

  public run(context: EventPluginContext, next?: () => void): void {
    const submissionMethod: string = context.contextData.getSubmissionMethod();
    if (submissionMethod) {
      context.event.data['@submission_method'] = submissionMethod;
    }

    next && next();
  }
}
