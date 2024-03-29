# Exceptionless AngularJS

This package provides native JavaScript support for AngularJS applications.

## Getting Started

To use this package, your must be using ES6 and support ESM modules.

## Installation

You can install Exceptionless either in your browser application using a `script`
tag, or you can use the Node Package Manager (npm) to install the package.

### CDN

Add the following script tag at the very beginning of your page:

```html
<script type="module" src="https://unpkg.com/@exceptionless/angularjs"></script>
```

### npm

1. Install the package by running `npm install @exceptionless/angularjs --save`.
2. Add the following script tag at the very beginning of your page:

```html
<script type="module" src="node_modules/@exceptionless/angularjs/dist/index.bundle.js"></script>
```

## Configuration

1. Import `exceptionless` angular module like this: `angular.module("app", ["exceptionless"])`
2. Inject `$ExceptionlessClient` and call startup during app startup.

```js
angular
  .module("app", ["exceptionless"])
  .config(function ($ExceptionlessClient) {
    await $ExceptionlessClient.startup((c) => {
      c.apiKey = "API_KEY_HERE";

      c.defaultTags.push("Example", "JavaScript", "angularjs");
    });
  });
```

Once that's done, you can use the Exceptionless client anywhere in your app by
importing `$ExceptionlessClient` followed by the method you want to use. For example:

```js
await $ExceptionlessClient.submitLog("Hello world!");
```

Please see the [docs](https://exceptionless.com/docs/clients/javascript/) for
more information on configuring the client.

## Support

If you need help, please contact us via in-app support,
[open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new)
or [join our chat on Discord](https://discord.gg/6HxgFCx). We’re always here to
help if you have any questions!
