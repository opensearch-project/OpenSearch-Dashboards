module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:react/recommended',
  ],
  plugins: ['@typescript-eslint', 'import', 'jest', 'unicorn', 'file-header'],

  env: {
    es6: true,
    node: true,
    mocha: true,
    browser: true,
  },

  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 6,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true,
    },
    // NOTE: That is to avoid a known performance issue related with the `ts.Program` used by
    // typescript eslint. As we are not using rules that need types information, we can safely
    // disabling that feature setting the project to undefined. That issue is being addressed
    // by the typescript eslint team. More info could be found here:
    // https://github.com/typescript-eslint/typescript-eslint/issues/389
    // https://github.com/typescript-eslint/typescript-eslint/issues/243
    // https://github.com/typescript-eslint/typescript-eslint/pull/361
    project: undefined,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 2 : 1,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 1,
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
    'unicorn/filename-case': [
      'error',
      {
        case: 'snakeCase',
      },
    ],
    'sort-keys': 'off',
    'import/no-unresolved': 'error',
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          { target: './src', from: './src/index.ts' },
          { target: './src', from: './', except: ['./src', './node_modules/'] },
        ],
      },
    ],
    'no-irregular-whitespace': 'error',
    'no-unused-expressions': 'error',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/prop-types': 0,
    'prefer-template': 'error',
    'file-header/file-header': [
      'error',
      [
        '',
        'Licensed to Elasticsearch B.V. under one or more contributor',
        'license agreements. See the NOTICE file distributed with',
        'this work for additional information regarding copyright',
        'ownership. Elasticsearch B.V. licenses this file to you under',
        'the Apache License, Version 2.0 (the "License"); you may',
        'not use this file except in compliance with the License.',
        'You may obtain a copy of the License at',
        '',
        'http://www.apache.org/licenses/LICENSE-2.0',
        '',
        'Unless required by applicable law or agreed to in writing,',
        'software distributed under the License is distributed on an',
        '"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY',
        'KIND, either express or implied.  See the License for the',
        'specific language governing permissions and limitations',
        'under the License.',
      ],
      'block',
      ['-\\*-(.*)-\\*-', 'eslint(.*)', '@jest-environment'],
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.mjs', '.js', '.json', '.ts', '.d.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.js', '*test.ts'],
      rules: {
        '@typescript-eslint/no-var-requires': 0,
      },
    },
    {
      files: ['stories/**/*.tsx', 'stories/**/*.ts', '*.test.ts', '*.test.tsx'],
      rules: {
        'no-restricted-properties': [
          2,
          {
            object: 'Math',
            property: 'random',
            message: 'Please use the `getRandomNumber` to create seeded random function in `stories/` and `tests/`',
          },
        ],
      },
    },
  ],
};
