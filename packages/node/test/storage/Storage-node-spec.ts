import mock from 'mock-fs';
import { describeStorage } from '@exceptionless/core/test/storage/Storage-spec';

import { NodeFileStorage } from '../../src/storage/NodeFileStorage';

let mockedFs;

const nodeFileStorageFactory = (maxItems?) => {
  return new NodeFileStorage('test', './fileStorage', 'ex-', maxItems, mockedFs);
};

const nodeFileStorageInitializer = () => {
  mockedFs = mock({
    fileStorage: {}
  });
};

describeStorage('NodeFileStorage',
  nodeFileStorageFactory,
  nodeFileStorageInitializer,
  true
);
