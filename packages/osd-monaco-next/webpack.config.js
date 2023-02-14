/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const path = require('path');

const createLangWorkerConfig = (lang) => ({
  mode: 'production',
  entry: path.resolve(__dirname, 'src', lang, 'worker', `${lang}.worker.ts`),
  output: {
    path: path.resolve(__dirname, 'target/public'),
    filename: `${lang}.editor.worker.js`,
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.ts', '.tsx'],
    alias: {
      'monaco-editor': 'monaco-editor-next',
    },
  },
  stats: 'errors-only',
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [require.resolve('@osd/babel-preset/webpack_preset')],
          },
        },
      },
    ],
  },
});

module.exports = [createLangWorkerConfig('json')];
