import { KeyValueStorageBase } from './KeyValueStorageBase';

import * as Fs from 'fs';
import * as Path from 'path';

export class NodeFileStorage extends KeyValueStorageBase {
  private directory: string;
  private prefix: string;
  private fs: any;

  constructor(namespace: string, folder?: string, prefix: string = 'ex-', maxItems: number = 20, fs?: any) {
    super(maxItems);

    if (!folder) {
      folder = Path.join(Path.dirname(require.main.filename), '.exceptionless');
    }
    let subfolder = Path.join(folder, namespace);

    this.directory = Path.resolve(subfolder);
    this.prefix = prefix;
    this.fs = fs ? fs : Fs;

    this.mkdir(this.directory);
  }

  write(key: string, value: string) {
    this.fs.writeFileSync(key, value);
  }

  read(key: string) {
    return this.fs.readFileSync(key, 'utf8');
  }

  readAllKeys() {
    return this.fs.readdirSync(this.directory)
      .filter(file => file.indexOf(this.prefix) === 0)
      .map(file => Path.join(this.directory, file));
  }

  delete(key: string) {
    this.fs.unlinkSync(key);
  }

  getKey(timestamp) {
    return Path.join(this.directory, `${this.prefix}${timestamp}.json`);
  }

  getTimestamp(key) {
    return parseInt(Path.basename(key, '.json')
      .substr(this.prefix.length), 10);
  }

  private mkdir(path) {
    let dirs = path.split(Path.sep);
    let root = '';

    while (dirs.length > 0) {
      let dir = dirs.shift();
      if (dir === '') {
        root = Path.sep;
      }
      if (!this.fs.existsSync(root + dir)) {
        this.fs.mkdirSync(root + dir);
      }
      root += dir + Path.sep;
    }
  };
}
