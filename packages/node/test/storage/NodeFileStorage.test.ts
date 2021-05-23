import { IStorage, LocalStorage } from "@exceptionless/core";
import { describeStorage } from "../../../core/test/storage/StorageTestBase.js";
import { LocalStorage as LocalStoragePolyfill } from "node-localstorage";

import {
  mkdirSync,
  rmSync
} from "fs";

function resetStorageDirectory() {
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory);
}

const directory: string = "./test/data";
describeStorage(
  "NodeFileStorage",
  (): IStorage => new LocalStorage(undefined, new LocalStoragePolyfill(directory)),
  resetStorageDirectory,
  resetStorageDirectory
);
