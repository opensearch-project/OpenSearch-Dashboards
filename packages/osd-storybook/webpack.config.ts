/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { stringifyRequest } from 'loader-utils';
import { Configuration, Stats } from 'webpack';
import webpackMerge from 'webpack-merge';
import { REPO_ROOT } from './lib/constants';

const stats = {
  ...Stats.presetToOptions('minimal'),
  colors: true,
  errorDetails: true,
  errors: true,
  moduleTrace: true,
  warningsFilter: /(export .* was not found in)|(entrypoint size limit)/,
};

// Extend the Storybook Webpack config with some customizations
/* eslint-disable import/no-default-export */
export default function ({ config: storybookConfig }: { config: Configuration }) {
  const config = {
    devServer: {
      stats,
    },
    module: {
      rules: [
        {
          test: /\.(js|tsx?)$/,
          exclude: [
            /* vega-lite and some of its dependencies don't have es5 builds
             * so we need to build from source and transpile for webpack v4
             */
            /[\/\\]node_modules[\/\\](?!vega(-lite|-label|-functions|-scenegraph)?[\/\\])/,

            // Don't attempt to look into release artifacts of the plugins
            /[\/\\]plugins[\/\\][^\/\\]+[\/\\]build[\/\\]/,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [require.resolve('@osd/babel-preset/webpack_preset')],
            },
          },
        },
        {
          test: /\.(cjs)$/,
          include: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [require.resolve('@osd/babel-preset/webpack_preset')],
            },
          },
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto',
          use: {
            loader: 'babel-loader',
            options: {
              presets: [require.resolve('@osd/babel-preset/webpack_preset')],
            },
          },
        },
        // Add special handling for monaco-editor files to transpile newer JavaScript syntax
        {
          test: /[\/\\]node_modules[\/\\]monaco-editor[\/\\].*\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [require.resolve('@osd/babel-preset/webpack_preset')],
              plugins: [
                require.resolve('@babel/plugin-transform-class-static-block'),
                require.resolve('@babel/plugin-transform-nullish-coalescing-operator'),
                require.resolve('@babel/plugin-transform-optional-chaining'),
                require.resolve('@babel/plugin-transform-numeric-separator'),
              ],
            },
          },
        },
        {
          test: /\.(html|md|txt|tmpl)$/,
          use: {
            loader: 'raw-loader',
          },
        },
        {
          test: /\.scss$/,
          exclude: /\.module.(s(a|c)ss)$/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader', options: { importLoaders: 2 } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: require.resolve('@osd/optimizer/postcss.config.js'),
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                additionalData(content: string, loaderContext: any) {
                  return `@import ${stringifyRequest(
                    loaderContext,
                    resolve(REPO_ROOT, 'src/core/public/core_app/styles/_globals_v7light.scss')
                  )};\n${content}`;
                },
                sassOptions: {
                  includePaths: [resolve(REPO_ROOT, 'node_modules')],
                },
              },
            },
          ],
        },
      ],
    },
    resolve: {
      // Tell Webpack about the scss extension
      extensions: ['.scss'],
      alias: {
        core_app_image_assets: resolve(REPO_ROOT, 'src/core/public/core_app/images'),
      },
    },
    stats,
  };

  // @ts-ignore There's a long error here about the types of the
  // incompatibility of Configuration, but it looks like it just may be Webpack
  // type definition related.
  return webpackMerge(storybookConfig, config);
}
