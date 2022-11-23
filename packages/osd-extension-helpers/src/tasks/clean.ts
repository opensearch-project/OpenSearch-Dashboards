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
import { promisify } from 'util';

import del from 'del';

import { BuildContext } from '../contexts';

const asyncMkdir = promisify(Fs.mkdir);

export async function initTargets({ log, sourceDir, buildDir }: BuildContext) {
  log.info('deleting the build and target directories');
  await del(['build', 'target'], {
    cwd: sourceDir,
  });

  log.debug(`creating build output dir [${buildDir}]`);
  await asyncMkdir(buildDir, { recursive: true });
}
