import { IStorage } from "@exceptionless/core";
import { describeStorage } from "../../../core/test/storage/StorageTestBase.js";
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
