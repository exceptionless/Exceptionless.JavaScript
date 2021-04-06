import { describeStorage } from "@exceptionless/core/test/storage/InMemoryStorage.test";
import { IStorage } from "@exceptionless/core/src/storage/IStorage";
import { BrowserLocalStorage } from "../../src/storage/BrowserLocalStorage.js";

function resetLocalStorage() {
  localStorage.clear();
}

describeStorage(
  "BrowserLocalStorage",
  (): IStorage => new BrowserLocalStorage(),
  resetLocalStorage,
  resetLocalStorage
);
