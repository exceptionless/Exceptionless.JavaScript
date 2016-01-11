import { expect } from 'chai';
import { SessionManagerPlugin } from './SessionManagerPlugin';

describe('SessionManagerPlugin', () => {

  let target: SessionManagerPlugin;

  beforeEach(() => {
    target = new SessionManagerPlugin();
  });

  it('should ignore manual session ids', () => {
    expect.fail('TODO');
  });

});
