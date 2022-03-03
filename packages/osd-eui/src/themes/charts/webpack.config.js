/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

const path = require('path');
const config = require('../../webpack.config.js');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  ...config,

  entry: {
    theme: path.join(__dirname, './themes.ts'),
  },

  output: {
    ...config.output,
    filename: `eui_charts_theme${isProduction ? '.min' : ''}.js`,
    libraryTarget: 'commonjs'
  },
};
