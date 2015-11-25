function getNonexistentData() {
  /* random comment */ nonexistentArray[arguments[0]]; // second random comment;
}

function sendEvents(numberToSends, eventType) {
  for (var index = 0; index < numberToSends; index++) {
    switch (eventType || getRandomInt(0, 1)) {
      case 0: {
        exceptionless.ExceptionlessClient.default.submitLog('sendEvents', 'This is a test message', 'info');
        break;
      }
      case 1: {
        throwIndexOutOfRange();
        break;
      }
    }
  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function throwDivisionByZero() {
  return divide(10, 0);
}

function throwStringError() {
  return throwStringErrorImpl('string error message');
}

function throwIndexOutOfRange(indexer) {
  try {
    getNonexistentData(indexer);
  } catch (e) {
    exceptionless.ExceptionlessClient.default.submitException(e);
  }
}

function throwStringErrorImpl(message) {
  throw new Error(message);
}

function logClientConfigurationSettings() {
  var client = exceptionless.ExceptionlessClient.default;
  console.log(client.config.settings);
}
