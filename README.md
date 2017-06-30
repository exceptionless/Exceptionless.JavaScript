# Exceptionless.JavaScript
[![Build status](https://ci.appveyor.com/api/projects/status/ahu7u4tvls56wqqu/branch/master?svg=true)](https://ci.appveyor.com/project/Exceptionless/exceptionless-javascript)
[![Slack Status](https://slack.exceptionless.com/badge.svg)](https://slack.exceptionless.com)
[![NPM version](https://img.shields.io/npm/v/exceptionless.svg)](https://www.npmjs.org/package/exceptionless)
[![Bower version](https://img.shields.io/bower/v/exceptionless.svg)](http://bower.io/search/?q=exceptionless)
[![Donate](https://img.shields.io/badge/donorbox-donate-blue.svg)](https://donorbox.org/exceptionless)

The definition of the word exceptionless is: to be without exception. Exceptionless.js provides real-time error reporting for your JavaScript applications in the browser or in Node.js. It organizes the gathered information into simple actionable data that will help your app become exceptionless!

## Show me the code! ##

```html
<script src="https://cdn.rawgit.com/exceptionless/Exceptionless.JavaScript/v1.5.3/dist/exceptionless.min.js"></script>
<script>
  var client = exceptionless.ExceptionlessClient.default;
  client.config.apiKey = 'API_KEY_HERE';

  try {
    throw new Error('test');
  } catch (error) {
    client.submitException(error);
  }
</script>
```

```javascript
var client = require('exceptionless').ExceptionlessClient.default;
client.config.apiKey = 'API_KEY_HERE';

try {
  throw new Error('test');
} catch (error) {
  client.submitException(error);
}

```

## Using Exceptionless

### Installation

You can install Exceptionless.js either in your browser application using Bower or a `script` tag, or you can use the Node Package Manager (npm) to install the Node.js package.

#### Browser application
Use one of the following methods to install Exceptionless.js into your browser application:

- **CDN:**

  Add the following script to your page:

  ```html
  <script src="https://cdn.rawgit.com/exceptionless/Exceptionless.JavaScript/v1.5.3/dist/exceptionless.min.js"></script>
  ```

- **Bower:**

  1. Install the package by running `bower install exceptionless`.
  2. Add the script to your HTML page:

    ```html
    <script src="bower_components/exceptionless/dist/exceptionless.min.js"></script>
    ```

In either case, we recommend placing the `script` tag at the very beginning of your page.

#### Node.js
Use this method to install Exceptionless.js into your Node application:

1. Install the package by running `npm install exceptionless --save`.
2. Require the Exceptionless.js module in your application:

  ```javascript
  var client = require('exceptionless').ExceptionlessClient.default;
  ```

### Configuring the client
In order to use Exceptionless.js, the `apiKey` setting has to be configured first.
You can configure the `ExceptionlessClient` class using one of the following ways:

#### Browser application
- You can configure the `apiKey` as part of the script tag. This will be applied to all new instances of the `ExceptionlessClient` class:

  ```html
  <script src="bower_components/exceptionless/dist/exceptionless.min.js?apiKey=API_KEY_HERE"></script>
  ```

- You can set the `apiKey` on the default `ExceptionlessClient` instance:

  ```javascript
  exceptionless.ExceptionlessClient.default.config.apiKey = 'API_KEY_HERE';
  ```

- You can create a new instance of the `ExceptionlessClient` class and specify the `apiKey`, `serverUrl` or [configuration object](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/src/configuration/IConfigurationSettings.ts):

  ```javascript
  var client = new exceptionless.ExceptionlessClient('API_KEY_HERE');
  // or with an api key and server url
  var client = new exceptionless.ExceptionlessClient('API_KEY_HERE', 'http://localhost:50000');
  // or with a configuration object
  var client = new exceptionless.ExceptionlessClient({
    apiKey: 'API_KEY_HERE',
    serverUrl: 'http://localhost:50000',
    submissionBatchSize: 100
  });
  ```

#### Node.js
- You can set the `apiKey` on the default `ExceptionlessClient` instance:

  ```javascript
  var client = require('exceptionless').ExceptionlessClient.default;
  client.config.apiKey = 'API_KEY_HERE';
  ```

- You can create a new instance of the `ExceptionlessClient` class and specify the `apiKey`, `serverUrl` or [configuration object](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/src/configuration/IConfigurationSettings.ts):

  ```javascript
  var exceptionless = require('exceptionless');

  var client = new exceptionless.ExceptionlessClient('API_KEY_HERE');
  // or with an api key and server url
  var client = new exceptionless.ExceptionlessClient('API_KEY_HERE', 'http://localhost:50000');
  // or with a configuration object
  var client = new exceptionless.ExceptionlessClient({
    apiKey: 'API_KEY_HERE',
    serverUrl: 'http://localhost:50000',
    submissionBatchSize: 100
  });
  ```

### Submitting Events and Errors
Once configured, Exceptionless.js will automatically submit any unhandled exceptions that happen in your application to the Exceptionless server. The following sections will show you how to manually submit different event types as well as customize the data that is sent:

####Submitting Events

You may also want to submit log messages, feature usage data or other kinds of events. You can do this very easily with the fluent API:

```javascript
// Browser
var client = exceptionless.ExceptionlessClient.default;
// Node.js
// var client = require('exceptionless').ExceptionlessClient.default;

client.submitLog('Logging made easy');

// You can also specify the log source and log level.
// We recommend specifying one of the following log levels: Trace, Debug, Info, Warn, Error
client.submitLog('app.logger', 'This is so easy', 'Info');
client.createLog('app.logger', 'This is so easy', 'Info').addTags('Exceptionless').submit();

// Submit feature usages
client.submitFeatureUsage('MyFeature');
client.createFeatureUsage('MyFeature').addTags('Exceptionless').submit();

// Submit a 404
client.submitNotFound('/somepage');
client.createNotFound('/somepage').addTags('Exceptionless').submit();

// Submit a custom event type
client.submitEvent({ message = 'Low Fuel', type = 'racecar', source = 'Fuel System' });
```
####Manually submitting Errors

In addition to automatically sending all unhandled exceptions, you may want to manually send exceptions to the service. You can do so by using code like this:

```javascript
// Browser
var client = exceptionless.ExceptionlessClient.default;
// Node.js
// var client = require('exceptionless').ExceptionlessClient.default;

try {
  throw new Error('test');
} catch (error) {
  client.submitException(error);
}
```

####Sending Additional Information

You can easily include additional information in your error reports using the fluent [event builder API](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/src/EventBuilder.ts).

```javascript
// Browser
var client = exceptionless.ExceptionlessClient.default;
// Node.js
// var client = require('exceptionless').ExceptionlessClient.default;

try {
  throw new Error('Unable to create order from quote.');
} catch (error) {
  client.createException(error)
    // Set the reference id of the event so we can search for it later (reference:id).
    // This will automatically be populated if you call client.config.useReferenceIds();
    .setReferenceId('random guid')
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

The Exceptionless client can also be configured to send data to your self hosted instance. This is configured by setting the `serverUrl` setting to point to your Exceptionless instance:

#### Browser
You can set the `serverUrl` on the default `ExceptionlessClient` instance:

```javascript
exceptionless.ExceptionlessClient.default.config.serverUrl = 'http://localhost:50000';
```

#### Node.js
You can set the `serverUrl` on the default `ExceptionlessClient` instance:

```javascript
var client = require('exceptionless.node').ExceptionlessClient.default;
client.config.serverUrl = 'http://localhost:50000';
```

## Support

If you need help, please contact us via in-app support, [open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new) or [join our chat on gitter](https://gitter.im/exceptionless/Discuss). We’re always here to help if you have any questions!

## Contributing

If you find a bug or want to contribute a feature, feel free to create a pull request.

1. Clone this repository:

  ```sh
  git clone https://github.com/exceptionless/Exceptionless.JavaScript.git
  ```

2. Install [Node.js](https://nodejs.org). Node is used for building and testing purposes.

3. Install [tsd](https://github.com/DefinitelyTyped/tsd) and [gulp](http://gulpjs.com) and the development dependencies using [npm](https://www.npmjs.com).

  ```sh
  npm install
  ```

4. Build the project by running the following gulp command.

  ```sh
  npm run build
  ```

5. Test the project by running the following gulp command.

  ```sh
  npm run test
  ```

During development, you can use relative paths to require Exceptionless, e.g. `require('./dist/exceptionless.node.js')` when you are running Node.js from the git root directory.
