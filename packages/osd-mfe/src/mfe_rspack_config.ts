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
// Lazy-load `@rspack/core` at call time inside `getMfeRspackConfig` (below) —
// not statically here. The native binding registers a process-lifetime
// `CustomGC` handle that prevents Jest from exiting, hanging the test runner
// whenever any test transitively imports this module (or the package barrel
// that re-exports it). Keeping `Configuration` as a TYPE-ONLY import means
// merely importing this module is binding-free; only an actual config build
// pulls rspack in.
import type { Configuration } from '@rspack/core';
import { getSharedLoaderRules } from '@osd/utils';
import browserslist from 'browserslist';

import { DiscoveredUiPlugin } from './discover_plugins';
import { getMfeExternals, getMfeSharedConfig } from './mfe_shared_deps';

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
   * Every discovered UI plugin (id + source directory), used to externalize
   * cross-plugin imports. OSD plugins may import another plugin's PUBLIC entry
   * directly (e.g. `visualizations` imports `../../vis_augmenter/public`). Such an
   * import must NOT be bundled into this remote — the imported plugin has its own
   * module-singleton state (e.g. `createGetterSetter('UISettings')`) that is only
   * initialized in ITS OWN remote's `start()`. Bundling a second copy here yields a
   * never-initialized duplicate ("UISettings was not set."). Instead we redirect
   * those imports to `__osdBundles__.get('plugin/<id>/public')` (the same plugin
   * instance the MFE bootstrap registers before core boot), mirroring how the
   * optimizer externalizes cross-bundle refs. Defaults to `[plugin]` (no peers).
   */
  allPlugins?: DiscoveredUiPlugin[];
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
 * resolve aliases. The `@osd/ui-shared-deps` set is split between Module
 * Federation `shared` singletons (top-level package roots — react, react-dom,
 * @elastic/eui, ...) and plain `externals` (sub-path/JSON specifiers). Either
 * way the remote does not bundle its own copy of React/EUI/etc.
 *
 * This is purely additive and never writes to the plugin's existing
 * `target/public` optimizer output.
 */
export function getMfeRspackConfig(options: MfeRspackConfigOptions): Configuration {
  // Lazy-acquire the `@rspack/core` value namespace at call time (the file-level
  // import is type-only — see the import-block comment). This way merely
  // importing this module never loads the native binding (which registers a
  // process-lifetime `CustomGC` handle that hangs Jest); only an actual config
  // build pulls rspack in. The unit test that exercises this function mocks
  // `@rspack/core` so it stays binding-free in tests.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { rspack } = require('@rspack/core') as typeof import('@rspack/core');
  const { plugin, repoRoot, publicEntry, sassImplementation, dist = false } = options;
  const themeGlobals = options.themeGlobals ?? DEFAULT_THEME_GLOBALS;
  const allPlugins = options.allPlugins ?? [plugin];

  // Stable chunk name pinned to the Module Federation exposed `./public` entry (via
  // the `exposes` object form below). The bootstrap MUST resolve `./public` for every
  // plugin at boot (`container.get('./public')` — plugin_reader's synchronous
  // contract), so this is the eager plugin ENTRY (the MFE analogue of the optimizer's
  // `<id>.plugin.js`), not a lazy app chunk. Pinning the name lets `output.chunkFilename`
  // identify it reliably (rspack would otherwise name the chunk after an arbitrary
  // contained module, and the name varies per plugin / between dev and `--dist`).
  //
  // `<plugin>.plugin.js` is emitted as a separate file BY rspack (the MF
  // plugin always emits exposes as their own chunk), then COLLAPSED into
  // `remoteEntry.js` by a post-build merge step in `build_mfe_for_plugin.ts`
  // (`mergeExposedEntryIntoRemoteEntry`). The merge concatenates the eager
  // chunk's `webpackChunk<scope>.push([[chunkId], modules])` BEFORE the
  // runtime's IIFE so the runtime's standard
  // `chunkLoadingGlobal.forEach(webpackJsonpCallback)` picks
  // up the pre-pushed entry and marks the chunk installed — `container.get('./public')`
  // then resolves WITHOUT an additional network fetch. The rspack config below stays
  // unchanged (the chunk is still emitted with the `<plugin>.plugin.js` name during
  // compilation) because trying to suppress the chunk via rspack config is harder to
  // do robustly across all 58 plugins than collapsing it post-build; per-plugin SRI,
  // lazy-chunk SRI, and the MF runtime contract are all preserved.
  const EXPOSED_ENTRY_CHUNK_NAME = `${plugin.id}__mfe_public_entry`;

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

  // Externalize cross-plugin PUBLIC imports to the host's `__osdBundles__` shim so
  // each peer plugin resolves to the SINGLE instance the MFE bootstrap registers
  // (as `plugin/<id>/public`) before core boot — never a bundled-in duplicate.
  // This mirrors the optimizer (packages/osd-optimizer/src/worker/webpack.config.ts):
  // resolve each OTHER plugin's `public` entry to its absolute path and back it with
  // a virtual module `module.exports = __osdBundles__.get('plugin/<id>/public')`, so
  // any import (relative like `../../vis_augmenter/public`, or otherwise) that resolves
  // to that path is redirected to the shared remote instead of recompiled here.
  const crossPluginVirtualFiles: Record<string, string> = {};
  const resolver = new rspack.experiments.resolver.ResolverFactory(resolveOptions);
  for (const peer of allPlugins) {
    if (peer.id === plugin.id) {
      continue;
    }
    let resolvedPath: string | undefined;
    try {
      resolvedPath = resolver.sync(peer.directory, './public')?.path;
    } catch (e) {
      // A peer without a resolvable `public` entry simply has nothing to redirect.
      resolvedPath = undefined;
    }
    if (resolvedPath && !crossPluginVirtualFiles[resolvedPath]) {
      crossPluginVirtualFiles[
        resolvedPath
      ] = `module.exports = __osdBundles__.get('plugin/${peer.id}/public')`;
    }
  }

  // Externalize OSD CORE public imports to the host's `__osdBundles__` shim instead
  // of bundling a SECOND copy of core into every remote (home was ~24x its old size
  // because core_public_* chunks were compiled in). The MFE bootstrap loads the
  // server-provided `core.entry.js` FIRST (see bootstrap_mfe.js.hbs), registering the
  // core public bundle under `entry/core/public` (+ `entry/core/public/utils`) before
  // any remote evaluates, so the redirect resolves to the single host core instance.
  //
  // This mirrors the optimizer's core externalization
  // (packages/osd-optimizer/src/worker/webpack.config.ts + optimizer_config.ts): the
  // optimizer declares the core bundle as `{ type: 'entry', id: 'core',
  // publicDirNames: ['public', 'public/utils'] }`, yielding bundle refs with exportIds
  // `entry/core/<dir>` (see common/bundle_refs.ts: `${type}/${id}/${name}`). For each it
  // resolves `./<dir>` against `src/core` and backs the resolved path with a virtual
  // module `module.exports = __osdBundles__.get('entry/core/<dir>')`. We replicate that
  // here so the `opensearch-dashboards/public` alias (which normalizes the import to
  // `src/core/public`) and direct relative imports of `src/core/public/utils` (used by
  // e.g. saved_objects_management, workspace, vis_type_vislib) both redirect to the
  // shared core rather than recompiling core into the remote — a single core instance,
  // and the multi-MB core chunks are gone. Cross-plugin externalization (above) is
  // unchanged. The MFE only builds UI plugins (never core itself), so there is no
  // self-reference to guard against here.
  const coreContextDir = Path.resolve(repoRoot, 'src/core');
  for (const coreDir of ['public', 'public/utils']) {
    let resolvedCorePath: string | undefined;
    try {
      resolvedCorePath = resolver.sync(coreContextDir, `./${coreDir}`)?.path;
    } catch (e) {
      // If core's public entry can't be resolved there is nothing to redirect.
      resolvedCorePath = undefined;
    }
    if (resolvedCorePath && !crossPluginVirtualFiles[resolvedCorePath]) {
      crossPluginVirtualFiles[
        resolvedCorePath
      ] = `module.exports = __osdBundles__.get('entry/core/${coreDir}')`;
    }
  }

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
      // The Module Federation EXPOSED entry (`./public`) is resolved at BOOT by the
      // bootstrap's REQUIRED `container.get('./public')` for EVERY plugin (to satisfy
      // plugin_reader's synchronous `__osdBundles__.get('plugin/<id>/public').plugin`
      // contract — see bootstrap_mfe.ts step 3). It is therefore the eager plugin
      // ENTRY — the MFE analogue of the optimizer's eager `<id>.plugin.js` — and NOT
      // a lazy, navigation-loaded app chunk. Native OSD names eager plugin entries
      // `<id>.plugin.js` and lazy app chunks `<id>.chunk.<id>.js`; the lazy-loading
      // regression was that the MFE emitted the eager exposed entry with
      // the `.chunk.` infix, so it both looked like — and was measured as — a deferred
      // app chunk being loaded at boot. Name the exposed-entry chunk as the eager
      // plugin entry, and keep every genuinely dynamic-`import()`'d chunk (doc views,
      // embeddables, an app's `application/*` render code) under `.chunk.` so it loads
      // on navigation, restoring OSD-parity lazy loading.
      chunkFilename: (pathData: { chunk?: { id?: string | number; name?: string } }) => {
        const id = String(pathData.chunk?.id ?? pathData.chunk?.name ?? '');
        // The exposed `./public` entry is pinned to a stable chunk name (see the
        // `exposes` object form in the ModuleFederationPlugin config below), so it is
        // identified reliably across ALL plugins and in dev AND `--dist`, regardless
        // of which source module rspack would otherwise pick to name the chunk.
        if (id === EXPOSED_ENTRY_CHUNK_NAME) {
          return `${plugin.id}.plugin.js`;
        }
        return `${plugin.id}.chunk.${id}.js`;
      },
      // `auto` lets the MF runtime infer the base URL from the remoteEntry
      // location so dynamically-loaded chunks resolve wherever the remote is served.
      publicPath: 'auto',
      uniqueName: `osdMfe_${plugin.id}`,
      // Subresource Integrity — defense-in-depth for LAZY CHUNKS.
      // The Module Federation runtime injects a `<script>` for each dynamically
      // `import()`-ed chunk at runtime. `crossOriginLoading: 'anonymous'` makes the
      // runtime fetch those chunk scripts in CORS (anonymous) mode and emit a
      // `crossorigin="anonymous"` attribute on the injected tag — which is REQUIRED
      // for the browser to enforce the per-chunk `integrity` attribute the
      // SubresourceIntegrityPlugin (below) wires into the runtime. The CDN already
      // answers CORS (Managed-CORS-with-preflight) and the local origin sets
      // ACAO:*, so the anonymous request succeeds. The boot-time gate secures the
      // remoteEntry <script> (host-injected, integrity from the registry); this
      // secures the chunks the remote loads itself AFTER it is mounted.
      crossOriginLoading: 'anonymous',
      clean: true,
    },

    optimization: {
      // Disable automatic vendor/commons chunk extraction so a plugin's eager entry
      // loads as a SINGLE file at boot — no separate `<id>.chunk.vendors-*.js` pulled
      // alongside the exposed `./public` entry (that extra boot chunk was part of the
      // eager-at-boot regression measured by harness/measure_lazy.js). Explicit
      // dynamic `import()` split points (doc views, embeddables, app render) are
      // UNAFFECTED — they remain their own navigation-loaded chunks. This mirrors the
      // optimizer (packages/osd-optimizer/src/worker/webpack.config.ts), which sets no
      // splitChunks and folds a plugin's synchronous deps into its single
      // `<id>.plugin.js` eager entry.
      splitChunks: false,
      // Stable, human-readable chunk ids in BOTH development and production builds so
      // the exposed-entry chunk is reliably identifiable by the `chunkFilename`
      // function above (rspack's default ids are numeric under `--dist`).
      chunkIds: 'named',
    },

    // Reuse OSD's existing shared-deps externals for the specifiers that are NOT
    // handled by Module Federation `shared` below (sub-path/JSON imports such as
    // `react-dom/server`, `@elastic/eui/lib/services`, `*.json`, the
    // `@osd/ui-shared-deps/theme` virtual, and the deep `monaco-editor` path).
    // These continue to reference the `__osdSharedDeps__` globals. The top-level
    // package roots (react, react-dom, @elastic/eui, ...) are removed here and
    // declared as MF singletons instead — see getMfeExternals/getMfeSharedConfig.
    externals: [getMfeExternals()],

    plugins: [
      new rspack.experiments.VirtualModulesPlugin(crossPluginVirtualFiles),
      // Subresource Integrity for LAZY CHUNKS. rspack 1.6.4 ships this
      // natively (`rspack.experiments.SubresourceIntegrityPlugin`), so
      // per-chunk SRI needs NO optimizer/core change and NO
      // webpack-subresource-integrity dependency. It computes a `sha384-…`
      // digest for every emitted chunk (over the UNCOMPRESSED bytes — the
      // SAME representation the browser verifies the DECODED response
      // against, and the same algorithm the registry generator uses for the
      // remoteEntry) and injects those hashes into the Module Federation
      // runtime, which then sets `integrity` (+ the `crossorigin` from
      // `output.crossOriginLoading` above) on each chunk <script> it loads
      // on demand. A tampered/MITM'd chunk served at the pinned
      // content-addressed path is then REJECTED by the browser at the
      // dynamic `import()` site instead of executed — defense-in-depth
      // behind the boot-time remoteEntry gate. A chunk failure is a RUNTIME
      // event inside an already-mounted plugin; the bootstrap's
      // chunk-error surface
      // (bootstrap/chunk_error_surface.ts) turns the resulting rejection into a
      // visible error + telemetry rather than a white screen / silent hang.
      //
      // `enabled: 'auto'` activates SRI only for non-development (i.e. `--dist`)
      // builds — exactly the artifacts that get published to the CDN and that the
      // threat model (a compromised CDN serving altered bytes at a pinned path)
      // actually protects. Dev builds are served locally and are not that threat
      // surface, and skipping SRI there avoids any interaction with incremental/
      // source-map dev output. `hashFuncNames: ['sha384']` matches the registry's
      // Story-1 algorithm so the integrity story is uniform across remoteEntry and
      // chunks.
      new rspack.experiments.SubresourceIntegrityPlugin({
        hashFuncNames: ['sha384'],
        enabled: 'auto',
      }),
      new NodePolyfillPlugin({ additionalAliases: ['process'] }),
      new rspack.DefinePlugin({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'process.env.IS_OPENSEARCH_DASHBOARDS_DISTRIBUTABLE': JSON.stringify(
          dist ? 'true' : 'false'
        ),
      }),
      new rspack.container.ModuleFederationPlugin({
        // Namespace the container's GLOBAL variable so a plugin id can never
        // collide with a browser global. The default Module Federation library is
        // `var <name>`, i.e. the container is assigned to `window[<name>]`. With a
        // bare `name: plugin.id`, the plugin whose id is `console` overwrites
        // `window.console` (so `console.log` becomes the container and core boot
        // throws "console.log is not a function"). Other ids could clash similarly
        // (e.g. `status`, `length`). Prefixing every container name with `osdMfe_`
        // keeps the globals unique and collision-free. The registry `scope`
        // (registry/generate.ts) mirrors this prefix so the browser MFE bootstrap
        // reads the matching `window[scope]`.
        name: `osdMfe_${plugin.id}`,
        filename: 'remoteEntry.js',
        // Expose the plugin's public entry as `./public`, matching the
        // registry `module: "./public"` convention (see
        // `packages/osd-mfe/README.md`). The object form pins the exposed
        // module's chunk NAME so `output.chunkFilename` can reliably emit it
        // as the eager plugin entry (`<id>.plugin.js`) rather than a
        // `.chunk.` (the lazy-loading fix) — see EXPOSED_ENTRY_CHUNK_NAME.
        exposes: {
          './public': {
            import: publicEntry,
            name: EXPOSED_ENTRY_CHUNK_NAME,
          },
        },
        // Declare the OSD shared dependencies (react, react-dom, @osd/i18n,
        // rxjs, lodash, @elastic/eui, moment, styled-components, ...) as Module
        // Federation singletons, derived programmatically from
        // `@osd/ui-shared-deps`. Each is consume-only (`import: false`), so the
        // remote uses the host-provided instance and never bundles its own copy
        // of React/EUI/etc. See packages/osd-mfe/src/mfe_shared_deps.ts.
        shared: getMfeSharedConfig(repoRoot),
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
        // The SWC / `.cjs` / selective-node_modules transpile rules are the set the MFE
        // build mirrored from the optimizer (packages/osd-optimizer/src/worker/
        // webpack.config.ts). They now live in a single canonical helper in `@osd/utils`
        // (alongside `getSwcLoaderConfig`, which both builds already import) so the loader
        // settings can't drift between the two builds. See getSharedLoaderRules.
        ...getSharedLoaderRules({
          targets,
          // The MFE build adds two `.cjs` excludes the optimizer does not need:
          extraCjsExcludes: [
            // Do NOT re-transpile the Module Federation runtime that the
            // ModuleFederationPlugin injects (its files are named `*.cjs.cjs`, so
            // they match the `.cjs` rule). Running them through swc with
            // `externalHelpers` rewrites them to import `@swc/helpers` in a way
            // that leaves an MF-runtime module factory undefined, crashing the
            // container's startup (`Cannot read properties of undefined (reading
            // 'call')`) before `init()`/`get()` can run. The optimizer's identical
            // `.cjs` rule never hits this because it never builds MF containers.
            // The MF runtime already targets the browser, so it needs no transpile.
            /node_modules[\\/]@module-federation[\\/]/,
            // swc's own helper runtime must not be transpiled by swc.
            /node_modules[\\/]@swc[\\/]helpers[\\/]/,
          ],
        }),
      ],
    },

    resolve: resolveOptions,

    performance: {
      // Size hints are tuned for final bundles, not these compilations.
      hints: false,
    },
  };
}
