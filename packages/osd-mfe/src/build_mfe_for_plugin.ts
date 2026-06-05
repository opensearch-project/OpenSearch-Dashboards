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

import { discoverUiPlugins } from './discover_plugins';
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
  const plugin = discoverUiPlugins(repoRoot).find((candidate) => candidate.id === pluginId);
  if (!plugin) {
    throw new Error(
      `Unknown UI plugin "${pluginId}". ` +
        `Run "node scripts/build_mfe --list" to see available plugins.`
    );
  }

  const publicEntry = resolvePublicEntry(plugin.directory);
  const outputDir = Path.resolve(repoRoot, 'target/mfe', plugin.id);

  // Own the sass-embedded compiler lifecycle so it can be disposed once the
  // build finishes — otherwise the embedded compiler keeps the process alive
  // and the CLI never exits.
  const sassCompiler = await sass.initAsyncCompiler();
  const sassImplementation = {
    ...sass,
    compileStringAsync: (data: string, sassOptions: sass.StringOptions<'async'>) =>
      sassCompiler.compileStringAsync(data, sassOptions),
  };

  try {
    const config = getMfeRspackConfig({ plugin, repoRoot, publicEntry, sassImplementation });

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
  } finally {
    await sassCompiler.dispose();
  }

  return {
    pluginId: plugin.id,
    outputDir,
    remoteEntryPath: Path.resolve(outputDir, 'remoteEntry.js'),
  };
}
