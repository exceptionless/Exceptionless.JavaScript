import * as mockFs from 'mock-fs';
import { NodeFileStorage } from './NodeFileStorage';
import { describeStorage } from './Storage-spec';

let mockedFs;

const nodeFileStorageFactory = (maxItems?) => {
  return new NodeFileStorage('test', './fileStorage', 'ex-', maxItems, mockedFs);
};

const nodeFileStorageInitializer = () => {
  mockedFs = mockFs({
    fileStorage: {}
  });
};

describeStorage('NodeFileStorage',
  nodeFileStorageFactory,
  nodeFileStorageInitializer,
  true
);
