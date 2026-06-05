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

import Path from 'path';

import { discoverUiPlugins } from './discover_plugins';

const USAGE = `Usage: node scripts/build_mfe <command>

Build OpenSearch Dashboards UI plugins as Module Federation remotes (parallel,
additive build that does not affect the existing @osd/optimizer build).

Commands:
  --list            List the UI plugins discovered via @osd/optimizer (id + directory)
  --help, -h        Show this message

(Additional commands such as --plugin <id> and --all are added in later stories.)`;

/**
 * Print the discovered UI plugins as "<id>  <repo-relative directory>".
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 */
function listPlugins(repoRoot: string): void {
  const plugins = discoverUiPlugins(repoRoot);

  // eslint-disable-next-line no-console
  console.log(`Discovered ${plugins.length} UI plugin(s):`);

  const idWidth = plugins.reduce((max, plugin) => Math.max(max, plugin.id.length), 0);
  for (const plugin of plugins) {
    const relDir = Path.relative(repoRoot, plugin.directory) || '.';
    // eslint-disable-next-line no-console
    console.log(`  ${plugin.id.padEnd(idWidth)}  ${relDir}`);
  }
}

/**
 * Entry point for the `build_mfe` CLI. Phase 1 / Story 1 implements only the
 * `--list` subcommand; `--plugin <id>` and `--all` arrive in later stories.
 *
 * @param argv CLI arguments (typically `process.argv.slice(2)`)
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @returns the process exit code (0 = success, non-zero = error)
 */
export function runCli(argv: string[], repoRoot: string): number {
  if (argv.includes('--help') || argv.includes('-h')) {
    // eslint-disable-next-line no-console
    console.log(USAGE);
    return 0;
  }

  if (argv.includes('--list')) {
    listPlugins(repoRoot);
    return 0;
  }

  // eslint-disable-next-line no-console
  console.error(`Unknown or missing command: ${argv.join(' ') || '(none)'}\n`);
  // eslint-disable-next-line no-console
  console.error(USAGE);
  return 1;
}
