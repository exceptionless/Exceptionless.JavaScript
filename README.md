# Exceptionless.JavaScript

[![Build status](https://github.com/Exceptionless/Exceptionless.JavaScript/workflows/Build/badge.svg)](https://github.com/Exceptionless/Exceptionless.JavaScript/actions)
[![Discord](https://img.shields.io/discord/715744504891703319)](https://discord.gg/6HxgFCx)
[![NPM version](https://img.shields.io/npm/v/@exceptionless/core.svg)](https://www.npmjs.org/package/@exceptionless/core)
[![Donate](https://img.shields.io/badge/donorbox-donate-blue.svg)](https://donorbox.org/exceptionless?recurring=true)

The definition of the word exceptionless is: to be without exception. Exceptionless provides real-time error reporting for your JavaScript applications in the browser or in Node.js. It organizes the gathered information into simple actionable data that will help your app become exceptionless!

## Browser

You can install the npm package via `npm install @exceptionless/browser --save`
or via cdn [`https://unpkg.com/@exceptionless/browser](https://unpkg.com/@exceptionless/browser).
Next, you just need to call startup during your apps startup to automatically
capture unhandled errors.

```js
import { Exceptionless } from "https://unpkg.com/@exceptionless/browser";

await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.setUserIdentity("12345678", "Blake");

  // set some default data
   c.defaultData["mydata"] = {
    myGreeting: "Hello World"
  };

  c.defaultTags.push("Example", "JavaScript", "Browser");
});

try {
  throw new Error("test");
} catch (error) {
  await Exceptionless.submitException(error);
}
```

## Node

You can install the npm package via `npm install @exceptionless/node --save`.
Next, you just need to call startup during your apps startup to automatically
capture unhandled errors.

```js
import { Exceptionless } from "@exceptionless/node";

await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.setUserIdentity("12345678", "Blake");

  // set some default data
  c.defaultData["mydata"] = {
    myGreeting: "Hello World"
  };

  c.defaultTags.push("Example", "JavaScript", "Node");
});

try {
  throw new Error("test");
} catch (error) {
  await Exceptionless.submitException(error);
}
```

## Using Exceptionless

### Installation

You can install Exceptionless either in your browser application using a `script`
tag, or you can use the Node Package Manager (npm) to install the package.

#### Browser application

Use one of the following methods to install Exceptionless into your browser application:

##### CDN

  Add the following script tag at the very beginning of your page:

  ```html
<script type="module">
  import { Exceptionless } from "https://unpkg.com/@exceptionless/browser";

  await Exceptionless.startup((c) => {
    c.apiKey = "API_KEY_HERE";
  });
</script>
  ```

##### npm

  1. Install the package by running `npm install @exceptionless/browser --save`.
  2. Import Exceptionless and call startup during app startup.

  ```js
  import { Exceptionless } from "@exceptionless/browser";

  await Exceptionless.startup((c) => {
    c.apiKey = "API_KEY_HERE";
  });
  ```

#### Node.js

Use this method to install Exceptionless into your Node application:

1. Install the package by running `npm install @exceptionless/node --save`.
2. Import the Exceptionless module in your application:

  ```js
  import { Exceptionless } from "@exceptionless/node";

  await Exceptionless.startup((c) => {
    c.apiKey = "API_KEY_HERE";
  });
  ```

### Configuring the client

In order to use Exceptionless, the `apiKey` setting has to be configured first.
You can configure the `ExceptionlessClient` class by calling
`await Exceptionless.startup("API_KEY_HERE");`. If you want to configure
additional client settings you'll want to call the `startup` overload that takes
a callback as shown below:

```js
await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
});
```

Please see the [docs](https://exceptionless.com/docs/clients/javascript/) for
more information on configuring the client.

### Submitting Events and Errors

Once configured, Exceptionless will automatically submit any unhandled exceptions
that happen in your application to the Exceptionless server. The following
sections will show you how to manually submit different event types as well as
customize the data that is sent:

#### Submitting Events

You may also want to submit log messages, feature usage data or other kinds of events. You can do this very easily with the fluent API:

```js
import { Exceptionless } from "@exceptionless/browser";

await Exceptionless.submitLog("Logging made easy");

// You can also specify the log source and log level.
// We recommend specifying one of the following log levels: Trace, Debug, Info, Warn, Error
await Exceptionless.submitLog("app.logger", "This is so easy", "Info");
await Exceptionless.createLog("app.logger", "This is so easy", "Info").addTags("Exceptionless").submit();

// Submit feature usages
await Exceptionless.submitFeatureUsage("MyFeature");
await Exceptionless.createFeatureUsage("MyFeature").addTags("Exceptionless").submit();

// Submit a 404
await Exceptionless.submitNotFound("/somepage");
await Exceptionless.createNotFound("/somepage").addTags("Exceptionless").submit();

// Submit a custom event type
await Exceptionless.submitEvent({ message = "Low Fuel", type = "racecar", source = "Fuel System" });
```

#### Manually submitting Errors

In addition to automatically sending all unhandled exceptions, you may want to
manually send exceptions to the service. You can do so by using code like this:

```js
import { Exceptionless } from "@exceptionless/node";

await Exceptionless.startup("API_KEY_HERE");

try {
  throw new Error("test");
} catch (error) {
  await Exceptionless.submitException(error);
}
```

#### Sending Additional Information

You can easily include additional information in your error reports using the fluent [event builder API](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/packages/core/src/EventBuilder.ts).

```js
import { Exceptionless } from "@exceptionless/node";
await Exceptionless.startup("API_KEY_HERE");

try {
  throw new Error("Unable to create order from quote.");
} catch (error) {
  await Exceptionless.createException(error)
    // Set the reference id of the event so we can search for it later (reference:id).
    .setReferenceId("random guid")
    // Add the order object (the ability to exclude specific fields will be coming in a future version).
    .setProperty("Order", order)
    // Set the quote number.
    .setProperty("Quote", 123)
    // Add an order tag.
    .addTags("Order")
    // Mark critical.
    .markAsCritical()
    // Set the coordinates of the end user.
    .setGeo(43.595089, -88.444602)
    // Set the user id that is in our system and provide a friendly name.
    .setUserIdentity(user.Id, user.FullName)
    // Submit the event.
    .submit();
}
```

## Self hosted options

The Exceptionless client can also be configured to send data to your self hosted
instance. This is configured by setting the `serverUrl` on the default
`ExceptionlessClient` when calling `startup`:

```js
await Exceptionless.startup((c) => {
  c.apiKey = "API_KEY_HERE";
  c.serverUrl = "https://localhost:5100";
});
```

### General Data Protection Regulation

By default the Exceptionless Client will report all available metadata including potential PII data.
You can fine tune the collection of information via Data Exclusions or turning off collection completely.

Please visit the [docs](https://exceptionless.com/docs/clients/javascript/client-configuration/#general-data-protection-regulation)
for detailed information on how to configure the client to meet your requirements.

## Support

If you need help, please contact us via in-app support,
[open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new)
or [join our chat on Discord](https://discord.gg/6HxgFCx). We’re always here to
help if you have any questions!

## Contributing

If you find a bug or want to contribute a feature, feel free to create a pull request.

1. Clone this repository:

    ```sh
    git clone https://github.com/exceptionless/Exceptionless.JavaScript.git
    ```

2. Install [Node.js](https://nodejs.org). Node is used for building and testing purposes.
3. Install the development dependencies using [npm](https://www.npmjs.com).

    ```sh
    npm install
    ```

4. Build the project by running the following command.

    ```sh
    npm run build
    ```

5. Test the project by running the following command.

    ```sh
    npm test
    ```

## Thanks

Thanks to all the people who have contributed!

[![contributors](https://contributors-img.web.app/image?repo=exceptionless/Exceptionless.JavaScript)](https://github.com/exceptionless/Exceptionless.JavaScript/graphs/contributors)
