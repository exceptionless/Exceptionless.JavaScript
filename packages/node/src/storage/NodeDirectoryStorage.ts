import {
  IStorage
} from "@exceptionless/core";

import { mkdirSync } from "fs";
import { readdir, readFile, unlink, writeFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { argv } from "process";

export class NodeDirectoryStorage implements IStorage {
  private directory: string;

  constructor(directory?: string) {
    if (!directory) {
      this.directory = argv && argv.length > 1 ? join(dirname(argv[1]), ".exceptionless") : ".exceptionless";
    } else {
      this.directory = resolve(directory);
    }

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

  public async getItem(key: string): Promise<string | null> {
    try {
      return await readFile(join(this.directory, key), "utf8");
    } catch (ex) {
      if (ex.code === "ENOENT") {
        return null;
      }

      throw ex;
    }
  }

  public async key(index: number): Promise<string | null> {
    const keys = await this.keys();
    return Promise.resolve(index < keys.length ? keys[index] : null);
  }

  public async keys(): Promise<string[]> {
    return await readdir(this.directory);
  }

  public async removeItem(key: string): Promise<void> {
    try {
      await unlink(join(this.directory, key));
    } catch (ex) {
      if (ex.code !== "ENOENT") {
        throw ex;
      }
    }
  }

  public async setItem(key: string, value: string): Promise<void> {
    await writeFile(join(this.directory, key), value);
  }
}
