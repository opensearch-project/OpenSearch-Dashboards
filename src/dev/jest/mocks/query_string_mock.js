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

/**
 * query-string v9 is a pure ESM module whose index.js has only a default export:
 *
 *   import * as queryString from './base.js';
 *   export default queryString;
 *
 * When Babel transforms this for CJS Jest, babel-plugin-add-module-exports sets
 * `module.exports = exports.default` (the namespace from base.js). That namespace
 * carries `__esModule: true` (set by base.js's own transform) but has no `.default`
 * property. A consumer compiled as `interopRequireDefault(require('query-string')).default`
 * then gets `undefined` — interopRequireDefault sees `__esModule: true` and returns the
 * object as-is, and `.default` is missing.
 *
 * This shim is set as the moduleNameMapper target for 'query-string'.
 * It loads the real package via a hardcoded node_modules path so that Jest's
 * moduleNameMapper does not intercept the require (which would recurse into this file).
 */

// Use an absolute path built from the project root so Jest's moduleNameMapper
// cannot intercept the require (the mapper only matches bare specifiers like
// 'query-string', not absolute file paths). process.cwd() is the project root in Jest.

// eslint-disable-next-line import/no-dynamic-require
const mod = require(require('path').resolve(process.cwd(), 'node_modules/query-string/index.js'));

// After the Babel + babel-plugin-add-module-exports pipeline, `mod` is the raw
// namespace object `{ __esModule: true, stringify, parse, ... }` with no `.default`.
// Recover the actual API regardless of which shape we receive.
const api = mod && mod.__esModule && typeof mod.stringify !== 'function' ? mod.default : mod;

module.exports = {
  __esModule: true,
  default: api,
};
