import { NodeSubmissionAdapter } from './submission/NodeSubmissionAdapter';
import { SubmissionRequest } from './submission/SubmissionRequest';

import * as stream from 'stream';
import { StringDecoder } from 'string_decoder';

let decoder = new StringDecoder('utf8');
let strings: string[] = [];

let jsonStream = new stream.Writable();
jsonStream._write = (chunk: Buffer | string, encoding: string, next: Function) => {
  strings.push(decoder.write(<Buffer>chunk));
  next();
};

jsonStream.on('finish', () => {
  let json = strings.join('');
  let request: SubmissionRequest = JSON.parse(json);
  let adapter = new NodeSubmissionAdapter();
  adapter.sendRequest(request, (status, message, data, headers) => {
    let result = {
      status,
      message,
      data,
      headers
    };
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  });
});

process.stdin.pipe(jsonStream);
