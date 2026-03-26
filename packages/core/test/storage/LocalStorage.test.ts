import { IStorage } from "../../src/storage/IStorage.js";
import { describeStorage } from "./StorageTestBase.js";
import { LocalStorage } from "../../src/storage/LocalStorage.js";

function resetLocalStorage() {
  localStorage.clear();
}

describeStorage("LocalStorage", (): IStorage => new LocalStorage(), resetLocalStorage, resetLocalStorage);
