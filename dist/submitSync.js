var stream = require("stream");
var http = require("http");
var https = require('https');
var url = require('url');
function complete(response, responseBody, responseHeaders, callback) {
    var message;
    if (response.statusCode === 0) {
        message = 'Unable to connect to server.';
    }
    else if (response.statusCode < 200 || response.statusCode > 299) {
        message = response.statusMessage || response.message;
    }
    callback(response.statusCode || 500, message, responseBody, responseHeaders);
}
function submitRequest(request, callback) {
    var parsedHost = url.parse(request.serverUrl);
    var options = {
        auth: "client:" + request.apiKey,
        headers: {},
        hostname: parsedHost.hostname,
        method: request.method,
        port: parsedHost.port && parseInt(parsedHost.port),
        path: request.path
    };
    options.headers['User-Agent'] = request.userAgent;
    if (request.method === 'POST') {
        options.headers = {
            'Content-Type': 'application/json',
            'Content-Length': request.data.length
        };
    }
    var protocol = (parsedHost.protocol === 'https' ? https : http);
    var clientRequest = protocol.request(options, function (response) {
        var body = '';
        response.setEncoding('utf8');
        response.on('data', function (chunk) { return body += chunk; });
        response.on('end', function () { return complete(response, body, response.headers, callback); });
    });
    clientRequest.on('error', function (error) { return callback(500, error.message); });
    clientRequest.end(request.data);
}
exports.submitRequest = submitRequest;
var string_decoder_1 = require('string_decoder');
var decoder = new string_decoder_1.StringDecoder('utf8');
var strings = [];
var jsonStream = new stream.Writable();
jsonStream._write = function (chunk, encoding, next) {
    strings.push(decoder.write(chunk));
    next();
};
jsonStream.on("finish", function () {
    var json = strings.join("");
    var request = JSON.parse(json);
    submitRequest(request, function (status, message, data, headers) {
        var result = {
            status: status,
            message: message,
            data: data,
            headers: headers
        };
        process.stdout.write(JSON.stringify(result));
        process.exit(0);
    });
});
process.stdin.pipe(jsonStream);

//# sourceMappingURL=submitSync.js.map