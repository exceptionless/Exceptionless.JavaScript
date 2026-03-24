import { IStorage } from "#/storage/IStorage.js";
import { describeStorage } from "./StorageTestBase.js";
import { LocalStorage } from "#/storage/LocalStorage.js";

function resetLocalStorage() {
  localStorage.clear();
}

describeStorage("LocalStorage", (): IStorage => new LocalStorage(), resetLocalStorage, resetLocalStorage);
