/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// babelrc doesn't respect NODE_PATH anymore but using require does.
// Alternative to install them locally in node_modules
module.exports = function (api) {
  // ensure env is test so that this config won't impact build or dev server
  if (api.env('test')) {
    return {
      presets: [
        require('@babel/preset-env', {
          useBuiltIns: false,
          targets: {
            node: 'current',
          },
        }),
        require('@babel/preset-react'),
        require('@babel/preset-typescript'),
      ],
    };
  }
  return {};
};
