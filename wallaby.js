module.exports = function (wallaby) {

  return {
    files: [
      'src/**/*.ts',
      {
        pattern: 'src/**/*-spec.ts',
        ignore: true
      }
    ],

    testFramework: 'mocha',

    tests: [
      'src/**/*-spec.ts'
    ],

    env: {
      type: 'node'
    },

    compilers: {
      'src/**/*.ts': wallaby.compilers.typeScript({ module: true })
    }
  };
};
