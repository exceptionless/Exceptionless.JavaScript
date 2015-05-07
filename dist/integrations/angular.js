angular.module('exceptionless', [])
    .constant('$ExceptionlessClient', Exceptionless.ExceptionlessClient.default)
    .factory('exceptionlessHttpInterceptor', ['$q', 'ExceptionlessClient', function ($q, ExceptionlessClient) {
        return {
            responseError: function responseError(rejection) {
                if (rejection.status === 404) {
                    ExceptionlessClient.submitNotFound(rejection.config);
                }
                else {
                    ExceptionlessClient.createUnhandledException(new Error('HTTP response error'), 'errorHttpInterceptor')
                        .setProperty('status', rejection.status)
                        .setProperty('config', rejection.config)
                        .submit();
                }
                return $q.reject(rejection);
            }
        };
    }])
    .config(['$httpProvider', '$provide', 'ExceptionlessClient', function ($httpProvider, $provide, ExceptionlessClient) {
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
                    return $delegate[property] = function () {
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
    }])
    .run(['$rootScope', 'ExceptionlessClient', function ($rootScope, ExceptionlessClient) {
        $rootScope.$on('$routeChangeSuccess', function (event, next, current) {
            ExceptionlessClient.createFeatureUsage(current.name)
                .setProperty('next', next)
                .setProperty('current', current)
                .submit();
        });
        $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
            ExceptionlessClient.createUnhandledException(new Error(rejection), '$routeChangeError')
                .setProperty('current', current)
                .setProperty('previous', previous)
                .submit();
        });
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            if (toState.name === 'otherwise') {
                return;
            }
            ExceptionlessClient.createFeatureUsage(toState.controller || toState.name)
                .setProperty('toState', toState)
                .setProperty('toParams', toParams)
                .setProperty('fromState', fromState)
                .setProperty('fromParams', fromParams)
                .submit();
        });
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            ExceptionlessClient.createNotFound(unfoundState.to)
                .setProperty('unfoundState', unfoundState)
                .setProperty('fromState', fromState)
                .setProperty('fromParams', fromParams)
                .submit();
        });
        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
            if (!error) {
                return;
            }
            ExceptionlessClient.createUnhandledException(error, '$stateChangeError')
                .setProperty('toState', toState)
                .setProperty('toParams', toParams)
                .setProperty('fromState', fromState)
                .setProperty('fromParams', fromParams)
                .submit();
        });
    }]);
