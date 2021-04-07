import { InMemoryStorage } from "../../src/storage/InMemoryStorage.js";
import { IStorage } from "../../src/storage/IStorage.js";
import { describeStorage } from "./StorageTestBase.js";

describeStorage(
  "InMemoryStorage",
  (): IStorage => new InMemoryStorage()
);
