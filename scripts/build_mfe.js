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

try {
  var result = runCli(process.argv.slice(2), repoRoot);
  // `--plugin` runs an async Rspack build and returns a Promise; `--list`/etc.
  // return a number synchronously. Handle both without using async/await so the
  // file stays a plain (non-transpiled) bootstrap script.
  if (result && typeof result.then === 'function') {
    result.then(
      function (code) {
        process.exitCode = code;
      },
      function (error) {
        // eslint-disable-next-line no-console
        console.error(error && error.stack ? error.stack : error);
        process.exitCode = 1;
      }
    );
  } else {
    process.exitCode = result;
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
