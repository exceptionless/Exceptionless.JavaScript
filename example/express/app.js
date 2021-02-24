import express from 'express';
const app = express()

import { ExceptionlessClient } from '@exceptionless/node';
const client = ExceptionlessClient.default;
client.config.apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
client.config.serverUrl = 'http://localhost:5000';
client.config.useDebugLogger();
client.config.useLocalStorage();

// set some default data
client.config.defaultData['SampleUser'] = {
  id:1,
  name: 'Blake',
  password: '123456',
  passwordResetToken: 'a reset token',
  myPasswordValue: '123456',
  myPassword: '123456',
  customValue: 'Password',
  value: {
    Password: '123456'
  }
};

client.config.defaultTags.push('Example', 'Node');

app.get('/', function index(req, res) {
  client.submitLog('loading index content');
  res.send('Hello World!');
});

app.get('/about', function about(req, res) {
  client.submitFeatureUsage('about');
  res.send('About');
});

app.get('/boom', function boom(req, res) {
  throw new Error('Boom!!');
});

app.use(function(err, req, res, next) {
  client.createUnhandledException(err, 'express').addRequestInfo(req).submit();
  res.status(500).send('Something broke!');
});

app.use(function(req, res, next) {
  client.createNotFound(req.originalUrl).addRequestInfo(req).submit();
  res.status(404).send('Sorry cant find that!');
});

const server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  var message = 'Example app listening at http://' + host + port;
  console.log(message);
  client.submitLog('app', message , 'Info');
});

export default app;
