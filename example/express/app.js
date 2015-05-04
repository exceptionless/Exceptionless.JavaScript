var express = require('express');
var app = express();

var client = require('../../dist/exceptionless.es5').ExceptionlessClient.default;
client.config.apiKey = 'LhhP1C9gijpSKCslHHCvwdSIz298twx271n1l6xw';
client.config.serverUrl = 'http://localhost:50000';
client.config.useDebugLogger();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/about', function (req, res) {
  client.submitFeatureUsage('about');
  res.send('About');
});

app.get('/boom', function (req, res) {
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

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  var message = 'Example app listening at http://' + host + port;
  console.log(message);
  client.submitLog('app', message , 'Info');
});
