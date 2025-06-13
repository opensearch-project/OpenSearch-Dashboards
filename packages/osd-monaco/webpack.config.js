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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const path = require('path');

const commonConfig = {
  mode: 'production',
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
    alias: {
      'monaco-editor': path.resolve(__dirname, '../../node_modules/monaco-editor'),
    },
    // Resolve modules prioritizing source over target
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 11'],
                  },
                  modules: false,
                },
              ],
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-transform-class-static-block',
              '@babel/plugin-transform-private-methods',
            ],
          },
        },
        exclude: [/node_modules(?!\/antlr4ng)/, /target/, path.resolve(__dirname, 'target')],
      },
      {
        // Handle all JavaScript files with Babel transformation
        test: /\.js$/,
        exclude: [/node_modules(?!\/antlr4ng)/, path.resolve(__dirname, 'target')],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 11'],
                  },
                  modules: false,
                },
              ],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-transform-class-static-block',
              '@babel/plugin-transform-private-methods',
            ],
          },
        },
      },
      {
        // Handle antlr4ng and monaco-editor modules specifically
        test: /\.m?js$/,
        include: /node_modules[/\\](antlr4ng|monaco-editor)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 11'],
                  },
                  modules: false,
                },
              ],
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-transform-class-static-block',
              '@babel/plugin-transform-private-methods',
            ],
          },
        },
      },
      {
        // Handle ANTLR generated TypeScript files specifically
        test: /\.ts$/,
        include: [
          path.resolve(__dirname, 'src/ppl/.generated'),
          path.resolve(__dirname, 'src/sql/.generated'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 11'],
                  },
                  modules: false,
                },
              ],
              '@babel/preset-typescript',
            ],
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-transform-class-static-block',
              '@babel/plugin-transform-private-methods',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: 'file-loader',
      },
    ],
  },
};

const createLangWorkerConfig = (lang) => ({
  ...commonConfig,
  entry: path.resolve(__dirname, 'src', lang, 'worker', `${lang}.worker.ts`),
  output: {
    path: path.resolve(__dirname, 'target/public'),
    filename: `${lang}.editor.worker.js`,
    globalObject: 'self',
  },
  stats: 'errors-only',
});

module.exports = [createLangWorkerConfig('xjson'), createLangWorkerConfig('json')];
