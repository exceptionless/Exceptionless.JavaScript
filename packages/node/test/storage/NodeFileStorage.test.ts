import { IStorage } from "@exceptionless/core";
import { describeStorage } from "../../../core/test/storage/StorageTestBase.js";
import { NodeFileStorage } from "../../src/storage/NodeFileStorage.js";

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
  (): IStorage => new NodeFileStorage(directory),
  resetStorageDirectory,
  resetStorageDirectory
);
