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

import { createReadStream, createWriteStream, unlinkSync, renameSync } from 'fs';
import { createInterface } from 'readline';
import { spawn, spawnStreaming } from './child_process';
import { detectPackageManager, PackageManager } from './package_manager';
import { Project } from './project';

function pmSpawnArgs(pm: PackageManager, args: string[]): [string, string[]] {
  const { file, prefixArgs } = pm.command();
  return [file, [...prefixArgs, ...args]];
}

/**
 * Install all dependencies in the given directory, using the package manager
 * that owns the directory's lockfile. `extraArgs` are yarn-style flags.
 */
export async function installInDir(directory: string, extraArgs: string[] = []) {
  const pm = detectPackageManager(directory);
  await spawn(...pmSpawnArgs(pm, pm.installArgs({ extraArgs })), { cwd: directory });
}

/**
 * Add a dependency at an exact version in the given directory.
 */
export async function addInDir(directory: string, spec: string, dev = false) {
  const pm = detectPackageManager(directory);
  await spawn(...pmSpawnArgs(pm, pm.addArgs(spec, dev)), { cwd: directory });
}

/**
 * Re-sync the lockfile after a manifest edit, when the package manager needs it.
 * Returns the package manager so callers can decide on lockfile patching.
 */
export async function syncLockfileInDir(directory: string) {
  const pm = detectPackageManager(directory);
  const args = pm.syncLockfileArgs();
  if (args) await spawn(...pmSpawnArgs(pm, args), { cwd: directory });
  return pm;
}

/**
 * Patch a file by replacing a given string
 */
export function patchFile(
  filePath: string,
  searchValue: string,
  replacement: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const patchWriter = createWriteStream(`${filePath}.patched`, {
      flags: 'w',
    });
    const fileReader = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    });
    for await (const line of fileReader) {
      if (line.includes(searchValue)) {
        patchWriter.write(line.replace(searchValue, replacement) + '\n', 'utf8');
      } else {
        patchWriter.write(line + '\n', 'utf8');
      }
    }

    patchWriter.on('finish', () => resolve());
    patchWriter.on('error', reject);

    fileReader.close();
    patchWriter.end();
    unlinkSync(filePath);
    renameSync(`${filePath}.patched`, filePath);
  });
}

/**
 * Run script in the given directory
 */
export async function runScriptInPackage(script: string, args: string[], pkg: Project) {
  const pm = detectPackageManager(pkg.path);
  await spawn(...pmSpawnArgs(pm, pm.runArgs(script, args)), { cwd: pkg.path });
}

/**
 * Run script in the given directory
 */
export function runScriptInPackageStreaming({
  script,
  args,
  pkg,
  debug,
}: {
  script: string;
  args: string[];
  pkg: Project;
  debug?: boolean;
}) {
  const pm = detectPackageManager(pkg.path);
  const [file, spawnArgs] = pmSpawnArgs(pm, pm.runArgs(script, args));

  return spawnStreaming(file, spawnArgs, { cwd: pkg.path }, { prefix: pkg.name, debug });
}
