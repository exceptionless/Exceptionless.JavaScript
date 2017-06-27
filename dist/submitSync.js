"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var https = require("https");
var url = require("url");
var child = require("child_process");
var stream = require("stream");
var string_decoder_1 = require("string_decoder");
var NodeSubmissionAdapter = (function () {
    function NodeSubmissionAdapter() {
    }
    NodeSubmissionAdapter.prototype.sendRequest = function (request, callback, isAppExiting) {
        var _this = this;
        if (isAppExiting) {
            this.sendRequestSync(request, callback);
            return;
        }
        var parsedHost = url.parse(request.url);
        var options = {
            auth: "client:" + request.apiKey,
            headers: {},
            hostname: parsedHost.hostname,
            method: request.method,
            port: parsedHost.port && parseInt(parsedHost.port, 10),
            path: request.url
        };
        options.headers['User-Agent'] = request.userAgent;
        if (request.method === 'POST') {
            options.headers = {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(request.data)
            };
        }
        var protocol = (parsedHost.protocol === 'https' ? https : http);
        var clientRequest = protocol.request(options, function (response) {
            var body = '';
            response.setEncoding('utf8');
            response.on('data', function (chunk) { return body += chunk; });
            response.on('end', function () { return _this.complete(response, body, response.headers, callback); });
        });
        clientRequest.on('error', function (error) { return callback && callback(500, error.message); });
        clientRequest.end(request.data);
    };
    NodeSubmissionAdapter.prototype.complete = function (response, responseBody, responseHeaders, callback) {
        var message;
        if (response.statusCode === 0) {
            message = 'Unable to connect to server.';
        }
        else if (response.statusCode < 200 || response.statusCode > 299) {
            message = response.statusMessage || response.message;
        }
        callback && callback(response.statusCode || 500, message, responseBody, responseHeaders);
    };
    NodeSubmissionAdapter.prototype.sendRequestSync = function (request, callback) {
        var requestJson = JSON.stringify(request);
        var res = child.spawnSync(process.execPath, [require.resolve('./submitSync.js')], {
            input: requestJson,
            stdio: ['pipe', 'pipe', process.stderr]
        });
        var out = res.stdout.toString();
        var result = JSON.parse(out);
        callback && callback(result.status, result.message, result.data, result.headers);
    };
    return NodeSubmissionAdapter;
}());
exports.NodeSubmissionAdapter = NodeSubmissionAdapter;
var decoder = new string_decoder_1.StringDecoder('utf8');
var strings = [];
var jsonStream = new stream.Writable();
jsonStream._write = function (chunk, encoding, next) {
    strings.push(decoder.write(chunk));
    next();
};
jsonStream.on('finish', function () {
    var json = strings.join('');
    var request = JSON.parse(json);
    var adapter = new NodeSubmissionAdapter();
    adapter.sendRequest(request, function (status, message, data, headers) {
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
