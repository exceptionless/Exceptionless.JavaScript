(function () {
    'use strict';

    var app = angular.module('myApp', [
        'exceptionless',
        'myApp.view1',
        'myApp.view2'
    ]);

    app.config(function(APP_CONSTANTS, $ExceptionlessClient) {
      $ExceptionlessClient.config.apiKey = APP_CONSTANTS.EXCEPTIONLESS_API_KEY;
      $ExceptionlessClient.config.serverUrl = APP_CONSTANTS.EXCEPTIONLESS_SERVER_URL;
      $ExceptionlessClient.config.useDebugLogger();
      $ExceptionlessClient.config.setUserIdentity('12345678', 'Blake');
      $ExceptionlessClient.config.useSessions();
      $ExceptionlessClient.config.defaultTags.push('Example', 'JavaScript', 'Angular');
    });

    app.run(function ($log) {
      $log.info('App starting up...');
    });
})();
