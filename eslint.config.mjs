import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import jest from "eslint-plugin-jest";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["**/dist/", "**/node_modules/", ".agents/", "example/", "jest-resolver.cjs"]
  },
  eslint.configs.recommended,
  {
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs"]
        },
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-duplicate-type-constituents": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-unused-expressions": ["error", { allowShortCircuit: true }],
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: false }]
    }
  },
  eslintConfigPrettier,
  {
    files: ["**/test/**/*.ts"],
    extends: [jest.configs["flat/recommended"]],
    rules: {
      "jest/valid-title": "off",
      "jest/valid-describe-callback": "off",
      "jest/no-export": "off",
      "jest/no-done-callback": "warn"
    }
  }
);
