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

// A ready-made flat-config block that registers `@elastic/eui` and applies its
// recommended rules. Plugins that want EUI linting spread this instead of
// requiring the plugin themselves (exposed to consumers as `eui` on the
// `@elastic/eslint-config-kibana/extras` module):
//
//   const osdConfig = require('@elastic/eslint-config-kibana');
//   const { eui } = require('@elastic/eslint-config-kibana/extras');
//   module.exports = [...osdConfig, ...eui, { rules: { ... } }];
//
// EUI is intentionally not part of the base config (OSD core does not lint
// against EUI rules), so it is exposed as a separate opt-in block.

const euiPlugin = require('@elastic/eslint-plugin-eui');

module.exports = [
  {
    plugins: { '@elastic/eui': euiPlugin },
    rules: euiPlugin.configs.recommended.rules,
  },
];
