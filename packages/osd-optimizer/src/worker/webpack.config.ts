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
import { rspack, Configuration } from '@rspack/core';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import { getSwcLoaderConfig } from '@osd/utils';
import * as UiSharedDeps from '@osd/ui-shared-deps';
import browserslist from 'browserslist';
import * as sass from 'sass-embedded';

import { Bundle, BundleRefs, WorkerConfig } from '../common';
import { STATS_WARNINGS_FILTER } from './webpack_helpers';
import { BundleDepsCheckPlugin } from './bundle_deps_check_plugin';

const compilers: sass.AsyncCompiler[] = [];
let index = 0;
let initPromise: Promise<void> | undefined;

async function ensureSassCompilers() {
  if (compilers.length > 0) return;
  initPromise ??= (async () => {
    compilers.push(
      ...(await Promise.all([
        sass.initAsyncCompiler(),
        sass.initAsyncCompiler(),
        sass.initAsyncCompiler(),
      ]))
    );
  })();
  await initPromise;
}

export const sassCompiler = {
  ...sass,
  compileStringAsync: async (data: string, options: sass.StringOptions<'async'>) => {
    await ensureSassCompilers();
    const compiler = compilers[index++ % compilers.length];
    return compiler.compileStringAsync(data, options);
  },
  dispose: () => {
    // Dispose of all SASS compilers to allow the process to exit cleanly
    compilers.forEach((compiler) => compiler.dispose());
    compilers.length = 0;
    initPromise = undefined;
  },
};

export function getWebpackConfig(bundle: Bundle, bundleRefs: BundleRefs, worker: WorkerConfig) {
  const targets = browserslist.loadConfig({ path: worker.repoRoot });
  const ENTRY_CREATOR = require.resolve('./entry_point_creator');
  const resolveOptions = {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      core_app_image_assets: Path.resolve(worker.repoRoot, 'src/core/public/core_app/images'),
      'opensearch-dashboards/public': Path.resolve(worker.repoRoot, 'src/core/public'),
    },
  };
  const virtualFiles: Record<string, string> = {};
  const resolver = new rspack.experiments.resolver.ResolverFactory(resolveOptions);

  bundleRefs
    .getRefs()
    .filter((ref) => ref.bundleId !== bundle.id)
    .forEach((ref) => {
      const { path: resolvedPath } = resolver.sync(ref.contextDir, `./${ref.entry}`);
      if (resolvedPath) {
        if (!virtualFiles[resolvedPath]) {
          const contents = `module.exports = __osdBundles__.get('${ref.exportId}')`;
          virtualFiles[resolvedPath] = contents;
        }
      }
    });

  const commonConfig: Configuration = {
    mode: worker.dist ? 'production' : 'development',
    context: Path.normalize(bundle.contextDir),
    cache: true,
    entry: {
      [bundle.id]: ENTRY_CREATOR,
    },

    devtool: worker.dist ? false : 'cheap-module-source-map',
    profile: worker.profileWebpack,

    output: {
      path: bundle.outputDir,
      filename: `${bundle.id}.${bundle.type}.js`,
      chunkFilename: `${bundle.id}.chunk.[id].js`,
      devtoolModuleFilenameTemplate: (info) =>
        `/${bundle.type}:${bundle.id}/${Path.relative(
          bundle.sourceRoot,
          info.absoluteResourcePath
        )}${info.query}`,
      chunkLoadingGlobal: `${bundle.id}_bundle_jsonpfunction`,
      hashFunction: 'xxhash64',
      clean: true,
    },

    optimization: {
      emitOnErrors: false,
      chunkIds: 'natural',
      minimizer: [
        new rspack.SwcJsMinimizerRspackPlugin({
          extractComments: false,
          minimizerOptions: {
            compress: false,
            mangle: false,
          },
        }),
        new rspack.LightningCssMinimizerRspackPlugin(),
      ],
    },

    externals: [UiSharedDeps.externals],

    plugins: [
      new BundleDepsCheckPlugin(bundle, bundleRefs),
      new NodePolyfillPlugin({ additionalAliases: ['process'] }),
      new rspack.DefinePlugin({
        'process.env.IS_OPENSEARCH_DASHBOARDS_DISTRIBUTABLE': JSON.stringify(
          worker.dist ? 'true' : 'false'
        ),
      }),
      new rspack.experiments.VirtualModulesPlugin(virtualFiles),
      ...(bundle.banner ? [new rspack.BannerPlugin({ banner: bundle.banner, raw: true })] : []),
      ...(worker.dist
        ? [
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
          ]
        : []),
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
          type: 'javascript/auto',
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
                  type: 'javascript/auto',
                },
                {
                  loader: 'css-loader',
                  options: {
                    sourceMap: !worker.dist,
                  },
                  type: 'javascript/auto',
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap: !worker.dist,
                    postcssOptions: {
                      config: require.resolve('@osd/optimizer/postcss.config.js'),
                    },
                  },
                  type: 'css',
                },
                {
                  loader: 'comment-stripper',
                  options: {
                    language: 'css',
                  },
                },
                {
                  loader: 'sass-loader',
                  type: 'css',
                  options: {
                    additionalData(content: string) {
                      const additional = `@import '${Path.resolve(
                        worker.repoRoot,
                        `src/core/public/core_app/styles/_globals_${theme}.scss`
                      ).replace(/\\/g, '/')}';`;
                      return `${additional}\n${content}`;
                    },
                    api: 'modern',
                    webpackImporter: false,
                    implementation: sassCompiler,
                    sassOptions: {
                      sourceMap: !worker.dist,
                      style: worker.dist ? 'compressed' : 'expanded',
                      quietDeps: true,
                      loadPaths: [
                        Path.resolve(worker.repoRoot, 'node_modules'),
                        Path.resolve(worker.repoRoot),
                      ],
                      silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
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
          type: 'asset',
        },
        {
          test: /\.(j|t)sx?$/,
          exclude: [
            /* vega-lite, reactflow and some of its dependencies don't have es5 builds
             * so we need to build from source and transpile for webpack v4
             * kbn-handlebars uses modern syntax (nullish coalescing) that needs transpilation
             */
            /[\/\\]node_modules[\/\\](?!(vega(-lite|-label|-functions|-scenegraph)?|kbn-handlebars|@?reactflow)[\/\\])/,

            // Don't attempt to look into release artifacts of the plugins
            /[\/\\]plugins[\/\\][^\/\\]+[\/\\]build[\/\\]/,

            // exclude core-js
            /node_modules[\\/]core-js/,
          ],
          use: getSwcLoaderConfig({ syntax: 'typescript', jsx: true, targets }),
        },
        {
          test: /\.m?js$/,
          resolve: {
            // This allows Rspack to resolve ES modules without the .js/.mjs extension
            fullySpecified: false,
          },
        },
        {
          test: /\.(html|md|txt|tmpl)$/,
          type: 'asset/source',
        },
        {
          test: /\.cjs$/,
          include: /node_modules/,
          exclude: [/node_modules[\\/]core-js/],
          use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
        },
        {
          test: /\.m?js$/,
          include: [
            /node_modules[\\/]@dagrejs/,
            /node_modules[\\/]@xyflow/,
            /node_modules[\\/]fast-png/,
            /node_modules[\\/]iobuffer/,
          ],
          exclude: [/node_modules[\\/]core-js/],
          use: getSwcLoaderConfig({ syntax: 'ecmascript', targets }),
        },
      ],
    },

    resolve: resolveOptions,

    performance: {
      // NOTE: we are disabling this as those hints
      // are more tailored for the final bundles result
      // and not for the webpack compilations performance itself
      hints: false,
    },
    ignoreWarnings: [STATS_WARNINGS_FILTER],
  };

  return commonConfig;
}
