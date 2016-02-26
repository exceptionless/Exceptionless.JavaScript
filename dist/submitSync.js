var NodeSubmissionAdapter_1 = require('./submission/NodeSubmissionAdapter');
var stream = require('stream');
var string_decoder_1 = require('string_decoder');
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
    var adapter = new NodeSubmissionAdapter_1.NodeSubmissionAdapter();
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
