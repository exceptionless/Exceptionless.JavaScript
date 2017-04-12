import { NodeSubmissionAdapter } from './submission/NodeSubmissionAdapter';
import { SubmissionRequest } from './submission/SubmissionRequest';

import * as stream from 'stream';
import { StringDecoder } from 'string_decoder';

const decoder = new StringDecoder('utf8');
const strings: string[] = [];

const jsonStream = new stream.Writable();
(jsonStream as any)._write = (chunk: Buffer | string, encoding: string, next: () => void) => {
  strings.push(decoder.write( chunk as Buffer));
  next();
};

jsonStream.on('finish', () => {
  const json = strings.join('');
  const request: SubmissionRequest = JSON.parse(json);
  const adapter = new NodeSubmissionAdapter();
  adapter.sendRequest(request, (status, message, data, headers) => {
    const result = {
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
