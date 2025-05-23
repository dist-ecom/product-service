// CI-specific ESLint configuration
// This is identical to the main eslint.config.js except it's guaranteed to be used in the CI environment
const globals = require('globals');
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tseslintParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Base configuration for all files
  {
    ignores: ['dist/**', 'node_modules/**', '.eslintrc.js', 'coverage/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        project: 'tsconfig.json',
      },
    },
    rules: {
      // Base rules
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,

      // Disable rules that are too strict for everyday development
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Type safety balancing
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      
      // This causes issues with common patterns like controller methods
      '@typescript-eslint/unbound-method': 'off',
      
      // Async/await validation
      '@typescript-eslint/require-await': 'off',
      
      // Important to catch unused variables but with reasonable exceptions
      'no-unused-vars': 'off', // Turn off base rule
      '@typescript-eslint/no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_|req|res|next|args|context|info',
        'varsIgnorePattern': '^_|props|state|context|styles',
        'caughtErrorsIgnorePattern': '^_|error|err|e',
        'destructuredArrayIgnorePattern': '^_',
        'ignoreRestSiblings': true
      }],
      
      // Additional reasonable rules
      'prefer-const': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'no-duplicate-imports': 'warn',
      'no-return-await': 'off',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-floating-promises': ['warn', {
        'ignoreVoid': true
      }],
      
      // More lenient rules
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-case-declarations': 'off'
    }
  },
  // Test files with more lenient rules
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/*.test.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-floating-promises': 'off'
    }
  },
  // Script files with more lenient console rules
  {
    files: ['src/scripts/**/*.ts'],
    rules: {
      'no-console': 'off'
    }
  }
]; 