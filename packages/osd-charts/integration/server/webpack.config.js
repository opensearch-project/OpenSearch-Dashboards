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

const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: '../tmp/index.tsx',
  mode: 'production',
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].chunk.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    host: '0.0.0.0',
    port: 9002,
    compress: true,
    clientLogLevel: 'silent',
    disableHostCheck: true,
    liveReload: false,
    stats: 'errors-only',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          configFile: 'integration/server/webpack.tsconfig.json',
          transpileOnly: true,
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: { importLoaders: 1 },
          },
        ],
      },
      {
        test: /\.scss$/,
        oneOf: [
          {
            resourceQuery: /^\?lazy$/,
            use: [
              {
                loader: 'style-loader',
                options: {
                  injectType: 'lazyStyleTag',
                },
              },
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
            ],
          },
          {
            use: [
              'style-loader',
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
            ],
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      '@storybook/addon-knobs': path.resolve(__dirname, 'mocks/@storybook/addon-knobs'),
      '@storybook/addon-actions': path.resolve(__dirname, 'mocks/@storybook/addon-actions'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      template: './index.ejs',
      filename: 'index.html',
      favicon: '../../public/favicon.ico',
    }),
    new webpack.EnvironmentPlugin({ RNG_SEED: null }),
  ],
};
