require.config({
  baseUrl: 'node_modules',
  paths: {
    chai: 'chai/chai',
    sinon: 'sinon/pkg/sinon',
    TraceKit: 'tracekit/tracekit'
  }
});

require(['../dist/temp/exceptionless-browserspec' ], function () {
  if (typeof mochaPhantomJS !== "undefined") {
    mochaPhantomJS.run();
  }
  else {

    console.log('running mocha');
    mocha.run();
  }
});
