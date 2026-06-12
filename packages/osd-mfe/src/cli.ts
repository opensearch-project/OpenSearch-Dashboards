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
import { buildMfeForPlugin, buildAllMfe } from './build_mfe_for_plugin';

/**
 * The pilot UI plugin (mirrors `pilot_plugin` in the loop's prd.json). It is the
 * Phase 1 vertical-slice deliverable and MUST always build cleanly, so a failure
 * to build it during `--all` is treated as a hard error (non-zero exit).
 */
const PILOT_PLUGIN_ID = 'inspector';

const USAGE = `Usage: node scripts/build_mfe <command>

Build OpenSearch Dashboards UI plugins as Module Federation remotes (parallel,
additive build that does not affect the existing @osd/optimizer build).

Commands:
  --list            List the UI plugins discovered via @osd/optimizer (id + directory)
  --plugin <id>     Build a single UI plugin as an MF remote into target/mfe/<id>/
  --all             Build every discovered UI plugin into target/mfe/<id>/ (per-plugin
                    failures are reported in a summary but do not abort the run)
  --dist            Produce a PRODUCTION build (minified, no source maps): mode
                    production, SWC/LightningCSS minify, devtool:false. Without it the
                    build is development (unminified + source maps). Combine with
                    --plugin/--all (e.g. "--all --dist").
  --help, -h        Show this message`;

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
 * @param dist produce a production (minified, no source maps) build
 * @returns the process exit code (0 = success, non-zero = build failure)
 */
async function buildPlugin(pluginId: string, repoRoot: string, dist: boolean): Promise<number> {
  try {
    const result = await buildMfeForPlugin(pluginId, repoRoot, dist);
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
 * Reduce a (possibly multi-line) error message to its first line for compact
 * progress/summary output.
 */
function firstLine(text: string | undefined): string {
  if (!text) {
    return '';
  }
  const newlineIndex = text.indexOf('\n');
  return newlineIndex === -1 ? text : text.slice(0, newlineIndex);
}

/**
 * Build every discovered UI plugin as a Module Federation remote, reporting live
 * progress and a final success/fail summary.
 *
 * Per-plugin failures are collected (not thrown), so the run always completes.
 * The exit code is non-zero only when the build is unusable: the pilot plugin
 * failed (it must always build cleanly) or nothing built at all.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param dist produce production (minified, no source maps) builds
 * @returns the process exit code (0 = usable build, non-zero = pilot/total failure)
 */
async function buildAll(repoRoot: string, dist: boolean): Promise<number> {
  // eslint-disable-next-line no-console
  console.log('Building all discovered UI plugins as Module Federation remotes...\n');

  const { succeeded, failed } = await buildAllMfe(repoRoot, {
    dist,
    onPluginResult: (outcome) => {
      if (outcome.ok) {
        // eslint-disable-next-line no-console
        console.log(`  PASS  ${outcome.pluginId}`);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`  FAIL  ${outcome.pluginId}  ${firstLine(outcome.error)}`);
      }
    },
  });

  const total = succeeded.length + failed.length;
  const percent = total === 0 ? 0 : Math.round((succeeded.length / total) * 100);

  // eslint-disable-next-line no-console
  console.log(
    `\nMFE build summary: ${succeeded.length}/${total} succeeded (${percent}%), ${failed.length} failed.`
  );

  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.log('Failed plugins:');
    for (const failure of failed) {
      // eslint-disable-next-line no-console
      console.log(`  - ${failure.pluginId}: ${firstLine(failure.error)}`);
    }
  }

  const pilotFailed = failed.some((failure) => failure.pluginId === PILOT_PLUGIN_ID);
  if (pilotFailed) {
    // eslint-disable-next-line no-console
    console.error(
      `\nPilot plugin "${PILOT_PLUGIN_ID}" failed to build; it must always build cleanly.`
    );
    return 1;
  }

  if (succeeded.length === 0) {
    // eslint-disable-next-line no-console
    console.error('\nNo UI plugins built successfully.');
    return 1;
  }

  return 0;
}

/**
 * Entry point for the `build_mfe` CLI. Implements `--list` (Story 1),
 * `--plugin <id>` (Story 2), and `--all` (Story 5).
 *
 * The `--plugin` and `--all` paths run asynchronous Rspack builds, so this
 * returns a `Promise<number>` for those commands and a synchronous `number`
 * otherwise.
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

  // Production build toggle: applies to both `--all` and `--plugin`. Absent =>
  // development build (unminified + source maps), matching the prior default.
  const dist = argv.includes('--dist');

  if (argv.includes('--all')) {
    return buildAll(repoRoot, dist);
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
    return buildPlugin(pluginId, repoRoot, dist);
  }

  // eslint-disable-next-line no-console
  console.error(`Unknown or missing command: ${argv.join(' ') || '(none)'}\n`);
  // eslint-disable-next-line no-console
  console.error(USAGE);
  return 1;
}
