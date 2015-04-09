'use strict';

module.exports = function (config) {
  config.set({
    basePath: '.',
    browsers: ['PhantomJS'],
    frameworks: ['jasmine'],
    files: [
      'bower_components/es5-shim/es5-shim.js',
      'bower_components/es6-shim/es6-shim.js',
      'bower_components/DefinitelyTyped/es6-promise/es6-promise.d.ts',
      'bower_components/DefinitelyTyped/jasmine/jasmine.d.ts',
      '**/*.ts'
    ],
    exclude: [],
    preprocessors: {
      '**/*.ts': ['typescript']
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  });
};
