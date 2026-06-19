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
// `packages/osd-mfe/src` directly, the same way `scripts/update_registry.js` and
// `scripts/build_mfe.js` do.
require('../src/setup_node_env');

// NOTE: this file runs as a plain bootstrap entry point (it is not transpiled),
// so it uses `var` and avoids destructuring to satisfy the `scripts/` lint rules,
// matching sibling scripts such as `update_registry.js`.
var Path = require('path');
var runDeployCli = require('../packages/osd-mfe/src').runDeployCli;

// This script lives in `<repoRoot>/scripts`, so the repo root is one level up.
var repoRoot = Path.resolve(__dirname, '..');

try {
  // `runDeployCli` is synchronous: it resolves the PROVISIONED CDN location from
  // the environment (source harness/env.sh), refreshes creds, uploads artifacts
  // to immutable versioned keys, and writes the deploy manifest. PUBLISH-ONLY:
  // it never creates or mutates infra. `--dry-run` makes zero AWS calls.
  process.exitCode = runDeployCli(process.argv.slice(2), repoRoot);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}

// Force exit. Without this, Node hangs because `setup_node_env` registers the
// `@osd/optimizer` LMDB transpilation cache, whose memory-mapped files keep
// the event loop alive indefinitely (same handle leak as the documented OSD
// jest exit hang — see docs/08-ROADMAP.md "OSD-wide jest exit hang"). The CLI
// work (S3 uploads, manifest write) is complete by here, so explicit exit is
// correct and safe.
process.exit(process.exitCode || 0);
