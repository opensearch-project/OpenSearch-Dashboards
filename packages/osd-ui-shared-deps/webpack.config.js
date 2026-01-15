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

const Path = require('path');

const CompressionPlugin = require('compression-webpack-plugin');
const { REPO_ROOT } = require('@osd/utils');
// const webpack = require('webpack');
const { rspack } = require('@rspack/core');
const { getSwcLoaderConfig } = require('@osd/utils');

const UiSharedDeps = require('./index');

const MOMENT_SRC = require.resolve('moment/min/moment-with-locales.js');

const targets = ['last 2 versions', 'ie >= 11'];

exports.getWebpackConfig = ({ dev = false } = {}) => ({
  mode: dev ? 'development' : 'production',
  entry: {
    'osd-ui-shared-deps': './entry.js',
    'osd-ui-shared-deps.v7.dark': ['@elastic/eui/dist/eui_theme_dark.css'],
    'osd-ui-shared-deps.v7.light': ['@elastic/eui/dist/eui_theme_light.css'],
    'osd-ui-shared-deps.v8.dark': ['@elastic/eui/dist/eui_theme_next_dark.css'],
    'osd-ui-shared-deps.v8.light': ['@elastic/eui/dist/eui_theme_next_light.css'],
    'osd-ui-shared-deps.v9.dark': ['@elastic/eui/dist/eui_theme_v9_dark.css'],
    'osd-ui-shared-deps.v9.light': ['@elastic/eui/dist/eui_theme_v9_light.css'],
  },
  context: __dirname,
  devtool: dev ? 'cheap-module-source-map' : false,
  output: {
    path: UiSharedDeps.distDir,
    filename: '[name].js',
    sourceMapFilename: '[file].map',
    devtoolModuleFilenameTemplate: (info) =>
      `osd-ui-shared-deps/${Path.relative(REPO_ROOT, info.absoluteResourcePath)}`,
    library: '__osdSharedDeps__',
    hashFunction: 'xxhash64',
  },

  module: {
    parser: {
      javascript: {
        unknownContextCritical: false,
      },
    },
    noParse: [MOMENT_SRC],
    rules: [
      {
        include: [require.resolve('./entry.js')],
        use: [
          {
            loader: UiSharedDeps.publicPathLoader,
            options: {
              key: 'osd-ui-shared-deps',
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
          {
            loader: 'comment-stripper',
            options: {
              language: 'css',
            },
          },
        ],
        type: 'javascript/auto',
        // Exclude Monaco's codicon CSS which is binary and can't be processed by the standard CSS loader
        exclude: /[\/\\]node_modules[\/\\]monaco-editor[\/\\].*codicon.*\.css$/,
      },
      // Special handling for Monaco's codicon CSS
      {
        test: /[\/\\]node_modules[\/\\]monaco-editor[\/\\].*codicon.*\.css$/,
        use: ['style-loader', 'css-loader'],
        type: 'javascript/auto',
      },
      // Handle Monaco's codicon font files
      {
        test: /[\/\\]node_modules[\/\\]monaco-editor[\/\\].*\.ttf$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
          outputPath: 'fonts/',
          publicPath: 'fonts/',
        },
      },
      {
        test: /\.scss$/,
        use: [
          rspack.CssExtractRspackPlugin.loader,
          'css-loader',
          {
            loader: 'comment-stripper',
            options: {
              language: 'css',
            },
          },
          {
            loader: 'sass-loader',
            options: {
              api: 'modern-compiler',
              implementation: require.resolve('sass-embedded'),
            },
          },
        ],
        type: 'css',
      },
      {
        include: [require.resolve('./theme.ts')],
        use: getSwcLoaderConfig({ syntax: 'typescript', targets }),
      },
      {
        test: !dev ? /[\\\/]@elastic[\\\/]eui[\\\/].*\.js$/ : () => false,
        use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
      },
      {
        test: /worker_proxy_service\.js$/,
        exclude: /node_modules/,
        use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
      },
      // Add special handling for monaco-editor files to transpile newer JavaScript syntax
      {
        test: /[\/\\]node_modules[\/\\]monaco-editor[\/\\].*\.js$/,
        use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
      },
      // Add special handling for ANTLR-generated JavaScript files in osd-monaco
      {
        test: /[\/\\]osd-antlr-grammar[\/\\]target[\/\\].*\.generated[\/\\].*\.js$/,
        use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
      },
      // Add special handling for antlr4ng ES module files
      {
        test: /[\/\\]node_modules[\/\\]antlr4ng[\/\\].*\.m?js$/,
        use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
      },
      // Add special handling for all osd-monaco target JavaScript files
      {
        test: /[\/\\]osd-monaco[\/\\]target[\/\\].*\.js$/,
        use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
      },
    ],
  },

  resolve: {
    alias: {
      moment: MOMENT_SRC,
    },
    extensions: ['.js', '.ts'],
  },

  optimization: {
    emitOnErrors: false,
    splitChunks: {
      cacheGroups: {
        'osd-ui-shared-deps.@elastic': {
          name: 'osd-ui-shared-deps.@elastic',
          test: (m) => m.resource && m.resource.includes('@elastic'),
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },

  performance: {
    // NOTE: we are disabling this as those hints
    // are more tailored for the final bundles result
    // and not for the webpack compilations performance itself
    hints: false,
  },

  plugins: [
    new rspack.CssExtractRspackPlugin({}),
    new rspack.DefinePlugin({
      'process.env.NODE_ENV': dev ? '"development"' : '"production"',
    }),
    ...(dev
      ? []
      : [
          new CompressionPlugin({
            algorithm: 'brotliCompress',
            filename: '[path][base].br',
            test: /\.(js|css)$/,
          }),
          new CompressionPlugin({
            algorithm: 'gzip',
            filename: '[path][base].gz',
            test: /\.(js|css)$/,
          }),
        ]),
  ],
});
