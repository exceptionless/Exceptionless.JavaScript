import { KeyValueStorageBase } from '@exceptionless/core';

import * as fs from 'fs';
import * as path from 'path';

export class NodeFileStorage extends KeyValueStorageBase {
  private directory: string;
  private prefix: string

  constructor(namespace: string, folder?: string, prefix: string = 'ex-', maxItems: number = 20) {
    super(maxItems);

    if (!folder) {
      folder = require.main && require.main.filename ? path.join(path.dirname(require.main.filename), '.exceptionless') : '.exceptionless';
    }

    const subFolder = path.join(folder, namespace);
    this.directory = path.resolve(subFolder);
    this.prefix = prefix;

    this.mkdir(this.directory);
  }

  public writeValue(key: string, value: string): void {
    fs.writeFileSync(key, value);
  }

  public readValue(key: string): string {
    return fs.readFileSync(key, 'utf8');
  }

  public removeValue(key: string): void {
    fs.unlinkSync(key);
  }

  public getAllKeys(): string[] {
    return fs.readdirSync(this.directory)
      .filter((file) => file.indexOf(this.prefix) === 0)
      .map((file) => path.join(this.directory, file));
  }

  public getKey(timestamp: number): string {
    return path.join(this.directory, `${this.prefix}${timestamp}.json`);
  }

  public getTimestamp(key: string): number {
    return parseInt(path.basename(key, '.json')
      .substr(this.prefix.length), 10);
  }

  private mkdir(directory: string): void {
    const dirs = directory.split(path.sep);
    let root = '';

    while (dirs.length > 0) {
      const dir = dirs.shift();
      if (dir === '') {
        root = path.sep;
      }

      if (!fs.existsSync(root + dir)) {
        fs.mkdirSync(root + dir);
      }

      root += dir + path.sep;
    }
  }
}
