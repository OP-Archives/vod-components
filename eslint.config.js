import ts from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import importX from 'eslint-plugin-import-x';
import reactCompiler from 'eslint-plugin-react-compiler';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'import-x': importX,
      '@typescript-eslint': tsPlugin,
      prettier,
      'react-compiler': reactCompiler,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: ts,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
      'prettier/prettier': 'error',
      'react-compiler/react-compiler': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
];
