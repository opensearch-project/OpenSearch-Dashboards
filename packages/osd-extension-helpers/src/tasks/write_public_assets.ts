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

import { pipeline } from 'stream';
import { promisify } from 'util';

import vfs from 'vinyl-fs';

import { BuildContext } from '../contexts';

const asyncPipeline = promisify(pipeline);

export async function writePublicAssets({ log, extension, sourceDir, buildDir }: BuildContext) {
  if (!extension.manifest.ui) {
    return;
  }

  log.info('copying assets from `public/assets` to build');

  await asyncPipeline(
    vfs.src(['public/assets/**/*'], {
      cwd: sourceDir,
      base: sourceDir,
      buffer: true,
      allowEmpty: true,
    }),
    vfs.dest(buildDir)
  );
}
