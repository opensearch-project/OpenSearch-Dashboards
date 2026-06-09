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
import Fs from 'fs';
import { rspack } from '@rspack/core';
import * as sass from 'sass-embedded';

import { discoverUiPlugins, DiscoveredUiPlugin } from './discover_plugins';
import { getMfeRspackConfig } from './mfe_rspack_config';

/** Candidate public entry filenames, in resolution order. */
const PUBLIC_ENTRY_CANDIDATES = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];

/** The result of building a single plugin's Module Federation remote. */
export interface MfeBuildResult {
  /** The plugin id that was built. */
  pluginId: string;
  /** Absolute path to the output directory (`<repoRoot>/target/mfe/<id>`). */
  outputDir: string;
  /** Absolute path to the produced `remoteEntry.js`. */
  remoteEntryPath: string;
}

/** A single plugin build failure collected by {@link buildAllMfe}. */
export interface MfeBuildFailure {
  /** The plugin id that failed to build. */
  pluginId: string;
  /** The failure reason (Rspack stats/error message). */
  error: string;
}

/** The aggregate result of building every discovered UI plugin via {@link buildAllMfe}. */
export interface MfeBuildAllResult {
  /** Plugins whose Module Federation remote built successfully. */
  succeeded: MfeBuildResult[];
  /** Plugins that failed to build, collected (not thrown) so the run completes. */
  failed: MfeBuildFailure[];
}

/** Options controlling {@link buildAllMfe}. */
export interface BuildAllMfeOptions {
  /**
   * Invoked after each plugin build attempt so callers (e.g. the CLI) can
   * report live progress. Keeping output in the caller avoids this module
   * writing to the console directly.
   */
  onPluginResult?: (outcome: { pluginId: string; ok: boolean; error?: string }) => void;
}

/**
 * Resolve the public entry module (`public/index.{ts,tsx,js,jsx}`) for a plugin.
 *
 * @param pluginDirectory absolute path to the plugin's source directory
 * @throws if none of the expected entry files exist
 */
function resolvePublicEntry(pluginDirectory: string): string {
  for (const candidate of PUBLIC_ENTRY_CANDIDATES) {
    const entry = Path.resolve(pluginDirectory, 'public', candidate);
    if (Fs.existsSync(entry)) {
      return entry;
    }
  }

  throw new Error(
    `No public entry found for plugin at "${pluginDirectory}" ` +
      `(looked for public/{${PUBLIC_ENTRY_CANDIDATES.join(', ')}})`
  );
}

/**
 * Build a disposable `sass-loader` implementation backed by an already
 * initialized `sass-embedded` AsyncCompiler. The caller owns the compiler's
 * lifecycle (and must dispose it) so the process can exit cleanly — an
 * undisposed embedded compiler keeps Node alive.
 *
 * @param sassCompiler an initialized sass-embedded AsyncCompiler
 */
function createSassImplementation(sassCompiler: sass.AsyncCompiler) {
  return {
    ...sass,
    compileStringAsync: (data: string, sassOptions: sass.StringOptions<'async'>) =>
      sassCompiler.compileStringAsync(data, sassOptions),
  };
}

/**
 * Compile a single discovered plugin's public entry into a Module Federation
 * remote using the supplied (caller-owned) Sass implementation.
 *
 * This is the shared core used by both {@link buildMfeForPlugin} (one compiler
 * per call) and {@link buildAllMfe} (a fresh compiler per plugin so one bad
 * plugin can never poison another's build). It is additive: it only writes to
 * `<repoRoot>/target/mfe/<id>/` and never to the plugin's optimizer output.
 *
 * @param plugin the discovered UI plugin to build
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param sassImplementation a `sass-loader` implementation (see {@link createSassImplementation})
 * @returns details of the produced remote
 */
async function compilePluginRemote(
  plugin: DiscoveredUiPlugin,
  repoRoot: string,
  sassImplementation: unknown,
  allPlugins: DiscoveredUiPlugin[]
): Promise<MfeBuildResult> {
  const publicEntry = resolvePublicEntry(plugin.directory);
  const outputDir = Path.resolve(repoRoot, 'target/mfe', plugin.id);
  const config = getMfeRspackConfig({
    plugin,
    repoRoot,
    publicEntry,
    sassImplementation,
    allPlugins,
  });

  await new Promise<void>((resolve, reject) => {
    const compiler = rspack(config);
    compiler.run((runError, stats) => {
      // Always close the compiler to release Rspack's worker threads before
      // settling the promise.
      compiler.close((closeError) => {
        if (runError) {
          reject(runError);
          return;
        }
        if (closeError) {
          reject(closeError);
          return;
        }
        if (!stats) {
          reject(new Error('Rspack produced no build stats'));
          return;
        }
        if (stats.hasErrors()) {
          reject(new Error(stats.toString({ all: false, errors: true })));
          return;
        }
        if (stats.hasWarnings()) {
          // eslint-disable-next-line no-console
          console.warn(stats.toString({ all: false, warnings: true }));
        }
        resolve();
      });
    });
  });

  return {
    pluginId: plugin.id,
    outputDir,
    remoteEntryPath: Path.resolve(outputDir, 'remoteEntry.js'),
  };
}

/**
 * Build a single OSD UI plugin's public entry into a Module Federation remote
 * at `<repoRoot>/target/mfe/<pluginId>/remoteEntry.js`.
 *
 * This is additive: it never writes to the plugin's existing `target/public`
 * optimizer output, nor does it modify any optimizer files.
 *
 * @param pluginId the id of the UI plugin to build (e.g. "inspector")
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @returns details of the produced remote
 */
export async function buildMfeForPlugin(
  pluginId: string,
  repoRoot: string
): Promise<MfeBuildResult> {
  const allPlugins = discoverUiPlugins(repoRoot);
  const plugin = allPlugins.find((candidate) => candidate.id === pluginId);
  if (!plugin) {
    throw new Error(
      `Unknown UI plugin "${pluginId}". ` +
        `Run "node scripts/build_mfe --list" to see available plugins.`
    );
  }

  // Own the sass-embedded compiler lifecycle so it can be disposed once the
  // build finishes — otherwise the embedded compiler keeps the process alive
  // and the CLI never exits.
  const sassCompiler = await sass.initAsyncCompiler();
  try {
    return await compilePluginRemote(
      plugin,
      repoRoot,
      createSassImplementation(sassCompiler),
      allPlugins
    );
  } finally {
    await sassCompiler.dispose();
  }
}

/**
 * Build every discovered UI plugin as a Module Federation remote into
 * `<repoRoot>/target/mfe/<id>/`.
 *
 * Individual plugin failures are collected rather than thrown, so one plugin
 * that cannot build (missing entry, unresolved import, etc.) never aborts the
 * whole run. Each plugin gets its OWN sass-embedded compiler, disposed before
 * the next plugin starts: this fully isolates builds (a failure can't leave a
 * shared compiler in a bad state) and still lets the process exit cleanly.
 *
 * Like {@link buildMfeForPlugin}, this is purely additive and only writes under
 * `target/mfe/`.
 *
 * @param repoRoot absolute path to the OpenSearch Dashboards repo root
 * @param options optional progress callback
 * @returns the per-plugin successes and failures
 */
export async function buildAllMfe(
  repoRoot: string,
  options: BuildAllMfeOptions = {}
): Promise<MfeBuildAllResult> {
  const plugins = discoverUiPlugins(repoRoot);
  const succeeded: MfeBuildResult[] = [];
  const failed: MfeBuildFailure[] = [];

  for (const plugin of plugins) {
    const sassCompiler = await sass.initAsyncCompiler();
    try {
      const result = await compilePluginRemote(
        plugin,
        repoRoot,
        createSassImplementation(sassCompiler),
        plugins
      );
      succeeded.push(result);
      options.onPluginResult?.({ pluginId: plugin.id, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failed.push({ pluginId: plugin.id, error: message });
      options.onPluginResult?.({ pluginId: plugin.id, ok: false, error: message });
    } finally {
      // Dispose per plugin so a build failure can't corrupt a shared compiler
      // and so the embedded sass subprocess never keeps the process alive.
      await sassCompiler.dispose();
    }
  }

  return { succeeded, failed };
}
