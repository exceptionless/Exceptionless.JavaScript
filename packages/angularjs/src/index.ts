import { toError } from "@exceptionless/core";
import {
  BrowserExceptionlessClient,
  Exceptionless
} from "@exceptionless/browser";

declare let angular;
angular.module("exceptionless", [])
  .constant("$ExceptionlessClient", Exceptionless)
  .factory("exceptionlessHttpInterceptor", ["$location", "$q", "$ExceptionlessClient", ($location: ng.ILocationService, $q: ng.IQService, $ExceptionlessClient: BrowserExceptionlessClient) => {
    return {
      responseError: function responseError(response: ng.IHttpResponse<{ Message?: string }>) {
        if (response.status === 404) {
          void $ExceptionlessClient.submitNotFound(response.config.url);
        } else if (response.status !== 401) {
          const message = `[${response.status}] ${(response.data?.Message ?? response.config.url)}`;
          void $ExceptionlessClient.createUnhandledException(new Error(message), "errorHttpInterceptor")
            .setSource(response.config.url)
            .setProperty("response", response)
            .setProperty("referrer", $location.absUrl())
            .submit();
        }
        return $q.reject(response);
      }
    };
  }])
  .config(["$httpProvider", "$provide", "$ExceptionlessClient", ($httpProvider: ng.IHttpProvider, $provide: ng.IModule, $ExceptionlessClient: BrowserExceptionlessClient) => {
    $httpProvider.interceptors.push("exceptionlessHttpInterceptor");
    $provide.decorator("$exceptionHandler", ["$delegate", ($delegate: (ex: Error, cause: string) => void) => {
      return (exception: Error, cause: string) => {
        $delegate(exception, cause);
        void $ExceptionlessClient.createUnhandledException(exception, "$exceptionHandler").setMessage(cause).submit();
      };
    }]);
    $provide.decorator("$log", ["$delegate", ($delegate) => {
      function decorateRegularCall(property: string, logLevel: string) {
        const previousFn = $delegate[property];
        return $delegate[property] = (...args: string[]) => {
          if ((angular as { mock?: unknown }).mock) {
            $delegate[property].logs = [];
          }

          // eslint-disable-next-line prefer-spread
          previousFn.apply(null, args);
          if (args[0] && args[0].length > 0) {
            void $ExceptionlessClient.submitLog(undefined, args[0], logLevel);
          }
        };
      }

      $delegate.log = decorateRegularCall("log", "Trace");
      $delegate.info = decorateRegularCall("info", "Info");
      $delegate.warn = decorateRegularCall("warn", "Warn");
      $delegate.debug = decorateRegularCall("debug", "Debug");
      $delegate.error = decorateRegularCall("error", "Error");
      return $delegate;
    }]);
  }])
  .run(["$rootScope", "$ExceptionlessClient", ($rootScope: ng.IRootScopeService, $ExceptionlessClient: BrowserExceptionlessClient) => {
    $rootScope.$on("$routeChangeSuccess", (_event, next, current) => {
      if (!current) {
        return;
      }

      void $ExceptionlessClient.createFeatureUsage(current.name as string)
        .setProperty("next", next)
        .setProperty("current", current)
        .submit();
    });

    $rootScope.$on("$routeChangeError", (_event, current, previous, rejection) => {
      const error: Error = toError(rejection, "Route Change Error");
      void $ExceptionlessClient.createUnhandledException(error, "$routeChangeError")
        .setProperty("current", current)
        .setProperty("previous", previous)
        .submit();
    });

    $rootScope.$on("$stateChangeSuccess", (_event, toState, toParams, fromState, fromParams) => {
      if (!toState || toState.name === "otherwise") {
        return;
      }

      void $ExceptionlessClient.createFeatureUsage((toState.controller || toState.name) as string)
        .setProperty("toState", toState)
        .setProperty("toParams", toParams)
        .setProperty("fromState", fromState)
        .setProperty("fromParams", fromParams)
        .submit();
    });

    $rootScope.$on("$stateNotFound", (_event, unfoundState, fromState, fromParams) => {
      if (!unfoundState) {
        return;
      }

      void $ExceptionlessClient.createNotFound(unfoundState.to as string)
        .setProperty("unfoundState", unfoundState)
        .setProperty("fromState", fromState)
        .setProperty("fromParams", fromParams)
        .submit();
    });

    const stateChangeError = "$stateChangeError";
    $rootScope.$on(stateChangeError, (_event, toState, toParams, fromState, fromParams, error) => {
      if (!error) {
        return;
      }

      const builder = error && error.status === 404 ? $ExceptionlessClient.createNotFound(error.config.url as string) : $ExceptionlessClient.createUnhandledException(error as Error, stateChangeError);
      void builder.setSource(stateChangeError)
        .setMessage(error?.statusText as string)
        .setProperty("toState", toState)
        .setProperty("toParams", toParams)
        .setProperty("fromState", fromState)
        .setProperty("fromParams", fromParams)
        .submit();
    });

    $rootScope.$on("$destroy", () => {
      void $ExceptionlessClient.config.services.queue.process();
    });
  }]);
