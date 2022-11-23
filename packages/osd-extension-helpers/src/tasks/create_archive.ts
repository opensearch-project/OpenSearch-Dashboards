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
import { pipeline } from 'stream';
import { promisify } from 'util';

import del from 'del';
import vfs from 'vinyl-fs';
import zip from 'gulp-zip';

import { BuildContext } from '../contexts';

const asyncPipeline = promisify(pipeline);

export async function createArchive({ opensearchDashboardsVersion, extension, log }: BuildContext) {
  const {
    manifest: { extensionId },
    directory,
  } = extension;

  const zipName = `${extensionId}-${opensearchDashboardsVersion}.zip`;
  log.info(`compressing extension into [${zipName}]`);

  const buildDir = Path.resolve(directory, 'build');

  // zip up the build files
  await asyncPipeline(
    vfs.src([`opensearch-dashboards/${extensionId}/**/*`], {
      cwd: buildDir,
      base: buildDir,
      dot: true,
    }),
    zip(zipName),
    vfs.dest(buildDir)
  );

  log.info(`cleaning up compression temporary artifacts`);
  // delete the files that were zipped
  await del(Path.resolve(buildDir, 'opensearch-dashboards'), { cwd: buildDir });
}
