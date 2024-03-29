import { IStorage } from "@exceptionless/core";
import { describeStorage } from "../../../core/test/storage/StorageTestBase.js";
import { NodeDirectoryStorage } from "../../src/storage/NodeDirectoryStorage.js";
import { mkdirSync, rmSync } from "fs";

const directory: string = "./test/data";

function resetStorageDirectory() {
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory);
}

describeStorage("NodeDirectoryStorage", (): IStorage => new NodeDirectoryStorage(directory), resetStorageDirectory, resetStorageDirectory);
