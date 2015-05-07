angular.module('exceptionless', [])
  .value('ExceptionlessClient', Exceptionless.ExceptionlessClient.default)
  .factory('exceptionlessHttpInterceptor', ['$q', 'ExceptionlessClient', function ($q, ExceptionlessClient) {
    return {
      responseError: function responseError(rejection) {
        if (rejection.status === 404) {
          ExceptionlessClient.submitNotFound(rejection.config);
        } else {
          ExceptionlessClient.createUnhandledException(new Error('HTTP response error'), 'errorHttpInterceptor')
            .setProperty('status', rejection.status)
            .setProperty('config', rejection.config)
            .submit();
        }

        return $q.reject(rejection);
      }
    };
  }])
  .config(['$httpProvider', '$provide', 'ExceptionlessClient', function($httpProvider, $provide, ExceptionlessClient) {
    $httpProvider.interceptors.push('exceptionlessHttpInterceptor');

    $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
      return function (exception, cause) {
        $delegate(exception, cause);
        ExceptionlessClient.createUnhandledException(exception, '$exceptionHandler').setMessage(cause).submit();
      };
    }]);
    $provide.decorator('$log', ['$delegate', function ($delegate) {
      function decorateRegularCall(property, logLevel) {
        var previousFn = $delegate[property];
        $delegate[property] = function () {
          previousFn.call(null, arguments);
          ExceptionlessClient.submitLog('Angular', arguments[0], logLevel);
        };
      }

      $delegate.log = decorateRegularCall('log', 'Trace');
      $delegate.info = decorateRegularCall('info', 'Info');
      $delegate.warn = decorateRegularCall('warn', 'Warn');
      $delegate.debug = decorateRegularCall('debug', 'Debug');
      $delegate.error = decorateRegularCall('error', 'Error');
      return $delegate;
    }]);
  }]);

declare var ExceptionlessClient;
