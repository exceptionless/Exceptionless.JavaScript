function getNonexistentData() {
  /* random comment */ nonexistentArray[arguments[0]]; // second random comment;
}

function sendEvents(numberToSends, eventType) {
  for (var index = 0; index < numberToSends; index++) {
    switch (eventType || getRandomInt(0, 5)) {
      case 0: {
        throwIndexOutOfRange();
        break;
      }
      case 1: {
        exceptionless.ExceptionlessClient.default.submitLog('sendEvents', 'This is a test trace message', 'trace');
        break;
      }
      case 2: {
        exceptionless.ExceptionlessClient.default.submitLog('sendEvents', 'This is a test debug message', 'debug');
        break;
      }
      case 3: {
        exceptionless.ExceptionlessClient.default.submitLog('sendEvents', 'This is a test info message', 'info');
        break;
      }
      case 4: {
        exceptionless.ExceptionlessClient.default.submitLog('sendEvents', 'This is a test warn message', 'warn');
        break;
      }
      case 5: {
        exceptionless.ExceptionlessClient.default.submitLog('sendEvents', 'This is a test error message', 'error');
        break;
      }
    }
  }
}

function getRandomInt(min, max) {
  exceptionless.ExceptionlessClient.default.submitLog('getting random int min:' + min + ' max:' + max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function throwDivisionByZero() {
  return divide(10, 0);
}

function throwStringError() {
  return throwStringErrorImpl('string error message');
}

function throwIndexOutOfRange(indexer, withCustomStacking) {
  try {
    getNonexistentData(indexer);
  } catch (e) {
    var client = exceptionless.ExceptionlessClient.default;
    if (withCustomStacking) {
      if (Math.random() < .5) {
        client.createException(e).setManualStackingKey('MyCustomStackingKey').submit();
      } else {
        client.createException(e).setManualStackingInfo({
          File: 'index.js',
          Function: 'throwIndexOutOfRange'
        }, 'Custom Index Out Of Range Exception').submit();
      }
    } else {
      client.submitException(e);
    }
  }
}

function throwStringErrorImpl(message) {
  throw new Error(message);
}

function logClientConfigurationSettings() {
  var client = exceptionless.ExceptionlessClient.default;
  console.log(client.config.settings);
}
