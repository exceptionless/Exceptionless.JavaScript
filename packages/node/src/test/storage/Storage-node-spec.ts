import * as mockFs from 'mock-fs';
import { NodeFileStorage } from '../../storage/NodeFileStorage';
import { describeStorage } from '../../../../core/test/storage/Storage-spec';

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
