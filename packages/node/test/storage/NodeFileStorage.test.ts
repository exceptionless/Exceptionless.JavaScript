import { describeStorage } from '../../../core/test/storage/InMemoryStorage.test.js';
import { IStorage } from "../../../core/src/storage/IStorage.js";
import { NodeFileStorage } from '../../src/storage/NodeFileStorage.js';

import * as fs from 'fs';

const directory: string = './test-data';
const nodeFileStorageFactory = (maxItems?: number): IStorage => {
  return new NodeFileStorage('test', directory, 'ex-', maxItems);
};

function resetStorageDirectory() {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory);
}

describeStorage('NodeFileStorage',
  nodeFileStorageFactory,
  resetStorageDirectory,
  resetStorageDirectory,
  true
);
