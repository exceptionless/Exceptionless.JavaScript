import { IStorage } from "@exceptionless/core";
import { describeStorage } from "../../../core/test/storage/StorageTestBase.js";
import { NodeDirectoryStorage } from "#/storage/NodeDirectoryStorage.js";
import { mkdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const directory: string = path.join(__dirname, "data");

function resetStorageDirectory() {
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
}

describeStorage("NodeDirectoryStorage", (): IStorage => new NodeDirectoryStorage(directory), resetStorageDirectory, resetStorageDirectory);
