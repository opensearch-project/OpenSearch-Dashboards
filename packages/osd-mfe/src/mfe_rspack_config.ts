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
import { getSwcLoaderConfig } from '@osd/utils';
import * as UiSharedDeps from '@osd/ui-shared-deps';
import browserslist from 'browserslist';

import { DiscoveredUiPlugin } from './discover_plugins';

// `node-polyfill-webpack-plugin` ships type declarations that pull in a newer
// `type-fest` than this repo's TypeScript (4.6) can parse. Require it as a value
// so its type graph stays out of the type program; it is only used as a plugin
// constructor below (the optimizer imports it the same way but is built via babel).
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

/** Default OSD theme whose SCSS globals are prepended to every `.scss` import. */
const DEFAULT_THEME_GLOBALS = 'v9light';

/** Options controlling how a single plugin's Module Federation remote is built. */
export interface MfeRspackConfigOptions {
  /** The discovered UI plugin to build as a remote. */
  plugin: DiscoveredUiPlugin;
  /** Absolute path to the OpenSearch Dashboards repo root. */
  repoRoot: string;
  /** Absolute path to the resolved public entry module to expose (`public/index.ts`). */
  publicEntry: string;
  /**
   * A Sass implementation (e.g. an initialized `sass-embedded` compiler) handed
   * to `sass-loader`. The caller owns its lifecycle so it can be disposed once
   * the build finishes, allowing the process to exit cleanly.
   */
  sassImplementation: unknown;
  /** Produce a production (minified) build. Defaults to `false` (development). */
  dist?: boolean;
  /**
   * The OSD theme whose SCSS globals (`_globals_<theme>.scss`) are injected so
   * EUI variables/mixins referenced by plugin styles resolve. Defaults to
   * `v9light`.
   */
  themeGlobals?: string;
}

/**
 * Build the Rspack configuration that compiles a single OSD UI plugin's public
 * entry into a Module Federation remote (`remoteEntry.js`) under
 * `<repoRoot>/target/mfe/<pluginId>/`.
 *
 * The config deliberately mirrors the loader/resolve settings used by the
 * existing optimizer (`packages/osd-optimizer/src/worker/webpack.config.ts`):
 * the same `builtin:swc-loader` settings (via `getSwcLoaderConfig`), the same
 * resolve aliases, and the same `@osd/ui-shared-deps` externals so the remote
 * does not bundle its own copy of React/EUI/etc. Converting those externals to
 * Module Federation `shared` singletons is handled in the next story; for now
 * `shared` is left empty (the "default").
 *
 * This is purely additive and never writes to the plugin's existing
 * `target/public` optimizer output.
 */
export function getMfeRspackConfig(options: MfeRspackConfigOptions): Configuration {
  const { plugin, repoRoot, publicEntry, sassImplementation, dist = false } = options;
  const themeGlobals = options.themeGlobals ?? DEFAULT_THEME_GLOBALS;

  // Same browser targets the optimizer transpiles for, read from the repo's
  // browserslist config so SWC output matches the existing build.
  const targets = browserslist.loadConfig({ path: repoRoot });

  const resolveOptions = {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    mainFields: ['browser', 'module', 'main'],
    alias: {
      // Mirrors the optimizer aliases so plugin/core imports resolve identically.
      core_app_image_assets: Path.resolve(repoRoot, 'src/core/public/core_app/images'),
      'opensearch-dashboards/public': Path.resolve(repoRoot, 'src/core/public'),
    },
  };

  // Absolute path (forward-slashed for Sass) to the theme globals prepended to
  // every plugin `.scss` import, exactly as the optimizer's sass-loader does.
  const globalsImport = Path.resolve(
    repoRoot,
    `src/core/public/core_app/styles/_globals_${themeGlobals}.scss`
  ).replace(/\\/g, '/');

  // sass-loader options are typed loosely (the implementation is supplied by the
  // caller), so build them as a plain record to pass through unchanged.
  const sassLoaderOptions: Record<string, unknown> = {
    api: 'modern',
    webpackImporter: false,
    implementation: sassImplementation,
    additionalData: (content: string) => `@import '${globalsImport}';\n${content}`,
    sassOptions: {
      quietDeps: true,
      loadPaths: [Path.resolve(repoRoot, 'node_modules'), repoRoot],
      silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
    },
  };

  return {
    mode: dist ? 'production' : 'development',
    target: 'web',
    context: Path.normalize(plugin.directory),
    // A pure remote has no application entry of its own; the Module Federation
    // container entry (remoteEntry.js) is injected by ModuleFederationPlugin.
    entry: {},
    devtool: dist ? false : 'cheap-module-source-map',

    output: {
      path: Path.resolve(repoRoot, 'target/mfe', plugin.id),
      filename: `${plugin.id}.[name].js`,
      chunkFilename: `${plugin.id}.chunk.[id].js`,
      // `auto` lets the MF runtime infer the base URL from the remoteEntry
      // location so dynamically-loaded chunks resolve wherever the remote is served.
      publicPath: 'auto',
      uniqueName: `osdMfe_${plugin.id}`,
      clean: true,
    },

    // Reuse OSD's existing shared-deps externals so the remote references the
    // `__osdSharedDeps__` globals instead of bundling react/react-dom/EUI/etc.
    externals: [UiSharedDeps.externals],

    plugins: [
      new NodePolyfillPlugin({ additionalAliases: ['process'] }),
      new rspack.DefinePlugin({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'process.env.IS_OPENSEARCH_DASHBOARDS_DISTRIBUTABLE': JSON.stringify(
          dist ? 'true' : 'false'
        ),
      }),
      new rspack.container.ModuleFederationPlugin({
        name: plugin.id,
        filename: 'remoteEntry.js',
        // Expose the plugin's public entry as `./public`, matching the design's
        // registry `module: "./public"` convention (see docs/01-MFE-DESIGN.md).
        exposes: {
          './public': publicEntry,
        },
        // Shared singletons (react, react-dom, @osd/i18n, ...) are wired in the
        // next story; until then shared deps are provided via the externals map.
        shared: {},
      }),
    ],

    module: {
      // lodash has no meaningful require() statements to parse.
      noParse: [/[\/\\]node_modules[\/\\]lodash[\/\\]index\.js$/],

      rules: [
        {
          test: /\.scss$/,
          exclude: /node_modules/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader', options: { sourceMap: !dist } },
            { loader: 'sass-loader', options: sassLoaderOptions },
          ],
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
        },
        {
          test: /\.(woff|woff2|ttf|eot|svg|ico|png|jpg|gif|jpeg)(\?|$)/,
          type: 'asset',
        },
        {
          test: /\.(html|md|txt|tmpl)$/,
          type: 'asset/source',
        },
        {
          test: /\.(j|t)sx?$/,
          exclude: [
            // Don't transpile node_modules except the few packages that ship
            // only modern/untranspiled sources (matches the optimizer's list).
            /[\/\\]node_modules[\/\\](?!(vega(-lite|-label|-functions|-scenegraph)?|kbn-handlebars|@?reactflow)[\/\\])/,
            // Don't look into release artifacts of installed plugins.
            /[\/\\]plugins[\/\\][^\/\\]+[\/\\]build[\/\\]/,
            // Don't reprocess core-js.
            /node_modules[\\/]core-js/,
          ],
          use: getSwcLoaderConfig({ syntax: 'typescript', jsx: true, targets }),
        },
        {
          test: /\.m?js$/,
          resolve: {
            // Allow Rspack to resolve ES modules without an explicit extension.
            fullySpecified: false,
          },
        },
      ],
    },

    resolve: resolveOptions,

    performance: {
      // Size hints are tuned for final bundles, not these compilations.
      hints: false,
    },
  };
}
