/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolve } from 'path';
import { Configuration } from 'webpack';
// Webpack 5: webpack-merge v5 uses named export 'merge'
import { merge as webpackMerge } from 'webpack-merge';
import { REPO_ROOT } from './lib/constants';

const BABEL_PRESET_PATH = require.resolve('@osd/babel-preset/webpack_preset');

// Webpack 5: Stats.presetToOptions removed, use preset string directly
const stats = {
  preset: 'minimal',
  colors: true,
  errorDetails: true,
  errors: true,
  moduleTrace: true,
};

// Extend the Storybook Webpack config with some customizations
/* eslint-disable import/no-default-export */
export default function ({ config: storybookConfig }: { config: Configuration }) {
  // Remove Storybook's default CSS rules to avoid double processing
  // Storybook's CSS rules conflict with PostCSS 8 configuration
  if (storybookConfig.module?.rules) {
    storybookConfig.module.rules = storybookConfig.module.rules.filter((rule) => {
      if (rule && typeof rule === 'object' && 'test' in rule) {
        const testStr = rule.test?.toString();
        // Remove CSS rules (but keep other rules)
        if (testStr && (testStr.includes('\\.css') || testStr.includes('.css'))) {
          return false;
        }
      }
      return true;
    });
  }

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
              presets: [BABEL_PRESET_PATH],
            },
          },
        },
        {
          test: /\.(cjs)$/,
          include: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [BABEL_PRESET_PATH],
            },
          },
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [BABEL_PRESET_PATH],
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
              presets: [BABEL_PRESET_PATH],
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
          // Webpack 5: asset/source replaces raw-loader
          type: 'asset/source',
        },
        {
          test: /\.css$/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader', options: { importLoaders: 1 } },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    'postcss-flexbugs-fixes',
                    [
                      'autoprefixer',
                      {
                        flexbox: 'no-2009',
                      },
                    ],
                  ],
                },
              },
            },
          ],
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
                api: 'modern',
                additionalData(content: string, loaderContext: any) {
                  return `@import ${JSON.stringify(
                    loaderContext.utils.contextify(
                      loaderContext.context || loaderContext.rootContext,
                      resolve(REPO_ROOT, 'src/core/public/core_app/styles/_globals_v7light.scss')
                    )
                  )};\n${content}`;
                },
                sassOptions: {
                  // Webpack 5 / sass-loader v14: includePaths renamed to loadPaths
                  loadPaths: [resolve(REPO_ROOT, 'node_modules')],
                  // Silence deprecation warnings from @elastic/eui (using old Sass APIs)
                  silenceDeprecations: [
                    'color-functions',
                    'global-builtin',
                    'import',
                    'legacy-js-api',
                  ],
                  // Suppress Sass if() function deprecation warnings
                  quietDeps: true,
                },
              },
            },
          ],
        },
        {
          test: /\.m?js$/,
          include: [/node_modules[\\/]@dagrejs/, /node_modules[\\/]@xyflow/],
          use: {
            loader: 'babel-loader',
            options: {
              presets: [BABEL_PRESET_PATH],
              plugins: [
                '@babel/plugin-transform-class-properties',
                '@babel/plugin-transform-class-static-block',
                '@babel/plugin-transform-private-methods',
                '@babel/plugin-transform-private-property-in-object',
              ],
            },
          },
        },
      ],
    },
    resolve: {
      // Tell Webpack about the scss extension
      extensions: ['.scss'],
      alias: {
        core_app_image_assets: resolve(REPO_ROOT, 'src/core/public/core_app/images'),
        // Legacy module aliases used by some plugins (pointing to core exports)
        'opensearch-dashboards/public': resolve(REPO_ROOT, 'src/core/public'),
        'opensearch-dashboards/server': resolve(REPO_ROOT, 'src/core/server'),
      },
    },
    stats,
    // Webpack 5: Add ignoreWarnings to replace stats.warningsFilter
    ignoreWarnings: [
      /export .* was not found in/,
      /entrypoint size limit/,
      // Suppress autoprefixer warnings about flex-end (from @elastic/eui CSS)
      /from "autoprefixer" plugin/,
    ],
  };

  // @ts-ignore There's a long error here about the types of the
  // incompatibility of Configuration, but it looks like it just may be Webpack
  // type definition related.
  return webpackMerge(storybookConfig, config);
}
