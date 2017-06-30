// Update once ts issue is fixed: https://github.com/Microsoft/TypeScript/issues/2192
// import * as exceptionless from '../../dist/exceptionless'
declare var exceptionless;

angular.module('exceptionless', [])
  .constant('$ExceptionlessClient', exceptionless.ExceptionlessClient.default)
  .factory('exceptionlessHttpInterceptor', ['$location', '$q', '$ExceptionlessClient', ($location, $q, $ExceptionlessClient) => {
    return {
      responseError: function responseError(response) {
        if (response.status === 404) {
          $ExceptionlessClient.submitNotFound(response.config.url);
        } else if (response.status !== 401) {
          const message = `[${response.status}] ${(response.data && response.data.Message ? response.data.Message : response.config.url)}`;
          $ExceptionlessClient.createUnhandledException(new Error(message), 'errorHttpInterceptor')
            .setSource(response.config.url)
            .setProperty('response', response)
            .setProperty('referrer', $location.absUrl())
            .submit();
        }
        return $q.reject(response);
      }
    };
  }])
  .config(['$httpProvider', '$provide', '$ExceptionlessClient', ($httpProvider, $provide, $ExceptionlessClient) => {
    $httpProvider.interceptors.push('exceptionlessHttpInterceptor');
    $provide.decorator('$exceptionHandler', ['$delegate', ($delegate) => {
      return (exception, cause) => {
        $delegate(exception, cause);
        $ExceptionlessClient.createUnhandledException(exception, '$exceptionHandler').setMessage(cause).submit();
      };
    }]);
    $provide.decorator('$log', ['$delegate', ($delegate) => {
      function decorateRegularCall(property, logLevel) {
        const previousFn = $delegate[property];
        return $delegate[property] = (...args) => {
          if (angular.mock) {
            // Needed to support angular-mocks.
            $delegate[property].logs = [];
          }
          previousFn.apply(null, args);
          if (args[0] && args[0].length > 0) {
            $ExceptionlessClient.submitLog(null, args[0], logLevel);
          }
        };
      }

      $delegate.log = decorateRegularCall('log', 'Trace');
      $delegate.info = decorateRegularCall('info', 'Info');
      $delegate.warn = decorateRegularCall('warn', 'Warn');
      $delegate.debug = decorateRegularCall('debug', 'Debug');
      $delegate.error = decorateRegularCall('error', 'Error');
      return $delegate;
    }]);
  }])
  .run(['$rootScope', '$ExceptionlessClient', ($rootScope, $ExceptionlessClient) => {
    $rootScope.$on('$routeChangeSuccess', (event, next, current) => {
      if (!current) {
        return;
      }

      $ExceptionlessClient.createFeatureUsage(current.name)
        .setProperty('next', next)
        .setProperty('current', current)
        .submit();
    });

    $rootScope.$on('$routeChangeError', (event, current, previous, rejection) => {
      $ExceptionlessClient.createUnhandledException(new Error(rejection), '$routeChangeError')
        .setProperty('current', current)
        .setProperty('previous', previous)
        .submit();
    });

    $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
      if (!toState || toState.name === 'otherwise') {
        return;
      }

      $ExceptionlessClient.createFeatureUsage(toState.controller || toState.name)
        .setProperty('toState', toState)
        .setProperty('toParams', toParams)
        .setProperty('fromState', fromState)
        .setProperty('fromParams', fromParams)
        .submit();
    });

    $rootScope.$on('$stateNotFound', (event, unfoundState, fromState, fromParams) => {
      if (!unfoundState) {
        return;
      }

      $ExceptionlessClient.createNotFound(unfoundState.to)
        .setProperty('unfoundState', unfoundState)
        .setProperty('fromState', fromState)
        .setProperty('fromParams', fromParams)
        .submit();
    });

    const stateChangeError = '$stateChangeError';
    $rootScope.$on(stateChangeError, (event, toState, toParams, fromState, fromParams, error) => {
      if (!error) {
        return;
      }

      const builder = error && error.status === 404 ? $ExceptionlessClient.createNotFound(error.config.url) : $ExceptionlessClient.createUnhandledException(error, stateChangeError);
      builder.setSource(stateChangeError)
        .setMessage(error && error.statusText)
        .setProperty('toState', toState)
        .setProperty('toParams', toParams)
        .setProperty('fromState', fromState)
        .setProperty('fromParams', fromParams)
        .submit();
    });

    $rootScope.$on('$destroy', () => {
      $ExceptionlessClient.config.queue.process();
    });
  }]);
