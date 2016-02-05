import { KeyValueStorageBase } from './KeyValueStorageBase';

import * as Fs from 'fs';
import * as Path from 'path';

export class NodeFileStorage extends KeyValueStorageBase {
  private directory: string;
  private fs: any;

  constructor(folder: string, maxItems: number = 20, fs?: any) {
    super(maxItems);

    this.directory = Path.resolve(folder);
    this.fs = fs ? fs : Fs;

    this.mkdir(this.directory);
  }

  write(key: string, value: string) {
    this.fs.writeFileSync(key, value);
  }

  read(key: string) {
    return this.fs.readFileSync(key, 'utf8');
  }

  readDate(key: string) {
    return this.fs.statSync(key).birthtime.getTime();
  }

  delete(key: string) {
    this.fs.unlinkSync(key);
  }

  getEntries() {
    return this.fs.readdirSync(this.directory);
  }

  getKey(entry) {
    let filename = super.getKey(entry);
    return Path.join(this.directory, filename);
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


