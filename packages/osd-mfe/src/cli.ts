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
import { buildMfeForPlugin } from './build_mfe_for_plugin';

const USAGE = `Usage: node scripts/build_mfe <command>

Build OpenSearch Dashboards UI plugins as Module Federation remotes (parallel,
additive build that does not affect the existing @osd/optimizer build).

Commands:
  --list            List the UI plugins discovered via @osd/optimizer (id + directory)
  --plugin <id>     Build a single UI plugin as an MF remote into target/mfe/<id>/
  --help, -h        Show this message

(The --all command to build every discovered plugin is added in a later story.)`;

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
 * Build a single UI plugin as a Module Federation remote and report the result.
 *
 * @param pluginId the id of the plugin to build (e.g. "inspector")
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @returns the process exit code (0 = success, non-zero = build failure)
 */
async function buildPlugin(pluginId: string, repoRoot: string): Promise<number> {
  try {
    const result = await buildMfeForPlugin(pluginId, repoRoot);
    // eslint-disable-next-line no-console
    console.log(
      `Built Module Federation remote "${result.pluginId}" -> ${Path.relative(
        repoRoot,
        result.remoteEntryPath
      )}`
    );
    return 0;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to build Module Federation remote for "${pluginId}":`);
    // eslint-disable-next-line no-console
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

/**
 * Entry point for the `build_mfe` CLI. Implements `--list` (Story 1) and
 * `--plugin <id>` (Story 2); `--all` arrives in a later story.
 *
 * The `--plugin` path runs an asynchronous Rspack build, so this returns a
 * `Promise<number>` for that command and a synchronous `number` otherwise.
 *
 * @param argv CLI arguments (typically `process.argv.slice(2)`)
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @returns the process exit code (0 = success, non-zero = error)
 */
export function runCli(argv: string[], repoRoot: string): number | Promise<number> {
  if (argv.includes('--help') || argv.includes('-h')) {
    // eslint-disable-next-line no-console
    console.log(USAGE);
    return 0;
  }

  if (argv.includes('--list')) {
    listPlugins(repoRoot);
    return 0;
  }

  const pluginFlagIndex = argv.indexOf('--plugin');
  if (pluginFlagIndex !== -1) {
    const pluginId = argv[pluginFlagIndex + 1];
    if (!pluginId || pluginId.startsWith('-')) {
      // eslint-disable-next-line no-console
      console.error('--plugin requires a plugin id (e.g. "--plugin inspector")\n');
      // eslint-disable-next-line no-console
      console.error(USAGE);
      return 1;
    }
    return buildPlugin(pluginId, repoRoot);
  }

  // eslint-disable-next-line no-console
  console.error(`Unknown or missing command: ${argv.join(' ') || '(none)'}\n`);
  // eslint-disable-next-line no-console
  console.error(USAGE);
  return 1;
}
