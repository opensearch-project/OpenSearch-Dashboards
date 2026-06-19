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

// Register OSD's node environment (babel auto-transpilation, polyfills, etc.).
// This is what allows us to require the TypeScript sources under
// `packages/osd-mfe/src` directly, the same way other OSD scripts require
// TypeScript CLIs (e.g. `scripts/build.js` -> `../src/dev/build/cli`).
require('../src/setup_node_env');

// NOTE: this file runs as a plain bootstrap entry point (it is not transpiled),
// so it uses `var` and avoids destructuring to satisfy the `scripts/` lint rules,
// matching sibling scripts such as `build_opensearch_dashboards_platform_plugins.js`.
var Path = require('path');
var runCli = require('../packages/osd-mfe/src').runCli;

// This script lives in `<repoRoot>/scripts`, so the repo root is one level up.
// `OptimizerConfig` requires an absolute repo root.
var repoRoot = Path.resolve(__dirname, '..');

// Force exit. Without this, Node hangs because `setup_node_env` registers the
// `@osd/optimizer` LMDB transpilation cache (and the build path also pulls in
// `@rspack/core`'s native binding for `--plugin`/`--all`), whose memory-mapped
// files / native handles keep the event loop alive indefinitely (same handle
// family as the documented OSD jest exit hang — see docs/08-ROADMAP.md
// "OSD-wide jest exit hang"). The build work is complete by the time
// `process.exitCode` is set (sync path, or after the Promise settles for the
// async path), so explicit exit is correct and safe.
//
// NOTE: do NOT wrap in `setImmediate` — when the libuv event loop is pinned by
// native handles, the immediate queue may not run. `process.exit()` is
// synchronous in JS-land and forces termination after Node flushes pending
// stdio writes (which is what we want here: the CLI has already printed its
// output to stdout/stderr by this point).
function forceExit() {
  process.exit(process.exitCode || 0);
}

try {
  var result = runCli(process.argv.slice(2), repoRoot);
  // `--plugin` runs an async Rspack build and returns a Promise; `--list`/etc.
  // return a number synchronously. Handle both without using async/await so the
  // file stays a plain (non-transpiled) bootstrap script.
  if (result && typeof result.then === 'function') {
    result.then(
      function (code) {
        process.exitCode = code;
        forceExit();
      },
      function (error) {
        // eslint-disable-next-line no-console
        console.error(error && error.stack ? error.stack : error);
        process.exitCode = 1;
        forceExit();
      }
    );
  } else {
    process.exitCode = result;
    forceExit();
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
  forceExit();
}
