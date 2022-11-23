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

import Fs from 'fs';
import Path from 'path';

import execa from 'execa';

import { BuildContext } from '../contexts';

const winVersion = (path: string) => (process.platform === 'win32' ? `${path}.cmd` : path);

export async function yarnInstall({ log, buildDir, config }: BuildContext) {
  const pkgJson = Path.resolve(buildDir, 'package.json');

  if (config?.skipInstallDependencies || !Fs.existsSync(pkgJson)) {
    return;
  }

  log.info('running yarn to install dependencies');
  await execa(winVersion('yarn'), ['install', '--production', '--pure-lockfile'], {
    cwd: buildDir,
  });
}
