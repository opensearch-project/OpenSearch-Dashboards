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

import Fs from 'fs';
import Path from 'path';

import execa from 'execa';

import { BuildContext } from '../contexts';

const winVersion = (path: string) => (process.platform === 'win32' ? `${path}.cmd` : path);

type PackageManager = 'yarn' | 'npm';

/** The nearest lockfile at or above `dir` decides; with none, stay on yarn. */
export function detectPackageManager(dir: string): PackageManager {
  let current = Path.resolve(dir);
  while (true) {
    if (Fs.existsSync(Path.join(current, 'package-lock.json'))) return 'npm';
    if (Fs.existsSync(Path.join(current, 'yarn.lock'))) return 'yarn';
    const parent = Path.dirname(current);
    if (parent === current) return 'yarn';
    current = parent;
  }
}

export function installCommand(buildDir: string, sourceDir: string): [string, string[]] {
  // The plugin's own lockfile is copied into the build dir; without one, follow
  // whatever manages the plugin source (its repo, or the OSD checkout it sits in).
  const ownLock = ['package-lock.json', 'yarn.lock'].find((f) =>
    Fs.existsSync(Path.join(buildDir, f))
  );
  const pm = ownLock ? detectPackageManager(buildDir) : detectPackageManager(sourceDir);

  if (pm === 'yarn') {
    return [winVersion('yarn'), ['install', '--production', '--pure-lockfile']];
  }
  return ownLock === 'package-lock.json'
    ? [winVersion('npm'), ['ci', '--omit=dev']]
    : [winVersion('npm'), ['install', '--omit=dev', '--no-package-lock']];
}

export async function installDependencies({ log, buildDir, sourceDir, config }: BuildContext) {
  const pkgJson = Path.resolve(buildDir, 'package.json');

  if (config?.skipInstallDependencies || !Fs.existsSync(pkgJson)) {
    return;
  }

  const [command, args] = installCommand(buildDir, sourceDir);
  log.info(`running ${Path.basename(command, '.cmd')} to install dependencies`);
  await execa(command, args, { cwd: buildDir });
}
