/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Build the browser MFE bootstrap bundle (Phase 3, Story 5).
 *
 * `packages/osd-mfe/src/bootstrap/browser_entry.ts` is a side-effecting browser
 * entry that assigns `window.__osdBootstrapMfe__ = bootstrapMfe`. The server's
 * `--mfe` render branch (src/legacy/ui/ui_render/bootstrap/bootstrap_mfe.js.hbs)
 * loads this bundle from `opensearchDashboards.mfe.bootstrapUrl` and then calls
 * `window.__osdBootstrapMfe__({ registryUrl, sharedDepsUrl })` — which seeds the
 * MF share scope, fetches the registry at serve time, loads every plugin remote
 * into the `__osdBundles__` shim, and finally drives core boot (docs §6).
 *
 * The bootstrap is PLAIN host code (NOT a Module Federation container): it drives
 * `container.init()/get()` manually, so it has no MF/runtime config — it is just
 * a self-contained TypeScript graph (browser_entry -> bootstrap_mfe -> share_scope,
 * load_remote, osd_bundles, types, ../registry/schema) with no npm runtime deps.
 *
 * We bundle it with Rspack + `builtin:swc-loader` (mirroring how the remotes are
 * built in packages/osd-mfe/src/mfe_rspack_config.ts), targeting the repo's
 * browserslist so output matches the rest of OSD. This is a HARNESS artifact: it
 * reads OSD sources but writes only to `<OSD_DIR>/target/mfe-bootstrap/` (a build
 * output dir) and never modifies OSD source.
 *
 * Usage:
 *   source harness/env.sh && node harness/build_mfe_bootstrap.js
 * Output:
 *   <OSD_DIR>/target/mfe-bootstrap/osd_bootstrap_mfe.js   (served at :8080/bootstrap/)
 */
'use strict';

const Path = require('path');

const WORKSPACE_DIR = process.env.WORKSPACE_DIR || Path.resolve(__dirname, '../../..');
const OSD_DIR =
  process.env.OSD_DIR ||
  WORKSPACE_DIR;

// Resolve OSD's own copies of the build tooling (not present in the harness's
// NODE_PATH, which only points at the shared Playwright install).
// eslint-disable-next-line import/no-dynamic-require
const { rspack } = require(Path.join(OSD_DIR, 'node_modules/@rspack/core'));
// eslint-disable-next-line import/no-dynamic-require
const browserslist = require(Path.join(OSD_DIR, 'node_modules/browserslist'));
// The @osd/ui-shared-deps externals map (specifier -> `__osdSharedDeps__.X`
// global). The bootstrap is PLAIN host code (not a Module Federation container),
// so any npm runtime dep it pulls in — e.g. react / react-dom / @elastic/eui used
// by the dev Inspector panel (Phase 5, Story 3) — must be externalized to the
// host's shared-deps singletons here rather than bundled (which would duplicate
// React and bloat the bundle). These externals are accessed ONLY by ./inspector,
// which bootstrap_mfe.ts lazily import()s at mount time — AFTER the bootstrap has
// loaded the shared-deps script — so the __osdSharedDeps__ globals exist before any
// of that code runs (a static import would resolve them too early and throw).
// eslint-disable-next-line import/no-dynamic-require
const UiSharedDeps = require(Path.join(OSD_DIR, 'packages/osd-ui-shared-deps'));

const ENTRY = Path.join(OSD_DIR, 'packages/osd-mfe/src/bootstrap/browser_entry.ts');
const OUT_DIR = Path.join(OSD_DIR, 'target/mfe-bootstrap');
const OUT_FILE = 'osd_bootstrap_mfe.js';

// Same browser targets the optimizer / MFE remote builds transpile for, read from
// the repo's browserslist config so the bootstrap's SWC output matches OSD.
const targets = browserslist.loadConfig({ path: OSD_DIR });

/** @type {import('@rspack/core').Configuration} */
const config = {
  mode: 'production',
  target: 'web',
  context: OSD_DIR,
  entry: ENTRY,
  devtool: false,

  output: {
    path: OUT_DIR,
    filename: OUT_FILE,
    // A classic self-executing script: loading it via <script> runs browser_entry's
    // side effect (assigning window.__osdBootstrapMfe__). No library export needed.
    iife: true,
    clean: true,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  // Externalize the shared-deps specifiers (react, react-dom, @elastic/eui, …)
  // to their `__osdSharedDeps__` globals (default `var` externalsType for a web
  // target). Only the dev Inspector imports these; the rest of the bootstrap has
  // no npm runtime deps, so this is a no-op for existing modules and keeps the
  // bundle a single small self-contained script.
  externals: [UiSharedDeps.externals],

  module: {
    parser: {
      javascript: {
        // Force ALL dynamic import() to "eager" mode: the imported module is kept
        // in THIS single bundle (no separate async chunk to serve) but its factory
        // is only evaluated when import() is called at runtime. bootstrap_mfe.ts
        // lazily import()s ./inspector at mount time so its react/eui externals
        // (window.__osdSharedDeps__) resolve only AFTER shared-deps is loaded — a
        // static eval would reference __osdSharedDeps__ before it exists and throw.
        dynamicImportMode: 'eager',
      },
    },
    rules: [
      {
        // Transpile the bootstrap's TypeScript graph with the same loader the
        // remote builds use (packages/osd-mfe/src/mfe_rspack_config.ts).
        test: /\.tsx?$/,
        exclude: /[\\/]node_modules[\\/]/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
            },
            env: { targets },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },

  performance: {
    // Size hints are tuned for app bundles, not this small bootstrap.
    hints: false,
  },

  // Quiet, single-pass build.
  stats: 'errors-warnings',
};

rspack(config, (err, stats) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error('FATAL rspack error:', err.stack || err);
    process.exit(1);
  }
  const info = stats.toJson({ errors: true, warnings: true, assets: true });
  if (stats.hasErrors()) {
    // eslint-disable-next-line no-console
    console.error('BOOTSTRAP BUILD FAILED');
    info.errors.forEach((e) => console.error('  ' + (e.message || e)));
    process.exit(1);
  }
  if (info.warnings && info.warnings.length) {
    // eslint-disable-next-line no-console
    info.warnings.forEach((w) => console.warn('  WARN ' + (w.message || w)));
  }
  const outPath = Path.join(OUT_DIR, OUT_FILE);
  const asset = (info.assets || []).find((a) => a.name === OUT_FILE);
  // eslint-disable-next-line no-console
  console.log(
    `BOOTSTRAP BUILD OK -> ${outPath}` + (asset ? `  (${asset.size} bytes)` : '')
  );
  process.exit(0);
});
