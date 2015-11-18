import { Utils } from './Utils';

describe('Utils', () => {
  it('should add range', () => {
    let target:string[];
    expect(Utils.addRange(target)).toEqual([]);
    expect(target).toBeUndefined();

    expect(Utils.addRange(target, '1', '2')).toEqual(['1', '2']);
    expect(Utils.addRange(target, '1', '2')).toEqual(['1', '2']);

    target = ['3'];
    expect(Utils.addRange(target, '1', '2')).toEqual(['3', '1', '2']);
    expect(target).toEqual(['3', '1', '2']);
  });

  describe('stringify', () => {
    let user:any = {
      id:1,
      name: 'Blake',
      password: '123456',
      passwordResetToken: 'a reset token',
      myPasswordValue: '123456',
      myPassword: '123456',
      customValue: 'Password',
      value: {
        Password: '123456'
      }
    };

    it('array', () => {
      let error = {
        'type': 'error',
        'data': {
          '@error': {
            'type': 'Error',
            'message': 'string error message',
            'stack_trace': [
              {
                'name': 'throwStringErrorImpl',
                'parameters': [],
                'file_name': 'http://localhost/index.js',
                'line_number': 22,
                'column': 9
              },
              {
                'name': 'throwStringError',
                'parameters': [],
                'file_name': 'http://localhost/index.js',
                'line_number': 10,
                'column': 10
              }, {
                'name': 'HTMLButtonElement.onclick',
                'parameters': [],
                'file_name': 'http://localhost/',
                'line_number': 22,
                'column': 10
              }]
          }, '@submission_method': 'onerror'
        },
        'tags': []
      };

      expect(Utils.stringify(error)).toBe(JSON.stringify(error));
      expect(Utils.stringify([error, error])).toBe(JSON.stringify([error, error]));
    });

    it('circular reference', () => {
      let afoo:any = {a: 'foo'};
      afoo.b = afoo;

      expect(Utils.stringify(afoo)).toBe('{"a":"foo"}');
      expect(Utils.stringify([{one: afoo, two: afoo}])).toBe('[{"one":{"a":"foo"}}]');
    });

    it('should behave like JSON.stringify', () => {
      expect(Utils.stringify(user)).toBe(JSON.stringify(user));
    });

    describe('with exclude pattern', () => {
      it('pAssword', () => {
        expect(Utils.stringify(user, ['pAssword'])).toBe('{"id":1,"name":"Blake","passwordResetToken":"a reset token","myPasswordValue":"123456","myPassword":"123456","customValue":"Password","value":{}}');
      });

      it('*password', () => {
        expect(Utils.stringify(user, ['*password'])).toBe('{"id":1,"name":"Blake","passwordResetToken":"a reset token","myPasswordValue":"123456","customValue":"Password","value":{}}');
      });

      it('password*', () => {
        expect(Utils.stringify(user, ['password*'])).toBe('{"id":1,"name":"Blake","myPasswordValue":"123456","myPassword":"123456","customValue":"Password","value":{}}');
      });

      it('*password*', () => {
        expect(Utils.stringify(user, ['*password*'])).toBe('{"id":1,"name":"Blake","customValue":"Password","value":{}}');
      });

      it('*Address', () => {
        let event = { type:'usage', source:'about' };
        expect(Utils.stringify(event, ['*Address'])).toBe(JSON.stringify(event));
      });
    });
  });

  it('should parse version from url', () => {
    expect(Utils.parseVersion('https://code.jquery.com/jquery-2.1.3.js')).toBe('2.1.3');
    expect(Utils.parseVersion('//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css')).toBe('3.3.4');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/1140/2.0/1140.css')).toBe('2.0');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.min.js')).toBe('0.3.0');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/angular-google-maps/2.1.0-X.10/angular-google-maps.min.js')).toBe('2.1.0-X.10');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/2.1.8-M1/swagger-ui.min.js')).toBe('2.1.8-M1');
    expect(Utils.parseVersion('https://cdnjs.cloudflare.com/BLAH/BLAH.min.js')).toBe(null);
  });
});
