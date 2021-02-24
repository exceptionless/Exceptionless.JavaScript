import { SubmissionRequest } from '@exceptionless/core';
import { NodeSubmissionAdapter } from '@exceptionless/node';

import {
  exit,
  stdin,
  stdout
} from 'process';

import { Writable } from 'stream';
import { StringDecoder } from 'string_decoder';

const decoder = new StringDecoder('utf8');
const strings: string[] = [];

const jsonStream = new Writable();
(jsonStream as any)._write = (chunk: Buffer | string, encoding: string, next: () => void) => {
  strings.push(decoder.write(chunk as Buffer));
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
    stdout.write(JSON.stringify(result));
    exit(0);
  });
});

stdin.pipe(jsonStream);
