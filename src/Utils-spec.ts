import { expect } from 'chai';
import { Utils } from './Utils';

describe('Utils', () => {
  it('should add range', () => {
    let target: string[];
    expect(Utils.addRange(target)).to.eql([]);
    expect(target).to.be.undefined;

    expect(Utils.addRange(target, '1', '2')).to.eql(['1', '2']);
    expect(Utils.addRange(target, '1', '2')).to.eql(['1', '2']);

    target = ['3'];
    expect(Utils.addRange(target, '1', '2')).to.eql(['3', '1', '2']);
    expect(target).to.eql(['3', '1', '2']);
  });

  describe('stringify', () => {
    const user: any = {
      id: 1,
      name: 'Blake',
      password: '123456',
      passwordResetToken: 'a reset token',
      myPassword: '123456',
      myPasswordValue: '123456',
      customValue: 'Password',
      value: {
        Password: '123456'
      }
    };

    it('array', () => {
      const error = {
        type: 'error',
        data: {
          '@error': {
            type: 'Error',
            message: 'string error message',
            stack_trace: [
              {
                name: 'throwStringErrorImpl',
                parameters: [],
                file_name: 'http://localhost/index.js',
                line_number: 22,
                column: 9
              },
              {
                name: 'throwStringError',
                parameters: [],
                file_name: 'http://localhost/index.js',
                line_number: 10,
                column: 10
              }, {
                name: 'HTMLButtonElement.onclick',
                parameters: [],
                file_name: 'http://localhost/',
                line_number: 22,
                column: 10
              }]
          },
          '@submission_method': 'onerror'
        },
        tags: []
      };

      expect(Utils.stringify(error)).to.equal(JSON.stringify(error));
      expect(Utils.stringify([error, error])).to.equal(JSON.stringify([error, error]));
    });

    it('circular reference', () => {
      const afoo: any = { a: 'foo' };
      afoo.b = afoo;

      expect(Utils.stringify(afoo)).to.equal('{"a":"foo"}');
      expect(Utils.stringify([{ one: afoo, two: afoo }])).to.equal('[{"one":{"a":"foo"}}]');
    });

    it.skip('deep circular reference', () => {
      const a: any = {};
      const b: any = {};
      const c: any = { d: 'test' };

      a.b = b;
      b.c = c;
      c.a = a;

      const expected = '{"b":{"c":{"d":"test"}}}';

      const actual = Utils.stringify(a);
      expect(actual).to.equal(expected);
    });

    describe('should behave like JSON.stringify', () => {
      [new Date(), 1, true, null, undefined, () => { }, user].forEach((value) => {
        it('for ' + typeof (value), () => {
          expect(Utils.stringify(value)).to.equal(JSON.stringify(value));
        });
      });
    });

    it.skip('should respect maxDepth', () => {
      const deepObject = {
        a: {
          b: {
            c: {
              d: {}
            }
          }
        }
      };

      expect(deepObject).to.equal('TODO');
    });

    it('should serialize inherited properties', () => {
      const Foo = function() { this.a = 'a'; };
      const Bar = function() { this.b = 'b'; };
      Bar.prototype = new Foo();
      const bar = new Bar();

      const expected = {
        a: 'a',
        b: 'b'
      };

      const result = JSON.parse(Utils.stringify(bar));
      expect(result).to.eql(expected);
    });

    describe('with exclude pattern', () => {
      it('pAssword', () => {
        expect(Utils.stringify(user, ['pAssword'])).to.equal('{"id":1,"name":"Blake","passwordResetToken":"a reset token","myPassword":"123456","myPasswordValue":"123456","customValue":"Password","value":{}}');
      });

      it('*password', () => {
        expect(Utils.stringify(user, ['*password'])).to.equal('{"id":1,"name":"Blake","passwordResetToken":"a reset token","myPasswordValue":"123456","customValue":"Password","value":{}}');
      });

      it('password*', () => {
        expect(Utils.stringify(user, ['password*'])).to.equal('{"id":1,"name":"Blake","myPassword":"123456","myPasswordValue":"123456","customValue":"Password","value":{}}');
      });

      it('*password*', () => {
        expect(Utils.stringify(user, ['*password*'])).to.equal('{"id":1,"name":"Blake","customValue":"Password","value":{}}');
      });

      it('*Address', () => {
        const event = { type: 'usage', source: 'about' };
        expect(Utils.stringify(event, ['*Address'])).to.equal(JSON.stringify(event));
      });
    });
  });

  it('should parse version from url', () => {
    expect(Utils.parseVersion('https://code.jquery.com/jquery-2.1.3.js')).to.equal('2.1.3');
    expect(Utils.parseVersion('//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css')).to.equal('3.3.4');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.css')).to.equal('2.0');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.min.js')).to.equal('0.3.0');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/angular-google-maps/2.1.0-X.10/angular-google-maps.min.js')).to.equal('2.1.0-X.10');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/2.1.8-M1/swagger-ui.min.js')).to.equal('2.1.8-M1');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/BLAH/BLAH.min.js')).to.equal(null);
  });

  describe('isMatch', () => {
    it('input: blake patterns ["pAssword"]', () => {
      expect(Utils.isMatch('blake', ['pAssword'])).to.be.false;
    });

    it('input: pAssword patterns ["pAssword"]', () => {
      expect(Utils.isMatch('pAssword', ['pAssword'])).to.be.true;
    });

    it('input: passwordResetToken patterns ["pAssword"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['pAssword'])).to.be.false;
    });

    it('input: myPassword patterns ["pAssword"]', () => {
      expect(Utils.isMatch('myPassword', ['pAssword'])).to.be.false;
    });

    it('input: blake patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('blake', ['*pAssword'])).to.be.false;
    });

    it('input: pAssword patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('pAssword', ['*pAssword'])).to.be.true;
    });

    it('input: passwordResetToken patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['*pAssword'])).to.be.false;
    });

    it('input: myPassword patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('myPassword', ['*pAssword'])).to.be.true;
    });

    it('input: blake patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('blake', ['pAssword*'])).to.be.false;
    });

    it('input: pAssword patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('pAssword', ['pAssword*'])).to.be.true;
    });

    it('input: passwordResetToken patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['pAssword*'])).to.be.true;
    });

    it('input: myPassword patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('myPassword', ['pAssword*'])).to.be.false;
    });

    it('input: blake patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('blake', ['*pAssword*'])).to.be.false;
    });

    it('input: pAssword patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('pAssword', ['*pAssword*'])).to.be.true;
    });

    it('input: passwordResetToken patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['*pAssword*'])).to.be.true;
    });

    it('input: myPassword patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('myPassword', ['*pAssword*'])).to.be.true;
    });
  });

  describe('startsWith', () => {
    it('input: blake prefix: blake', () => {
      expect(Utils.startsWith('blake', 'blake')).to.be.true;
    });

    it('input: blake prefix: bl', () => {
      expect(Utils.startsWith('blake', 'bl')).to.be.true;
    });

    it('input: blake prefix: Blake', () => {
      expect(Utils.startsWith('blake', 'Blake')).to.be.false;
    });

    it('input: @@log:* prefix: @@log:', () => {
      expect(Utils.startsWith('@@log:*', '@@log:')).to.be.true;
    });

    it('input: test prefix: nopattern', () => {
      expect(Utils.startsWith('test', 'nopattern')).to.be.false;
    });
  });

  describe('endsWith', () => {
    it('input: blake suffix: blake', () => {
      expect(Utils.endsWith('blake', 'blake')).to.be.true;
    });

    it('input: blake suffix: ake', () => {
      expect(Utils.endsWith('blake', 'ake')).to.be.true;
    });

    it('input: blake suffix: Blake', () => {
      expect(Utils.endsWith('blake', 'Blake')).to.be.false;
    });

    it('input: @@log:* suffix: log:*', () => {
      expect(Utils.endsWith('@@log:*', 'log:*')).to.be.true;
    });

    it('input: test suffix: nopattern', () => {
      expect(Utils.endsWith('test', 'nopattern')).to.be.false;
    });
  });

  describe('toBoolean', () => {
    it('input: blake', () => {
      expect(Utils.toBoolean('blake')).to.be.false;
    });

    it('input: 0', () => {
      expect(Utils.toBoolean('0')).to.be.false;
    });

    it('input: no', () => {
      expect(Utils.toBoolean('no')).to.be.false;
    });

    it('input: false', () => {
      expect(Utils.toBoolean('false')).to.be.false;
    });

    it('input: false', () => {
      expect(Utils.toBoolean(false)).to.be.false;
    });

    it('input: undefined', () => {
      expect(Utils.toBoolean(undefined)).to.be.false;
    });

    it('input: null', () => {
      expect(Utils.toBoolean(null)).to.be.false;
    });

    it('input: 1', () => {
      expect(Utils.toBoolean('1')).to.be.true;
    });

    it('input: yes', () => {
      expect(Utils.toBoolean('yes')).to.be.true;
    });

    it('input: true', () => {
      expect(Utils.toBoolean('true')).to.be.true;
    });

    it('input: true', () => {
      expect(Utils.toBoolean(true)).to.be.true;
    });
  });
});
