import {
  mkdirSync,
} from "fs";

import {
  readdir,
  readFile,
  unlink,
  writeFile
} from "fs/promises";

import {
  dirname,
  join,
  resolve
} from "path";

import { argv } from "process";

import { IStorage } from "@exceptionless/core";

export class NodeFileStorage implements IStorage {
  private directory: string;

  constructor(folder?: string) {
    if (!folder) {
      folder = argv && argv.length > 1 ? join(dirname(argv[1]), ".exceptionless") : ".exceptionless";
    }

    this.directory = resolve(folder);
    mkdirSync(this.directory, { recursive: true });
  }

  public async length(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }

  public async clear(): Promise<void> {
    for (const key of await this.keys()) {
      await this.removeItem(key);
    }

    return Promise.resolve();
  }

  public async getItem(key: string): Promise<string> {
    return await readFile(join(this.directory, key), "utf8");
  }

  public async key(index: number): Promise<string> {
    const keys = await this.keys();
    return Promise.resolve(keys[index]);
  }

  public async keys(): Promise<string[]> {
    return await readdir(this.directory);
  }

  public async removeItem(key: string): Promise<void> {
    await unlink(join(this.directory, key));
  }

  public async setItem(key: string, value: string): Promise<void> {
    await writeFile(join(this.directory, key), value);
  }
}
