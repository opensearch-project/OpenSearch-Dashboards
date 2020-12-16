module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb/hooks',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:jest/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  plugins: [
    '@typescript-eslint',
    'eslint-comments',
    'jest',
    'import',
    'promise',
    'unicorn',
    'header',
    'react-hooks',
    'jsx-a11y',
    'prettier',
  ],
  rules: {
    /**
     * deprecated to be deleted
     */
    // https://github.com/typescript-eslint/typescript-eslint/issues/2077
    '@typescript-eslint/camelcase': 0,

    /**
     *****************************************
     * Rules with high processing demand
     *****************************************
     */
    'import/no-restricted-paths':
      process.env.NODE_ENV === 'production'
        ? [
            'error',
            {
              zones: [
                { target: './src', from: './src/index.ts' },
                { target: './src', from: './', except: ['./src', './node_modules/'] },
              ],
            },
          ]
        : 0,
    'import/namespace': process.env.NODE_ENV === 'production' ? 2 : 0,

    /**
     *****************************************
     * Rules to consider adding/fixing later
     *****************************************
     */
    '@typescript-eslint/no-unsafe-assignment': 0,
    '@typescript-eslint/no-unsafe-member-access': 0,
    '@typescript-eslint/no-unsafe-return': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/restrict-template-expressions': 1,
    '@typescript-eslint/restrict-plus-operands': 0, // rule is broken
    '@typescript-eslint/no-unsafe-call': 1,
    '@typescript-eslint/unbound-method': 1,
    'unicorn/consistent-function-scoping': 1,
    'unicorn/explicit-length-check': 1,
    'import/no-cycle': [0, { maxDepth: 3, ignoreExternal: true }], // TODO: should error when this is fixed https://github.com/benmosher/eslint-plugin-import/issues/1453
    'no-use-before-define': 0,
    'no-restricted-properties': 0, // need to find and filter desired options
    'class-methods-use-this': 1,
    'unicorn/prefer-number-properties': 0,
    'global-require': 1,
    'import/no-dynamic-require': 1,
    'no-shadow': 1,
    'no-param-reassign': 1,
    'react/no-array-index-key': 1,
    'react/prefer-stateless-function': 1,
    'jsx-a11y/no-static-element-interactions': 1,
    'jsx-a11y/mouse-events-have-key-events': 1,
    'jsx-a11y/click-events-have-key-events': 1,
    '@typescript-eslint/member-ordering': 1,
    eqeqeq: 1,
    'unicorn/no-nested-ternary': 0,

    /**
     * Standard rules
     */
    'no-restricted-syntax': 0, // this is a good rule, for-of is good
    'no-console': process.env.NODE_ENV === 'production' ? 2 : 1,
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 1,
    'prefer-template': 'error',
    'comma-dangle': 0,
    'consistent-return': 0,
    'no-plusplus': 0,
    'no-bitwise': 0,
    'no-void': 0,
    yoda: 0,
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'no-restricted-globals': 0,
    'no-case-declarations': 0,
    'no-return-await': 0,
    'max-classes-per-file': 0,
    'no-continue': 0,
    'no-lonely-if': 0,
    'no-return-assign': 0,
    'no-underscore-dangle': 0,
    'no-confusing-arrow': 0,
    'prefer-destructuring': 0,
    'function-paren-newline': 0,
    'implicit-arrow-linebreak': 0,
    'function-call-argument-newline': ['error', 'consistent'],
    'array-bracket-newline': ['error', 'consistent'],
    'array-element-newline': [
      'error',
      {
        ArrayExpression: 'consistent',
        ArrayPattern: 'consistent',
      },
    ],
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: { multiline: true, minProperties: 10, consistent: true },
        ObjectPattern: { multiline: true, minProperties: 10, consistent: true },
        ImportDeclaration: { consistent: true },
        ExportDeclaration: { consistent: true },
      },
    ],
    semi: ['error', 'always'],
    // https://github.com/typescript-eslint/typescript-eslint/issues/1824
    // TODO: Add back once indent ts rule is fixed
    // indent: [
    //   'error',
    //   2,
    //   {
    //     SwitchCase: 1,
    //     MemberExpression: 1,
    //     offsetTernaryExpressions: true,
    //   },
    // ],
    'max-len': [
      'warn',
      {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
      },
    ],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
    'sort-keys': 0,
    'no-irregular-whitespace': 'error',
    'no-unused-expressions': 'error',
    // Too restrictive, writing ugly code to defend against a very unlikely scenario: https://eslint.org/docs/rules/no-prototype-builtins
    'no-prototype-builtins': 0,

    /*
     * @typescript-eslint plugin
     */
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/return-await': ['error', 'always'], // https://v8.dev/blog/fast-async
    '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/indent': 0,
    '@typescript-eslint/no-inferrable-types': 0,
    '@typescript-eslint/ban-ts-comment': 1,
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-use-before-define': [
      'warn',
      {
        functions: false,
        classes: true,
        variables: true,
        typedefs: false,
      },
    ],

    /*
     * import plugin
     */
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        groups: ['builtin', 'external', ['parent', 'sibling', 'index', 'internal']],
        alphabetize: { order: 'asc', caseInsensitive: true }, // todo replace with directory gradient ordering
      },
    ],
    'import/no-unresolved': ['error', { ignore: ['theme_dark.scss', 'theme_light.scss'] }],
    // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
    'import/prefer-default-export': 0,
    // Limit usage in development directories
    'import/no-extraneous-dependencies': 0,

    /*
     * react plugin
     */
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/prop-types': 0,
    'react/sort-comp': 0,
    'react/jsx-one-expression-per-line': 0,
    'react/jsx-curly-newline': 0,
    'react/jsx-indent-props': 0,
    'react/jsx-max-props-per-line': 0,
    'react/jsx-first-prop-new-line': 0,
    'react/jsx-indent': 0,
    // Too restrictive: https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/destructuring-assignment.md
    'react/destructuring-assignment': 0,
    // No jsx extension: https://github.com/facebook/create-react-app/issues/87#issuecomment-234627904
    'react/jsx-filename-extension': 0,
    'react/jsx-props-no-spreading': 0,
    'react/static-property-placement': 0,
    'react/state-in-constructor': 0,

    /*
     * jest plugin
     */
    'jest/no-standalone-expect': 0, // using custom expect functions
    'jest/no-disabled-tests': 0,

    /*
     * unicorn plugin
     */
    'unicorn/prevent-abbreviations': 0, // Common abbreviations are known and readable
    'unicorn/no-null': 0,
    'unicorn/no-fn-reference-in-iterator': 0,
    'unicorn/prefer-query-selector': 0,
    'unicorn/no-for-loop': 0,
    'unicorn/no-reduce': 0,
    'unicorn/no-useless-undefined': 0,
    'unicorn/prefer-spread': 0,
    'unicorn/prefer-node-append': 0,
    'unicorn/no-zero-fractions': 0,
    'unicorn/prefer-node-remove': 0, // not IE11 compatible
    'unicorn/no-unreadable-array-destructuring': 0,
    'unicorn/filename-case': [
      'error',
      {
        case: 'snakeCase',
      },
    ],

    /*
     * file-header plugin
     */
    'header/header': [
      'error',
      'block',
      [
        '',
        ' * Licensed to Elasticsearch B.V. under one or more contributor',
        ' * license agreements. See the NOTICE file distributed with',
        ' * this work for additional information regarding copyright',
        ' * ownership. Elasticsearch B.V. licenses this file to you under',
        ' * the Apache License, Version 2.0 (the "License"); you may',
        ' * not use this file except in compliance with the License.',
        ' * You may obtain a copy of the License at',
        ' *',
        ' * http://www.apache.org/licenses/LICENSE-2.0',
        ' *',
        ' * Unless required by applicable law or agreed to in writing,',
        ' * software distributed under the License is distributed on an',
        ' * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY',
        ' * KIND, either express or implied.  See the License for the',
        ' * specific language governing permissions and limitations',
        ' * under the License.',
        ' ',
      ],
    ],
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 6,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
      jsx: true,
    },
    project: './tsconfig.lint.json',
    tsconfigRootDir: __dirname,
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
      files: ['src/**/*.{ts?(x),js}'],
      rules: {
        'no-underscore-dangle': 2,
        'import/no-unresolved': 'error',
        'import/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: ['**/*.test.ts?(x)', 'src/mocks/**/*.ts?(x)'],
          },
        ],
        'prefer-destructuring': [
          'warn',
          {
            array: true,
            object: true,
          },
          {
            enforceForRenamedProperties: false,
          },
        ],
      },
    },
    {
      files: ['*.js', 'integration/**/*.ts?(x)'],
      rules: {
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/no-unsafe-call': 0,
        'import/no-dynamic-require': 0,
        'global-require': 0,
        'no-param-reassign': 0,
      },
    },
    {
      files: ['.*.js', './*.config.js'], // dot(.) and root config files
      rules: {
        'header/header': 0,
        'unicorn/filename-case': 0,
      },
    },
    {
      files: ['stories/**/*.ts?(x)', 'docs/**/*.ts?(x)'],
      rules: {
        '@typescript-eslint/no-unsafe-call': 0,
      },
    },
    {
      files: ['integration/**/*.ts?(x)'],
      rules: {
        'jest/expect-expect': [
          'error',
          {
            assertFunctionNames: [
              'expect',
              'common.expectChartAtUrlToMatchScreenshot',
              'common.expectElementAtUrlToMatchScreenshot',
              'common.expectChartAtUrlToMatchScreenshot',
              'common.expectChartWithMouseAtUrlToMatchScreenshot',
              'common.expectChartWithDragAtUrlToMatchScreenshot',
            ],
          },
        ],
      },
    },
    {
      files: ['.playground/**/*.ts?(x)'],
      rules: {
        'react/prefer-stateless-function': 0,
      },
    },
    {
      files: ['*.test.ts?(x)'],
      rules: {
        'unicorn/error-message': 0,
      },
    },
    {
      files: ['stories/**/*.ts?(x)', '*.test.ts?(x)'],
      rules: {
        'jsx-a11y/no-static-element-interactions': 0,
        'jsx-a11y/click-events-have-key-events': 0,
        'no-restricted-properties': [
          process.env.NODE_ENV === 'production' ? 2 : 1,
          {
            object: 'Math',
            property: 'random',
            message: 'Please use the `getRandomNumber` to create seeded random function in `stories/` and `tests/`.',
          },
          {
            object: 'describe',
            property: 'only',
            message: 'Please remove before committing changes.',
          },
          {
            object: 'it',
            property: 'only',
            message: 'Please remove before committing changes.',
          },
          {
            object: 'test',
            property: 'only',
            message: 'Please remove before committing changes.',
          },
        ],
      },
    },
  ],
};
