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
import { pipeline } from 'stream';
import { promisify } from 'util';

import del from 'del';
import vfs from 'vinyl-fs';
import zip from 'gulp-zip';

import { BuildContext } from '../contexts';

const asyncPipeline = promisify(pipeline);

export async function createArchive({ opensearchDashboardsVersion, plugin, log }: BuildContext) {
  const {
    manifest: { id },
    directory,
  } = plugin;

  const zipName = `${id}-${opensearchDashboardsVersion}.zip`;
  log.info(`compressing plugin into [${zipName}]`);

  const buildDir = Path.resolve(directory, 'build');

  // zip up the build files
  await asyncPipeline(
    vfs.src([`opensearch-dashboards/${id}/**/*`], {
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
