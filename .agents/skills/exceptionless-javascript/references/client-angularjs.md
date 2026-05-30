# @exceptionless/angularjs

Use for AngularJS 1.x apps. The official public docs currently show generic Angular with `@exceptionless/browser`; this repo also ships an AngularJS package.

Docs: https://exceptionless.com/docs/clients/javascript/guides/angular/

## Install

```bash
npm install @exceptionless/angularjs --save
```

CDN or bundled script:

```html
<script type="module" src="https://unpkg.com/@exceptionless/angularjs"></script>
```

## Configure

```js
import "@exceptionless/angularjs";

angular.module("app", ["exceptionless"]).run([
  "$ExceptionlessClient",
  async ($ExceptionlessClient) => {
    await $ExceptionlessClient.startup((config) => {
      config.apiKey = "API_KEY_HERE";
      config.defaultTags.push("Example", "JavaScript", "AngularJS");
    });
  }
]);
```

## Send

```js
angular.module("app").controller("DemoController", [
  "$ExceptionlessClient",
  function ($ExceptionlessClient) {
    this.submit = async function () {
      await $ExceptionlessClient.submitLog("angularjs", "Hello world", "info");
      await $ExceptionlessClient.submitFeatureUsage("DemoButton");
    };
  }
]);
```

The AngularJS package decorates `$exceptionHandler` and `$log`, adds an HTTP response-error interceptor, and submits common route/state events.

## Source Anchors

- `packages/angularjs/README.md`
- `packages/angularjs/src/index.ts`
