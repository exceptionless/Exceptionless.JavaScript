function getNonexistentData() {
  /* random comment */ nonexistentArray[arguments[0]]; // second random comment;
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
    Exceptionless.ExceptionlessClient.default.submitException(e);
  }
}

function throwStringErrorImpl(message) {
  throw new Error(message);
}
