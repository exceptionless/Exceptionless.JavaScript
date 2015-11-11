import { ContextData } from '../ContextData';
import { EventPluginContext } from '../EventPluginContext';
import { IEvent } from '../../models/IEvent';
import { IError } from '../../models/IError';
import { IErrorParser } from '../../services/IErrorParser';
import { IStackFrame } from '../../models/IStackFrame';

export function createFixture() {
	let contextData: ContextData;
	let context: EventPluginContext;
    let errorParser: IErrorParser;
	let client: any;
	let event: IEvent;

    errorParser = {
		parse: (c: EventPluginContext, exception: Error) => ({
			type: exception.name,
			message: exception.message,
			stack_trace: (<any>exception).testStack || null
		})
    };
	client = {
		config: {
			errorParser,
			log: {
				info: () => { }
			}
		}
    };
    event = {
		data: {}
    };
    contextData = new ContextData();
    context = new EventPluginContext(client, event, contextData);

	return {
		contextData,
		context,
		client,
		event
	}
}
