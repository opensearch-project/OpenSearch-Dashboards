/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const webpackConfig = require('./target/webpack.config').default;

module.exports = {
  managerEntries: (entry = []) => {
    return [...entry, require.resolve('./target/lib/register')];
  },
  webpackFinal: (config) => {
    return webpackConfig({ config });
  },
};
