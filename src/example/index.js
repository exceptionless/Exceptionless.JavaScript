function getNonexistentData() {
  /* random comment */ nonexistentArray[arguments[0]]; // second random comment;
}

function throwDivisionByZero() {
  return divide(10, 0);
}

function throwIndexOutOfRange(indexer) {
  try {
    getNonexistentData(indexer);
  } catch (e) {
    Exceptionless.ExceptionlessClient.default.submitException(e);
  }
}
