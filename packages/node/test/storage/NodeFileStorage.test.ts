import { describeStorage } from '../../../core/test/storage/InMemoryStorage.test';
import { IStorage } from "../../../core/src/storage/IStorage";
import { NodeFileStorage } from '../../src/storage/NodeFileStorage';

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
