import { Utils } from 'Utils';

describe('Utils', () => {
  it('should parse namespace, type and name', () => {
    expect(Utils.parseFunctionName('?')).toEqual({
      name: '<anonymous>',
    });

    expect(Utils.parseFunctionName(null)).toEqual({
      name: '<anonymous>',
    });

    expect(Utils.parseFunctionName('Array.EventPluginManager.run.wrap')).toEqual({
      declaring_type: 'EventPluginManager',
      name: 'run.wrap',
    });

    expect(Utils.parseFunctionName('EventPluginManager.run.wrap')).toEqual({
      declaring_type: 'EventPluginManager',
      name: 'run.wrap',
    });

    expect(Utils.parseFunctionName('EventBuilder.submit')).toEqual({
      declaring_type: 'EventBuilder',
      name: 'submit',
    });

    expect(Utils.parseFunctionName('processUnhandledException')).toEqual({
      name: 'processUnhandledException',
    });

    expect(Utils.parseFunctionName('test.process')).toEqual({
      declaring_type: 'test',
      name: 'process',
    });

    expect(Utils.parseFunctionName('exceptionless.Plugins.EventPluginManager.run')).toEqual({
      declaring_namespace: 'exceptionless.Plugins',
      declaring_type: 'EventPluginManager',
      name: 'run',
    });

    expect(Utils.parseFunctionName('exceptionless.plugins.EventPluginManager.run')).toEqual({
      declaring_namespace: 'exceptionless.plugins',
      declaring_type: 'EventPluginManager',
      name: 'run',
    });

    expect(Utils.parseFunctionName('exceptionless.plugins.utils.parse')).toEqual({
      declaring_namespace: 'exceptionless.plugins',
      declaring_type: 'utils',
      name: 'parse',
    });
  });

  it('should stringify circular reference', () => {
    var afoo:any = { a: 'foo' };
    afoo.b = afoo;

    expect(Utils.stringify(afoo)).toBe('{"a":"foo"}');
    expect(Utils.stringify({ one: afoo, two: afoo })).toBe('{"one":{"a":"foo"}}');
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
