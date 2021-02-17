import { Utils } from "../src/Utils.js";

describe('Utils', () => {
  test('should add range', () => {
    let target: string[] = undefined;
    expect(Utils.addRange(target)).toEqual([]);
    expect(target).toBeUndefined();

    expect(Utils.addRange(target, '1', '2')).toEqual(['1', '2']);
    expect(Utils.addRange(target, '1', '2')).toEqual(['1', '2']);

    target = ['3'];
    expect(Utils.addRange(target, '1', '2')).toEqual(['3', '1', '2']);
    expect(target).toEqual(['3', '1', '2']);
  });

  describe('stringify', () => {
    const user = {
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

    test('array', () => {
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

      expect(Utils.stringify(error)).toBe(JSON.stringify(error));
      expect(Utils.stringify([error, error])).toBe(JSON.stringify([error, error]));
    });

    test('circular reference', () => {
      const aFoo: any = { a: 'foo' };
      aFoo.b = aFoo;

      expect(Utils.stringify(aFoo)).toBe('{"a":"foo"}');
      expect(Utils.stringify([{ one: aFoo, two: aFoo }])).toBe('[{"one":{"a":"foo"}}]');
    });

    test.skip('deep circular reference', () => {
      const a: any = {};
      const b: any = {};
      const c: any = { d: 'test' };

      a.b = b;
      b.c = c;
      c.a = a;

      const expected = '{"b":{"c":{"d":"test"}}}';

      const actual = Utils.stringify(a);
      expect(actual).toBe(expected);
    });

    describe('should behave like JSON.stringify', () => {
      [new Date(), 1, true, null, undefined, () => { }, user].forEach((value) => {
        test('for ' + typeof (value), () => {
          expect(Utils.stringify(value)).toBe(JSON.stringify(value));
        });
      });
    });

    test.skip('should respect maxDepth', () => {
      const deepObject = {
        a: {
          b: {
            c: {
              d: {}
            }
          }
        }
      };

      expect(deepObject).toBe('TODO');
    });

    test('should serialize inherited properties', () => {
      const Foo = function() { this.a = 'a'; };
      const Bar = function() { this.b = 'b'; };
      Bar.prototype = new Foo();
      const bar = new Bar();

      const expected = {
        a: 'a',
        b: 'b'
      };

      const result = JSON.parse(Utils.stringify(bar));
      expect(result).toEqual(expected);
    });

    describe('with exclude pattern', () => {
      test('pAssword', () => {
        expect(Utils.stringify(user, ['pAssword'])).toBe(
          '{"id":1,"name":"Blake","passwordResetToken":"a reset token","myPassword":"123456","myPasswordValue":"123456","customValue":"Password","value":{}}'
        );
      });

      test('*password', () => {
        expect(Utils.stringify(user, ['*password'])).toBe(
          '{"id":1,"name":"Blake","passwordResetToken":"a reset token","myPasswordValue":"123456","customValue":"Password","value":{}}'
        );
      });

      test('password*', () => {
        expect(Utils.stringify(user, ['password*'])).toBe(
          '{"id":1,"name":"Blake","myPassword":"123456","myPasswordValue":"123456","customValue":"Password","value":{}}'
        );
      });

      test('*password*', () => {
        expect(Utils.stringify(user, ['*password*'])).toBe('{"id":1,"name":"Blake","customValue":"Password","value":{}}');
      });

      test('*Address', () => {
        const event = { type: 'usage', source: 'about' };
        expect(Utils.stringify(event, ['*Address'])).toBe(JSON.stringify(event));
      });
    });
  });

  test('should parse version from url', () => {
    expect(Utils.parseVersion('https://code.jquery.com/jquery-2.1.3.js')).toBe('2.1.3');
    expect(Utils.parseVersion('//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css')).toBe('3.3.4');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.css')).toBe('2.0');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.min.js')).toBe('0.3.0');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/angular-google-maps/2.1.0-X.10/angular-google-maps.min.js')).toBe('2.1.0-X.10');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/2.1.8-M1/swagger-ui.min.js')).toBe('2.1.8-M1');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/BLAH/BLAH.min.js')).toBeNull();
  });

  describe('isMatch', () => {
    test('input: blake patterns ["pAssword"]', () => {
      expect(Utils.isMatch('blake', ['pAssword'])).toBe(false);
    });

    test('input: pAssword patterns ["pAssword"]', () => {
      expect(Utils.isMatch('pAssword', ['pAssword'])).toBe(true);
    });

    test('input: passwordResetToken patterns ["pAssword"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['pAssword'])).toBe(false);
    });

    test('input: myPassword patterns ["pAssword"]', () => {
      expect(Utils.isMatch('myPassword', ['pAssword'])).toBe(false);
    });

    test('input: blake patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('blake', ['*pAssword'])).toBe(false);
    });

    test('input: pAssword patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('pAssword', ['*pAssword'])).toBe(true);
    });

    test('input: passwordResetToken patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['*pAssword'])).toBe(false);
    });

    test('input: myPassword patterns ["*pAssword"]', () => {
      expect(Utils.isMatch('myPassword', ['*pAssword'])).toBe(true);
    });

    test('input: blake patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('blake', ['pAssword*'])).toBe(false);
    });

    test('input: pAssword patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('pAssword', ['pAssword*'])).toBe(true);
    });

    test('input: passwordResetToken patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['pAssword*'])).toBe(true);
    });

    test('input: myPassword patterns ["pAssword*"]', () => {
      expect(Utils.isMatch('myPassword', ['pAssword*'])).toBe(false);
    });

    test('input: blake patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('blake', ['*pAssword*'])).toBe(false);
    });

    test('input: pAssword patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('pAssword', ['*pAssword*'])).toBe(true);
    });

    test('input: passwordResetToken patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('passwordResetToken', ['*pAssword*'])).toBe(true);
    });

    test('input: myPassword patterns ["*pAssword*"]', () => {
      expect(Utils.isMatch('myPassword', ['*pAssword*'])).toBe(true);
    });
  });

  describe('startsWith', () => {
    test('input: blake prefix: blake', () => {
      expect(Utils.startsWith('blake', 'blake')).toBe(true);
    });

    test('input: blake prefix: bl', () => {
      expect(Utils.startsWith('blake', 'bl')).toBe(true);
    });

    test('input: blake prefix: Blake', () => {
      expect(Utils.startsWith('blake', 'Blake')).toBe(false);
    });

    test('input: @@log:* prefix: @@log:', () => {
      expect(Utils.startsWith('@@log:*', '@@log:')).toBe(true);
    });

    test('input: test prefix: noPattern', () => {
      expect(Utils.startsWith('test', 'noPattern')).toBe(false);
    });
  });

  describe('endsWith', () => {
    test('input: blake suffix: blake', () => {
      expect(Utils.endsWith('blake', 'blake')).toBe(true);
    });

    test('input: blake suffix: ake', () => {
      expect(Utils.endsWith('blake', 'ake')).toBe(true);
    });

    test('input: blake suffix: Blake', () => {
      expect(Utils.endsWith('blake', 'Blake')).toBe(false);
    });

    test('input: @@log:* suffix: log:*', () => {
      expect(Utils.endsWith('@@log:*', 'log:*')).toBe(true);
    });

    test('input: test suffix: noPattern', () => {
      expect(Utils.endsWith('test', 'noPattern')).toBe(false);
    });
  });

  describe('toBoolean', () => {
    test('input: blake', () => {
      expect(Utils.toBoolean('blake')).toBe(false);
    });

    test('input: 0', () => {
      expect(Utils.toBoolean('0')).toBe(false);
    });

    test('input: no', () => {
      expect(Utils.toBoolean('no')).toBe(false);
    });

    test('input: false', () => {
      expect(Utils.toBoolean('false')).toBe(false);
    });

    test('input: false', () => {
      expect(Utils.toBoolean(false)).toBe(false);
    });

    test('input: undefined', () => {
      expect(Utils.toBoolean(undefined)).toBe(false);
    });

    test('input: null', () => {
      expect(Utils.toBoolean(null)).toBe(false);
    });

    test('input: 1', () => {
      expect(Utils.toBoolean('1')).toBe(true);
    });

    test('input: yes', () => {
      expect(Utils.toBoolean('yes')).toBe(true);
    });

    test('input: true', () => {
      expect(Utils.toBoolean('true')).toBe(true);
    });

    test('input: true', () => {
      expect(Utils.toBoolean(true)).toBe(true);
    });
  });
});
