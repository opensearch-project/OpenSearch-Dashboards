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

// This script lives in `<repoRoot>/scripts`, so the repo root is one level up.
var repoRoot = Path.resolve(__dirname, '..');

try {
  var argv = process.argv.slice(2);
  // The unified `runUpdateCli` dispatches internally between v1-style writers
  // (full regen, --from-manifest, --plugin), layered authoring (--default-entry,
  // --add-rollout, --remove-rollout, --tenant-override, --remove-tenant-override,
  // --rollback), and global-asset writers (--update-core, --update-orchestrator,
  // --update-shared-deps-css, --update-theme). Each branch writes the unified
  // schemaVersion: 1 document; the v2-only branch's CLI now lives here too.
  // Fully synchronous: validates and writes ONLY the registry data file (path
  // from --registry-path or MFE_REGISTRY_PATH).
  process.exitCode = runUpdateCli(argv, repoRoot);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}

// Force exit. Without this, Node hangs because `setup_node_env` registers the
// `@osd/optimizer` LMDB transpilation cache, whose memory-mapped files keep
// the event loop alive indefinitely (same handle leak as the documented OSD
// jest exit hang — see docs/08-ROADMAP.md "OSD-wide jest exit hang"). The CLI
// work is already complete by here (file writes are synchronous), so an
// explicit exit is correct and safe.
process.exit(process.exitCode || 0);
