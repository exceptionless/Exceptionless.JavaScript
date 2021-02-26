import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync
} from "fs";

import {
  basename,
  dirname,
  join,
  resolve,
  sep
} from "path";

import { argv } from "process";

import { KeyValueStorageBase } from "@exceptionless/core";

export class NodeFileStorage extends KeyValueStorageBase {
  private directory: string;
  private prefix: string

  constructor(namespace: string, folder?: string, prefix: string = "ex-", maxItems: number = 20) {
    super(maxItems);

    if (!folder) {
      folder = argv && argv.length > 1 ? join(dirname(argv[1]), ".exceptionless") : ".exceptionless";
    }

    const subFolder = join(folder, namespace);
    this.directory = resolve(subFolder);
    this.prefix = prefix;

    this.mkdir(this.directory);
  }

  public writeValue(key: string, value: string): void {
    writeFileSync(key, value);
  }

  public readValue(key: string): string {
    return readFileSync(key, "utf8");
  }

  public removeValue(key: string): void {
    unlinkSync(key);
  }

  public getAllKeys(): string[] {
    return readdirSync(this.directory)
      .filter((file) => file.indexOf(this.prefix) === 0)
      .map((file) => join(this.directory, file));
  }

  public getKey(timestamp: number): string {
    return join(this.directory, `${this.prefix}${timestamp}.json`);
  }

  public getTimestamp(key: string): number {
    return parseInt(basename(key, ".json")
      .substr(this.prefix.length), 10);
  }

  private mkdir(directory: string): void {
    const dirs = directory.split(sep);
    let root = "";

    while (dirs.length > 0) {
      const dir = dirs.shift();
      if (dir === "") {
        root = sep;
      }

      if (!existsSync(root + dir)) {
        mkdirSync(root + dir);
      }

      root += dir + sep;
    }
  }
}
