module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    'plugin:import/typescript',
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],
  globals: {
    MutationObserver: 'readonly',
    SharedArrayBuffer: 'readonly',
    Atomics: 'readonly',
    BigInt: 'readonly',
    BigInt64Array: 'readonly',
    BigUint64Array: 'readonly',
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: ["./tsconfig.eslint.json"],
    tsconfigRootDir: __dirname
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "jest"
  ],
  ignorePatterns: [
    "dist",
    "node_modules",
    "example"
  ],
  rules: {
    // TODO: Fix rule errors.
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-for-in-array": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "no-undef": "off",
    "no-var": "off"
  }
};
