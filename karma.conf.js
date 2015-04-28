'use strict';

module.exports = function (config) {
  config.set({
    basePath: 'src',
    browserNoActivityTimeout: 100000,
    browsers: ['Chrome'],
    frameworks: ['jasmine'],
    files: [
      'node_modules/es5-shim/es5-shim.js',
      'node_modules/es6-shim/es6-shim.js',
      'node_modules/es6-promise/dist/es6-promise.js',
      'node_modules/stackframe/dist/stackframe.js',
      'node_modules/error-stack-parser/dist/error-stack-parser.js',
      'node_modules/stack-generator/dist/stack-generator.js',
      'node_modules/stacktrace-gps/dist/stacktrace-gps.js',
      'node_modules/stacktrace-js/dist/stacktrace.js',
      'typings/tsd.d.ts',
      '**/*.ts'
    ],
    exclude: [],
    preprocessors: {
      '**/*.ts': ['typescript']
    },
    typescriptPreprocessor: {
      options: {
        module: 'commonjs',
        noResolve: true,
        sourceMap: true,
        target: 'ES5'
      },
      transformPath: function(path) {
        return path.replace(/\.ts$/, '.js');
      }
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
