/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

module.exports = function pathAliasPlugin(options) {
  return [
    require.resolve('babel-plugin-module-resolver'),
    {
      root: options?.root ?? [path.resolve(__dirname, '../..')],
      cwd: options?.cwd ?? path.resolve(__dirname, '../..'),
      alias: {
        'opensearch-dashboards/server': './src/core/server',
        'opensearch-dashboards/public': './src/core/public',
      },
    },
  ];
};
