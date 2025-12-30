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

import Path from 'path';

import webpack from 'webpack';
// Webpack 5: TerserPlugin is now properly typed, no @ts-expect-error needed
import TerserPlugin from 'terser-webpack-plugin';
// Webpack 5: webpack-merge v5 uses named export 'merge' instead of default export
import { merge } from 'webpack-merge';
import CompressionPlugin from 'compression-webpack-plugin';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import * as UiSharedDeps from '@osd/ui-shared-deps';

import { Bundle, BundleRefs, WorkerConfig } from '../common';
import { BundleRefsPlugin } from './bundle_refs_plugin';
import { STATS_WARNINGS_FILTER } from './webpack_helpers';

const BABEL_PRESET_PATH = require.resolve('@osd/babel-preset/webpack_preset');

export function getWebpackConfig(bundle: Bundle, bundleRefs: BundleRefs, worker: WorkerConfig) {
  const ENTRY_CREATOR = require.resolve('./entry_point_creator');

  const commonConfig: webpack.Configuration = {
    context: Path.normalize(bundle.contextDir),
    entry: {
      [bundle.id]: ENTRY_CREATOR,
    },

    // Webpack 5: Removed '#' prefix from devtool values
    devtool: worker.dist ? false : 'cheap-source-map',
    profile: worker.profileWebpack,
    target: 'web',
    output: {
      path: bundle.outputDir,
      filename: `${bundle.id}.${bundle.type}.js`,
      chunkFilename: `${bundle.id}.chunk.[id].js`,
      devtoolModuleFilenameTemplate: (info) =>
        `/${bundle.type}:${bundle.id}/${Path.relative(
          bundle.sourceRoot,
          info.absoluteResourcePath
        )}${info.query}`,
      // Webpack 5: jsonpFunction renamed to chunkLoadingGlobal
      chunkLoadingGlobal: `${bundle.id}_bundle_jsonpfunction`,
      chunkLoading: 'jsonp',
      // Webpack 5: hashFunction now uses lowercase 'xxhash64'
      hashFunction: 'xxhash64',
    },

    optimization: {
      moduleIds: worker.dist ? 'deterministic' : 'natural',
      chunkIds: worker.dist ? 'deterministic' : 'natural',
      // Webpack 5: noEmitOnErrors inverted to emitOnErrors
      emitOnErrors: false,
    },

    externals: [UiSharedDeps.externals],

    plugins: [
      // Webpack 5: CleanWebpackPlugin removed, using output.clean instead
      new BundleRefsPlugin(bundle, bundleRefs),
      ...(bundle.banner ? [new webpack.BannerPlugin({ banner: bundle.banner, raw: true })] : []),
      // Webpack 5: Provide Node.js polyfills for browser compatibility
      new NodePolyfillPlugin(),
    ],

    module: {
      // no parse rules for a few known large packages which have no require() statements
      // or which have require() statements that should be ignored because the file is
      // already bundled with all its necessary depedencies
      noParse: [/[\/\\]node_modules[\/\\]lodash[\/\\]index\.js$/],

      rules: [
        {
          include: [ENTRY_CREATOR],
          use: [
            {
              loader: UiSharedDeps.publicPathLoader,
              options: {
                key: bundle.id,
              },
            },
            {
              loader: require.resolve('val-loader'),
              options: {
                entries: bundle.publicDirNames.map((name) => {
                  const absolute = Path.resolve(bundle.contextDir, name);
                  const newContext = Path.dirname(ENTRY_CREATOR);
                  const importId = `${bundle.type}/${bundle.id}/${name}`;

                  // relative path from context of the ENTRY_CREATOR, with linux path separators
                  let requirePath = Path.relative(newContext, absolute).split('\\').join('/');
                  if (!requirePath.startsWith('.')) {
                    // ensure requirePath is identified by node as relative
                    requirePath = `./${requirePath}`;
                  }

                  return { importId, requirePath };
                }),
              },
            },
          ],
        },
        {
          test: /\.css$/,
          include: /node_modules/,
          use: [
            {
              loader: 'style-loader',
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: !worker.dist,
              },
            },
            {
              loader: 'comment-stripper',
              options: {
                language: 'css',
              },
            },
          ],
        },
        {
          test: /\.scss$/,
          exclude: /node_modules/,
          oneOf: [
            ...worker.themeTags.map((theme) => ({
              resourceQuery: `?${theme}`,
              use: [
                {
                  loader: 'style-loader',
                },
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap: !worker.dist,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap: !worker.dist,
                    postcssOptions: {
                      config: require.resolve('@osd/optimizer/postcss.config.js'),
                    },
                  },
                },
                {
                  loader: 'comment-stripper',
                  options: {
                    language: 'css',
                  },
                },
                {
                  loader: 'sass-loader',
                  options: {
                    additionalData(content: string, loaderContext: webpack.LoaderContext<any>) {
                      const req = JSON.stringify(
                        loaderContext.utils.contextify(
                          loaderContext.context || loaderContext.rootContext,
                          Path.resolve(
                            worker.repoRoot,
                            `src/core/public/core_app/styles/_globals_${theme}.scss`
                          )
                        )
                      );
                      return `@import ${req};\n${content}`;
                    },
                    implementation: require('sass-embedded'),
                    sassOptions: {
                      // Webpack 5 / sass-loader v14: outputStyle renamed to style
                      style: 'compressed',
                      // Webpack 5 / sass-loader v14: includePaths renamed to loadPaths
                      loadPaths: [
                        Path.resolve(worker.repoRoot, 'node_modules'),
                        Path.resolve(worker.repoRoot),
                      ],
                      sourceMapRoot: `/${bundle.type}:${bundle.id}`,
                    },
                  },
                },
              ],
            })),
            {
              loader: require.resolve('./theme_loader'),
              options: {
                bundleId: bundle.id,
                themeTags: worker.themeTags,
              },
            },
          ],
        },
        {
          test: /\.(woff|woff2|ttf|eot|svg|ico|png|jpg|gif|jpeg)(\?|$)/,
          // Webpack 5: Asset Modules replace url-loader
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8192,
            },
          },
        },
        {
          test: /\.(js|tsx?)$/,
          exclude: [
            /* vega-lite and some of its dependencies don't have es5 builds
             * so we need to build from source and transpile for webpack v4
             * kbn-handlebars uses modern syntax (nullish coalescing) that needs transpilation
             */
            /[\/\\]node_modules[\/\\](?!(vega(-lite|-label|-functions|-scenegraph)?|kbn-handlebars)[\/\\])/,

            // Don't attempt to look into release artifacts of the plugins
            /[\/\\]plugins[\/\\][^\/\\]+[\/\\]build[\/\\]/,

            // exclude stories
            /\.stories\.(js|jsx|ts|tsx)$/,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              envName: worker.dist ? 'production' : 'development',
              presets: [[BABEL_PRESET_PATH, { useTransformRequireDefault: true }]],
            },
          },
        },
        {
          test: /\.js$/,
          /* reactflow and some of its dependencies don't have es5 builds
           * so we need to build from source and transpile for webpack v4
           */
          include: /node_modules[\\/]@?reactflow/,
          use: {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              envName: worker.dist ? 'production' : 'development',
              presets: [BABEL_PRESET_PATH],
            },
          },
        },
        {
          test: /\.(html|md|txt|tmpl)$/,
          // Webpack 5: asset/source replaces raw-loader
          type: 'asset/source',
        },
        {
          test: /\.cjs$/,
          include: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [BABEL_PRESET_PATH],
            },
          },
        },
        {
          test: /\.m?js$/,
          include: [
            /node_modules[\\/]@dagrejs/,
            /node_modules[\\/]@xyflow/,
            /node_modules[\\/]fast-png/,
            /node_modules[\\/]iobuffer/,
          ],
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
      extensions: ['.js', '.ts', '.tsx', '.json'],
      mainFields: ['browser', 'module', 'main'],
      alias: {
        core_app_image_assets: Path.resolve(worker.repoRoot, 'src/core/public/core_app/images'),
        'opensearch-dashboards/public': Path.resolve(worker.repoRoot, 'src/core/public'),
      },
    },

    performance: {
      // NOTE: we are disabling this as those hints
      // are more tailored for the final bundles result
      // and not for the webpack compilations performance itself
      hints: false,
    },

    ignoreWarnings: [
      STATS_WARNINGS_FILTER,
      /export .* was not found in/,
      /export .* \(reexported as .*\) was not found in/,
      /export .* \(imported as .*\) was not found in/,
      /Should not import the named export/,
    ],
  };

  const nonDistributableConfig: webpack.Configuration = {
    mode: 'development',
    cache: {
      type: 'memory',
      cacheUnaffected: true,
    },
    experiments: {
      cacheUnaffected: true,
      backCompat: false,
    },
    optimization: {
      removeAvailableModules: false,
    },
    module: {
      unsafeCache: true,
    },
  };

  const distributableConfig: webpack.Configuration = {
    mode: 'production',

    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          IS_OPENSEARCH_DASHBOARDS_DISTRIBUTABLE: `"true"`,
        },
      }),
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        // Webpack 5: filename pattern changed from '[path].br' to '[path][base].br'
        filename: '[path][base].br',
        test: /\.(js|css)$/,
        // Webpack 5: cache option removed (handled by webpack's cache system)
      }),
      new CompressionPlugin({
        algorithm: 'gzip',
        // Webpack 5: filename pattern changed from '[path].gz' to '[path][base].gz'
        filename: '[path][base].gz',
        test: /\.(js|css)$/,
        // Webpack 5: cache option removed (handled by webpack's cache system)
      }),
    ],

    optimization: {
      minimizer: [
        new TerserPlugin({
          // Webpack 5 / terser-webpack-plugin v5: Simplified configuration
          // cache, sourceMap, options removed
          extractComments: false,
          parallel: false,
          terserOptions: {
            compress: false,
            mangle: false,
          },
        }),
      ],
    },
  };

  return merge(commonConfig, worker.dist ? distributableConfig : nonDistributableConfig);
}
