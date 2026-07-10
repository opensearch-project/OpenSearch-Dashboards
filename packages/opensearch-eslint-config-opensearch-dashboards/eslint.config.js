/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/* eslint-disable import/no-unresolved */
const { defineConfig } = require('eslint/config');

const semver = require('semver');
const PKG = require('../../package.json');

const babelParser = require('@babel/eslint-parser');
const tsParser = require('@typescript-eslint/parser');

// Plugin instances live in a single module (plugins.js) so they are registered
// in exactly one place. `globalPluginRegistration` is an unscoped config object
// that registers every plugin up front: because it is the first entry in the
// exported array below, any config object that a consumer appends can reference
// any plugin's rules (`@typescript-eslint/*`, `jest/*`, `react-hooks/*`,
// `@osd/eslint/*`, ...) regardless of its `files` scope, without re-registering.
const {
  globalPluginRegistration,
  tsPlugin,
  eslintCommentsPlugin,
  importPlugin,
  jestPlugin,
  jsxA11yPlugin,
  mochaPlugin,
  noUnsanitizedPlugin,
  reactPlugin,
  reactHooksPlugin,
  prettierPlugin,
  osdEslintPlugin,
} = require('./plugins');

const RESTRICTED_GLOBALS = require('./restricted_globals');
const RESTRICTED_MODULES = { paths: ['gulp-util'] };

const eslintConfigPrettierRules = require('eslint-config-prettier').rules;

const reactVersion = semver.valid(semver.coerce(PKG.dependencies.react));

// The current implementation excluded all the variables matching the regexp.
// We should remove it as soon as multiple underscores are supported by the linter.
// https://github.com/typescript-eslint/typescript-eslint/issues/1712
const allowedNameRegexp = '^(UNSAFE_|_{1,3})|_{1,3}$';

module.exports = defineConfig([
  // ── Global plugin registration (must stay first) ──────────────────────────
  // Registers every plugin in one unscoped object so downstream rule references
  // resolve at any file scope. See plugins.js.
  globalPluginRegistration,

  // ── JavaScript files ────────────────────────────────────────────────────
  {
    files: ['**/*.js'],

    plugins: {
      mocha: mochaPlugin,
      import: importPlugin,
      'no-unsanitized': noUnsanitizedPlugin,
    },

    languageOptions: {
      parser: babelParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2015,
        ecmaFeatures: { experimentalObjectRestSpread: true },
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
      },
      globals: {
        // es6 + node + mocha + browser
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        // mocha
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        // browser
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
      },
    },

    settings: {
      'import-x/resolver': {
        '@osd/eslint-import-resolver-opensearch-dashboards': {
          forceNode: true,
        },
      },
    },

    rules: {
      'block-scoped-var': 'error',
      camelcase: ['error', { properties: 'never', allow: ['^UNSAFE_'] }],
      'consistent-return': 'off',
      'dot-notation': ['error', { allowKeywords: true }],
      eqeqeq: ['error', 'allow-null'],
      'guard-for-in': 'error',
      'new-cap': ['error', { capIsNewExceptions: ['Private'] }],
      'no-bitwise': 'off',
      'no-caller': 'error',
      'no-cond-assign': 'off',
      'no-const-assign': 'error',
      'no-debugger': 'error',
      'no-empty': 'error',
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-global-assign': 'error',
      'no-irregular-whitespace': 'error',
      'no-iterator': 'error',
      'no-loop-func': 'error',
      'no-multi-str': 'off',
      'no-nested-ternary': 'error',
      'no-new': 'off',
      'no-path-concat': 'off',
      'no-proto': 'error',
      'no-redeclare': 'error',
      'no-restricted-globals': ['error', ...RESTRICTED_GLOBALS],
      'no-restricted-imports': [2, RESTRICTED_MODULES],
      'no-restricted-modules': [2, RESTRICTED_MODULES],
      'no-return-assign': 'off',
      'no-script-url': 'error',
      'no-sequences': 'error',
      'no-shadow': 'off',
      'no-undef': 'error',
      'no-underscore-dangle': 'off',
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
      'no-unused-expressions': 'off',
      'no-unused-vars': ['error'],
      'no-use-before-define': ['error', 'nofunc'],
      'no-var': 'error',
      'no-with': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      strict: ['error', 'never'],
      'valid-typeof': 'error',
      yoda: 'off',

      'mocha/handle-done-callback': 'error',
      'mocha/no-exclusive-tests': 'error',

      'import/no-unresolved': ['error', { amd: true, commonjs: true }],
      'import/named': 'error',
      'import/namespace': 'error',
      'import/default': 'error',
      'import/export': 'error',
      'import/no-named-as-default': 'error',
      'import/no-named-as-default-member': 'error',
      'import/no-duplicates': 'error',
      'import/no-dynamic-require': 'error',
    },
  },

  // ── TypeScript files ─────────────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],

    plugins: {
      '@typescript-eslint': tsPlugin,
      '@eslint-community/eslint-comments': eslintCommentsPlugin,
      import: importPlugin,
      'no-unsanitized': noUnsanitizedPlugin,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2015,
        ecmaFeatures: {
          experimentalObjectRestSpread: true,
          jsx: true,
        },
        // NOTE: Disabling ts.Program to avoid known performance issue.
        // https://github.com/typescript-eslint/typescript-eslint/issues/389
        project: undefined,
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        console: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        after: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        fetch: 'readonly',
      },
    },

    settings: {
      'import-x/resolver': {
        node: {
          extensions: ['.mjs', '.js', '.json', '.ts', '.tsx'],
        },
      },
      react: {
        version: reactVersion,
      },
    },

    rules: {
      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': [
        'error',
        { default: 'array-simple', readonly: 'array-simple' },
      ],
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            SFC: { message: 'Use FC or FunctionComponent instead.', fixWith: 'FC' },
            'React.SFC': { message: 'Use FC or FunctionComponent instead.', fixWith: 'React.FC' },
            StatelessComponent: {
              message: 'Use FunctionComponent instead.',
              fixWith: 'FunctionComponent',
            },
            'React.StatelessComponent': {
              message: 'Use FunctionComponent instead.',
              fixWith: 'React.FunctionComponent',
            },
          },
        },
      ],
      camelcase: 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          filter: { regex: allowedNameRegexp, match: false },
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          filter: { regex: allowedNameRegexp, match: false },
        },
        {
          selector: 'parameter',
          format: ['camelCase', 'PascalCase'],
          filter: { regex: allowedNameRegexp, match: false },
        },
        {
          selector: 'memberLike',
          format: ['camelCase', 'PascalCase', 'snake_case', 'UPPER_CASE'],
          filter: { regex: allowedNameRegexp, match: false },
        },
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
          filter: { regex: allowedNameRegexp, match: false },
        },
        {
          selector: 'typeLike',
          format: ['PascalCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
        { selector: 'enum', format: ['PascalCase', 'UPPER_CASE', 'camelCase'] },
        { selector: 'import', format: null },
        { selector: ['objectLiteralProperty', 'objectLiteralMethod'], format: null },
        { selector: 'typeProperty', modifiers: ['requiresQuotes'], format: null },
      ],
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'off',
          overrides: {
            accessors: 'explicit',
            constructors: 'no-public',
            parameterProperties: 'explicit',
          },
        },
      ],
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/member-ordering': [
        'error',
        { default: ['public-static-field', 'static-field', 'instance-field'] },
      ],
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-extra-non-null-assertion': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/triple-slash-reference': [
        'error',
        { path: 'never', types: 'never', lib: 'never' },
      ],
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/unified-signatures': 'error',
      'constructor-super': 'error',
      'dot-notation': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'guard-for-in': 'error',
      'import/order': [
        'error',
        { groups: [['external', 'builtin'], 'internal', ['parent', 'sibling', 'index']] },
      ],
      'max-classes-per-file': ['error', 1],
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-cond-assign': 'error',
      'no-console': 'error',
      'no-debugger': 'error',
      'no-empty': 'error',
      'no-extend-native': 'error',
      'no-eval': 'error',
      'no-new-wrappers': 'error',
      'no-script-url': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unsafe-finally': 'error',
      'no-unsanitized/property': 'error',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-expressions': 'error',
      'no-unused-labels': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',
      'prefer-rest-params': 'error',
      radix: 'error',
      'spaced-comment': ['error', 'always', { exceptions: ['/'] }],
      'use-isnan': 'error',

      // ban/ban replaced by no-restricted-syntax (describe.only / it.only / test.only)
      'no-restricted-syntax': [
        2,
        {
          selector: "CallExpression[callee.object.name='describe'][callee.property.name='only']",
          message: 'No exclusive suites.',
        },
        {
          selector: "CallExpression[callee.object.name='it'][callee.property.name='only']",
          message: 'No exclusive tests.',
        },
        {
          selector: "CallExpression[callee.object.name='test'][callee.property.name='only']",
          message: 'No exclusive tests.',
        },
      ],
      'import/no-default-export': 'error',

      '@eslint-community/eslint-comments/no-unused-disable': 'error',
      '@eslint-community/eslint-comments/no-unused-enable': 'error',

      ...eslintConfigPrettierRules,
    },
  },

  // ── Jest test files ──────────────────────────────────────────────────────
  {
    files: ['**/*.{test,test.mocks,mock}.{js,mjs,ts,tsx}', '**/__mocks__/**/*.{js,mjs,ts,tsx}'],

    plugins: {
      jest: jestPlugin,
    },

    languageOptions: {
      globals: {
        ...jestPlugin.environments.globals.globals,
      },
    },

    rules: {
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'import/order': 'off',
    },
  },

  // ── React / JSX (all files) ───────────────────────────────────────────────
  {
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },

    settings: {
      react: { version: reactVersion },
    },

    rules: {
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
      'react/no-danger': 'error',
      'react/self-closing-comp': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'jsx-a11y/accessible-emoji': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/media-has-caption': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
      'jsx-a11y/no-onchange': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
      'react/no-will-update-set-state': 'error',
      'react/no-is-mounted': 'error',
      'react/no-multi-comp': ['error', { ignoreStateless: true }],
      'react/no-unknown-property': 'error',
      'react/prefer-es6-class': ['error', 'always'],
      'react/prefer-stateless-function': ['error', { ignorePureComponents: true }],
      'react/no-unescaped-entities': 'error',
    },
  },

  // ── @osd/eslint plugin + prettier (shared config top-level) ──────────────
  {
    plugins: {
      '@osd/eslint': osdEslintPlugin,
      prettier: prettierPlugin,
    },

    languageOptions: {
      ecmaVersion: 2015,
    },

    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      '@osd/eslint/module_migration': [
        'error',
        [
          { from: 'expect.js', to: '@osd/expect' },
          {
            from: 'mkdirp',
            to: false,
            disallowedMessage:
              "Don't use 'mkdirp', use the new { recursive: true } option of Fs.mkdir instead",
          },
          { from: 'numeral', to: '@elastic/numeral' },
          {
            from: '@osd/elastic-idx',
            to: false,
            disallowedMessage:
              "Don't use idx(), use optional chaining syntax instead https://ela.st/optchain",
          },
          { from: 'react-router', to: 'react-router-dom' },
          { from: '@osd/ui-shared-deps/monaco', to: '@osd/monaco' },
          {
            from: 'monaco-editor',
            to: false,
            disallowedMessage: "Don't import monaco directly, use or add exports to @osd/monaco",
          },
        ],
      ],
    },
  },
]);
