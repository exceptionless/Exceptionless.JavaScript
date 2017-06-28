import { browserInit, isBrowser } from './exceptionless';
import { isNode, nodeInit } from './exceptionless.node';
import { ExceptionlessClient } from './ExceptionlessClient';

if (isNode()) {
  nodeInit();
  ExceptionlessClient.default.config.log.trace('Using node Exceptionless implementation.');
} else if (isBrowser()) {
  browserInit();
  ExceptionlessClient.default.config.log.trace('Using browser Exceptionless implementation.');
} else {
  ExceptionlessClient.default.config.log.error('No Exceptionless implementation was found.');
}
