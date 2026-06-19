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
// `packages/osd-mfe/src` directly, the same way `scripts/build_mfe.js` does.
require('../src/setup_node_env');

// NOTE: this file runs as a plain bootstrap entry point (it is not transpiled),
// so it uses `var` and avoids destructuring to satisfy the `scripts/` lint rules,
// matching sibling scripts such as `build_mfe.js`.
var Path = require('path');
var pkgIndex = require('../packages/osd-mfe/src');
var runUpdateCli = pkgIndex.runUpdateCli;
var runUpdateCliV2 = pkgIndex.runUpdateCliV2;
var isV2Mode = pkgIndex.isV2Mode;

// This script lives in `<repoRoot>/scripts`, so the repo root is one level up.
var repoRoot = Path.resolve(__dirname, '..');

try {
  var argv = process.argv.slice(2);

  // Phase 13 Story 4: dispatch v2 modes (--default-entry / --add-rollout /
  // --remove-rollout / --tenant-override / --remove-tenant-override / --rollback)
  // to the v2 CLI; everything else stays on the Phase-2 CLI (full regen,
  // --from-manifest, --plugin patch).
  if (isV2Mode(argv)) {
    // Resolve OSD core version from package.json so the default --check-deps
    // contractVersion is the running OSD major.minor.
    var osdVersion = require(Path.join(repoRoot, 'package.json')).version || '0.0.0';
    process.exitCode = runUpdateCliV2({
      argv: argv,
      env: process.env,
      out: console,
      now: function () {
        return new Date();
      },
      osdVersion: osdVersion,
    });
  } else {
    // `runUpdateCli` is fully synchronous (no async build): it validates and writes
    // ONLY the registry data file (path from --registry-path or MFE_REGISTRY_PATH).
    process.exitCode = runUpdateCli(argv, repoRoot);
  }
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
