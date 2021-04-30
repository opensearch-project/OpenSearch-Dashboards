/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const path = require('path');

const CircularDependencyPlugin = require('circular-dependency-plugin');
const webpack = require('webpack');

const nonce = 'Pk1rZ1XDlMuYe8ubWV3Lh0BzwrTigJQ=';
const scssLoaders = [
  {
    loader: 'css-loader',
    options: { importLoaders: 1 },
  },
  {
    loader: 'postcss-loader',
    options: {
      plugins: [require('autoprefixer')],
    },
  },
  'sass-loader',
];

const MAX_CYCLES = 0;
let numCyclesDetected = 0;

module.exports = async ({ config }) => {
  config.plugins.push(
    new webpack.EnvironmentPlugin({
      RNG_SEED: null,
      VRT: process.env.VRT ?? null,
    }),
  );
  config.plugins.push(
    new CircularDependencyPlugin({
      onStart() {
        numCyclesDetected = 0;
      },
      onDetected({ paths, compilation }) {
        if (!/^node_modules\/.+/.test(paths[0])) {
          numCyclesDetected++;
          compilation.warnings.push(new Error(paths.join(' -> ')));
        }
      },
      onEnd({ compilation }) {
        if (numCyclesDetected > MAX_CYCLES) {
          compilation.errors.push(
            new Error(`Detected ${numCyclesDetected} cycles which exceeds configured limit of ${MAX_CYCLES}`),
          );
        }
      },
    }),
  );

  config.module.rules.push({
    test: /\.tsx?$/,
    loader: 'ts-loader',
    exclude: /node_modules/,
    options: {
      configFile: 'tsconfig.json',
      transpileOnly: true,
    },
  });

  config.module.rules.push({
    test: /\.tsx?$/,
    include: [path.resolve(__dirname, '../stories/')],
    exclude: [path.resolve(__dirname, '../stories/utils')],
    loaders: [
      {
        loader: require.resolve('@storybook/source-loader'),
        options: { parser: 'typescript' },
      },
    ],
    enforce: 'pre',
  });

  // Replace default css rules with nonce
  config.module.rules = config.module.rules.filter(({ test }) => !test.test('.css'));
  config.module.rules.push({
    test: /\.css$/,
    use: [
      {
        loader: 'style-loader',
        options: {
          attributes: {
            nonce,
          },
        },
      },
      {
        loader: 'css-loader',
        options: { importLoaders: 1 },
      },
    ],
  });

  config.module.rules.push({
    test: /\.scss$/,
    include: [path.resolve(__dirname, '../storybook'), path.resolve(__dirname, '../node_modules/@elastic')],
    use: [
      {
        loader: 'style-loader',
        options: {
          attributes: {
            nonce,
          },
        },
      },
      ...scssLoaders,
    ],
  });

  // Used for lazy loaded scss files
  config.module.rules.push({
    test: /\.scss$/,
    resourceQuery: /^\?lazy$/,
    use: [
      {
        loader: 'style-loader',
        options: {
          injectType: 'lazyStyleTag',
          attributes: {
            nonce,
          },
        },
      },
      ...scssLoaders,
    ],
  });

  config.resolve.extensions.push('.ts', '.tsx');

  return await config;
};
