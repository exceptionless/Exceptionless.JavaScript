angular.module('exceptionless', [])
    .constant('$ExceptionlessClient', exceptionless.ExceptionlessClient.default)
    .factory('exceptionlessHttpInterceptor', ['$location', '$q', '$ExceptionlessClient', function ($location, $q, $ExceptionlessClient) {
        return {
            responseError: function responseError(response) {
                if (response.status === 404) {
                    $ExceptionlessClient.submitNotFound(response.config.url);
                }
                else if (response.status !== 401) {
                    var message = "[" + response.status + "] " + (response.data && response.data.Message ? response.data.Message : response.config.url);
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
    .config(['$httpProvider', '$provide', '$ExceptionlessClient', function ($httpProvider, $provide, $ExceptionlessClient) {
        $httpProvider.interceptors.push('exceptionlessHttpInterceptor');
        $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
                return function (exception, cause) {
                    $delegate(exception, cause);
                    $ExceptionlessClient.createUnhandledException(exception, '$exceptionHandler').setMessage(cause).submit();
                };
            }]);
        $provide.decorator('$log', ['$delegate', function ($delegate) {
                function decorateRegularCall(property, logLevel) {
                    var previousFn = $delegate[property];
                    return $delegate[property] = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        if (angular.mock) {
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
    .run(['$rootScope', '$ExceptionlessClient', function ($rootScope, $ExceptionlessClient) {
        $rootScope.$on('$routeChangeSuccess', function (event, next, current) {
            if (!current) {
                return;
            }
            $ExceptionlessClient.createFeatureUsage(current.name)
                .setProperty('next', next)
                .setProperty('current', current)
                .submit();
        });
        $rootScope.$on('$routeChangeError', function (event, current, previous, rejection) {
            $ExceptionlessClient.createUnhandledException(new Error(rejection), '$routeChangeError')
                .setProperty('current', current)
                .setProperty('previous', previous)
                .submit();
        });
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
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
        $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
            if (!unfoundState) {
                return;
            }
            $ExceptionlessClient.createNotFound(unfoundState.to)
                .setProperty('unfoundState', unfoundState)
                .setProperty('fromState', fromState)
                .setProperty('fromParams', fromParams)
                .submit();
        });
        var stateChangeError = '$stateChangeError';
        $rootScope.$on(stateChangeError, function (event, toState, toParams, fromState, fromParams, error) {
            if (!error) {
                return;
            }
            var builder = error && error.status === 404 ? $ExceptionlessClient.createNotFound(error.config.url) : $ExceptionlessClient.createUnhandledException(error, stateChangeError);
            builder.setSource(stateChangeError)
                .setMessage(error && error.statusText)
                .setProperty('toState', toState)
                .setProperty('toParams', toParams)
                .setProperty('fromState', fromState)
                .setProperty('fromParams', fromParams)
                .submit();
        });
        $rootScope.$on('$destroy', function () {
            $ExceptionlessClient.config.queue.process();
        });
    }]);
