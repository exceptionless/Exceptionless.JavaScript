# Exceptionless.JavaScript
[![Build status](https://ci.appveyor.com/api/projects/status/ahu7u4tvls56wqqu?svg=true)](https://ci.appveyor.com/project/Exceptionless/exceptionless-javascript) [![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/exceptionless/Discuss)

Exceptionless JavaScript/Node client

## Using Exceptionless

### Installing

Please follow the instructions below for installing the exceptionless JavaScript client.

#### JavaScript
Use one of the below methods to install exceptionless into your web app.
##### Bower
1. Install the package by running `bower install exceptionless` or skip this step and use the scripts hosted on our CDN.
2. Add the script to your html page. We recommend placing this as the very first script.
```html
<script src="bower_components/exceptionless/dist/exceptionless.min.js"></script>
```

##### CDN
We will be adding cdn support in the near future.

#### Node.js
Use this method to install exceptionless into your node app.
1. Install the package by running `npm install exceptionless --save-dev`.
2. Add the exceptionless client to your app:
```javascript
var client = require('exceptionless.node').ExceptionlessClient.default;
```

### Configuring the client.
You can configure the exceptionless client a few different ways. The section below will cover the different ways you can configure the ExceptionlessClient. _NOTE: The only required setting that you need to configure is the clients `apiKey`._

#### JavaScript
1. You can configure the `apiKey` as part of the script tag. This will be applied to all new instances of the ExceptionlessClient
  ```html
  <script src="bower_components/exceptionless/dist/exceptionless.min.js?apiKey=API_KEY_HERE"></script>
  ```
2. You can set the `apiKey` on the default ExceptionlessClient instance.
  ```javascript
  exceptionless.ExceptionlessClient.default.config.apiKey = 'API_KEY_HERE';
  ```
3. You can create a new instance of the ExceptionlessClient and specify the `apiKey`, `serverUrl` or [configuration object](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/src/configuration/IConfigurationSettings.ts).
```javascript
var client = new exceptionless.ExceptionlessClient('API_KEY_HERE');
// or with a api key and server url.
var client = new exceptionless.ExceptionlessClient('API_KEY_HERE', 'http://localhost:50000');
// or with a configuration object
var client = new exceptionless.ExceptionlessClient({
  apiKey: 'API_KEY_HERE',
  serverUrl: 'http://localhost:50000',
  submissionBatchSize: 100
});
```

#### Node.js
1. You can set the `apiKey` on the default ExceptionlessClient instance.
  ```javascript
  var client = require('exceptionless.node').ExceptionlessClient.default;
  client.config.apiKey = 'API_KEY_HERE';
  ```
2. You can create a new instance of the ExceptionlessClient and specify the `apiKey`, `serverUrl` or [configuration object](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/src/configuration/IConfigurationSettings.ts).
  ```javascript
  var exceptionless = require('exceptionless.node');

  var client = new exceptionless.ExceptionlessClient('API_KEY_HERE');
  // or with a api key and server url.
  var client = new exceptionless.ExceptionlessClient('API_KEY_HERE', 'http://localhost:50000');
  // or with a configuration object
  var client = new exceptionless.ExceptionlessClient({
    apiKey: 'API_KEY_HERE',
    serverUrl: 'http://localhost:50000',
    submissionBatchSize: 100
  });
  ```

### Sending Events
Once configured, Exceptionless will automatically send any unhandled exceptions that happen in your application. The sections below will show you how to send us different event types as well as customize the data that is sent in.

####Sending Events

You may also want to send us log messages, feature usages or other kinds of events. You can do this very easily with our fluent api.

```javascript
// javascript
var client = exceptionless.ExceptionlessClient.default;
// Node.Js
// var client = require('exceptionless.node').ExceptionlessClient.default;

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
####Manually Sending Errors

In addition to automatically sending all unhandled exceptions, you may want to manually send exceptions to the service. You can do so by using code like this:

```javascript
// javascript
var client = exceptionless.ExceptionlessClient.default;
// Node.Js
// var client = require('exceptionless.node').ExceptionlessClient.default;

try {
  throw new Error('test');
} catch (error) {
  client.submitException(error);
}
```

####Sending Additional Information

You can easily include additional information in your error reports using our fluent [event builder API](https://github.com/exceptionless/Exceptionless.JavaScript/blob/master/src/EventBuilder.ts).
```javascript
// javascript
var client = exceptionless.ExceptionlessClient.default;
// Node.Js
// var client = require('exceptionless.node').ExceptionlessClient.default;

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

The Exceptionless client can also be configured to send data to your self hosted instance. This is configured by setting the serverUrl setting to point to your Exceptionless instance.

#### JavaScript
You can set the `serverUrl` on the default ExceptionlessClient instance.
```javascript
exceptionless.ExceptionlessClient.default.config.serverUrl = 'http://localhost:50000';
```

#### Node.js
You can set the `serverUrl` on the default ExceptionlessClient instance.
```javascript
var client = require('exceptionless.node').ExceptionlessClient.default;
client.config.serverUrl = 'http://localhost:50000';
```

## Getting Started (Development)

The JavaScript client can be installed via [bower](http://bower.io/search/?q=exceptionless), [npm](https://www.npmjs.com/package/exceptionless) or cdn. If you need help, please contact us via in-app support or [open an issue](https://github.com/exceptionless/Exceptionless.JavaScript/issues/new). We’re always here to help if you have any questions!

**This section is for development purposes only! If you are trying to use the Exceptionless JavaScript libraries, please get them from bower, npm or the cdn.**

1. You will need to clone this repo.
2. Install [Node.js](https://nodejs.org). _We only use node for our build and test processes._
3. Install [tsd](https://github.com/DefinitelyTyped/tsd) and [gulp](http://gulpjs.com) and the development dependencies using [npm](https://www.npmjs.com).
```javascript
npm install -g tsd
npm install -g gulp
npm install
```
4. Build the project by running the following gulp command.
```javascript
gulp build
```
5. Test the project by running the following gulp command.
```javascript
gulp test
```
