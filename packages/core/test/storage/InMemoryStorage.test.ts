import { InMemoryStorage } from "#/storage/InMemoryStorage.js";
import { IStorage } from "#/storage/IStorage.js";
import { describeStorage } from "./StorageTestBase.js";

describeStorage("InMemoryStorage", (): IStorage => new InMemoryStorage());
