import * as exceptionless from '../../dist/exceptionless'

var client = exceptionless.ExceptionlessClient.default;
client.config.serverUrl = 'http://localhost:50000';
client.config.useDebugLogger();

// set some default data
client.config.defaultData['SampleUser'] = {
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

client.config.defaultTags.push('Example', 'JavaScript', 'TypeScript');
client.submitLog('Testing');
