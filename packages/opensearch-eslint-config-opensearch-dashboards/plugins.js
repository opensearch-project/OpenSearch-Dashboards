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

// Single source of truth for the ESLint plugin instances used across the
// OpenSearch Dashboards flat config. Both the shared config (`eslint.config.js`)
// and the plugin helper (`create_config.js`) consume these so that plugin
// registration lives in exactly one place.
//
// In ESLint flat config, `plugins` registration is scoped per matched file, not
// inherited between config objects. Downstream plugins that only want to tweak a
// few rules should not have to know which plugin owns a rule or re-register it.
// `globalPluginRegistration` below registers every plugin in a single unscoped
// config object, making every rule referenceable from any later config object
// regardless of its `files` scope.

const tsPlugin = require('@typescript-eslint/eslint-plugin');
const eslintCommentsPlugin = require('@eslint-community/eslint-plugin-eslint-comments');
const importPlugin = require('eslint-plugin-import-x');
const jestPlugin = require('eslint-plugin-jest');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const _mochaRaw = require('eslint-plugin-mocha');
const mochaPlugin = _mochaRaw.default || _mochaRaw;
const noUnsanitizedPlugin = require('eslint-plugin-no-unsanitized');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierPlugin = require('eslint-plugin-prettier');
const osdEslintPlugin = require('@osd/eslint-plugin-eslint');

const plugins = {
  '@typescript-eslint': tsPlugin,
  '@eslint-community/eslint-comments': eslintCommentsPlugin,
  import: importPlugin,
  jest: jestPlugin,
  'jsx-a11y': jsxA11yPlugin,
  mocha: mochaPlugin,
  'no-unsanitized': noUnsanitizedPlugin,
  react: reactPlugin,
  'react-hooks': reactHooksPlugin,
  prettier: prettierPlugin,
  '@osd/eslint': osdEslintPlugin,
};

// An unscoped flat-config object that registers every plugin globally. Spread
// this before any config object that references a plugin's rules so the rules
// resolve no matter which `files` glob the referencing object uses.
const globalPluginRegistration = { plugins };

module.exports = {
  plugins,
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
};
