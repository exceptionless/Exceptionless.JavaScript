import { NodeFileStorage } from './NodeFileStorage';

import { describeStorage } from './Storage-spec';

import * as mockFs from 'mock-fs';

let mockedFs;

let nodeFileStorageFactory = (maxItems?) => {
  return new NodeFileStorage('test', './fileStorage', 'ex-', maxItems, mockedFs);
};

let nodeFileStorageInitializer = () => {
  mockedFs = mockFs.fs({
    'fileStorage': {}
  });
};

describeStorage('NodeFileStorage',
  nodeFileStorageFactory,
  nodeFileStorageInitializer,
  true
);
