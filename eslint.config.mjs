import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["**/dist/", "**/node_modules/", ".agents/", "example/", "**/expo-plugin/", "**/react-native.config.*"]
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
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true
        }
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false
        }
      ]
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: {
        console: "readonly",
        process: "readonly"
      }
    }
  },
  eslintConfigPrettier,
  {
    plugins: {
      "@stylistic": stylistic
    },
    rules: {
      curly: ["error", "all"],
      "@stylistic/object-curly-newline": [
        "error",
        {
          ObjectExpression: {
            minProperties: 1
          }
        }
      ],
      "@stylistic/brace-style": [
        "error",
        "1tbs",
        {
          allowSingleLine: false
        }
      ],
      "padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "block-like",
          next: ["if", "while", "for", "do"]
        }
      ]
    }
  },
  {
    files: ["**/test/**/*.ts"],
    plugins: vitest.configs.recommended.plugins,
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/valid-title": "off",
      "vitest/valid-describe-callback": "off",
      "vitest/no-done-callback": "warn"
    }
  }
);
