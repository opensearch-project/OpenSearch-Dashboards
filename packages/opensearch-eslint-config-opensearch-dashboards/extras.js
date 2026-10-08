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

// Aggregates the optional pieces that sit alongside the base flat config so
// consumers reach them through a single import instead of several subpaths:
//
//   const osdConfig = require('@elastic/eslint-config-kibana');
//   const { eui, plugins } = require('@elastic/eslint-config-kibana/extras');
//
//   module.exports = [...osdConfig, ...eui, { rules: { ... } }];
//
// - `eui`             opt-in EUI config block (an array to spread).
// - `plugins`         bundled plugin instances + `globalPluginRegistration`.
// - `restrictedGlobals` the restricted-globals list used by the base config.

const eui = require('./eui');
const plugins = require('./plugins');
const restrictedGlobals = require('./restricted_globals');

module.exports = {
  eui,
  plugins,
  restrictedGlobals,
};
