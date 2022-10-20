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

import { pipeline } from 'stream';
import { promisify } from 'util';

import vfs from 'vinyl-fs';
import { transformFileWithBabel, transformFileStream } from '@osd/dev-utils';

import { BuildContext } from '../contexts';

const asyncPipeline = promisify(pipeline);

export async function writeServerFiles({
  log,
  config,
  plugin,
  sourceDir,
  buildDir,
  opensearchDashboardsVersion,
}: BuildContext) {
  log.info('copying server source into the build and converting with babel');

  // copy source files and apply some babel transformations in the process
  await asyncPipeline(
    vfs.src(
      [
        'opensearch_dashboards.json',
        ...(plugin.manifest.server
          ? config.serverSourcePatterns || [
              'yarn.lock',
              'tsconfig.json',
              'package.json',
              'index.{js,ts}',
              '{lib,server,common,translations}/**/*',
            ]
          : []),
      ],
      {
        cwd: sourceDir,
        base: sourceDir,
        buffer: true,
        ignore: [
          '**/*.d.ts',
          '**/public/**',
          '**/__tests__/**',
          '**/*.{test,test.mocks,mock,mocks}.*',
        ],
        allowEmpty: true,
      }
    ),

    // add opensearchDashboardsVersion to opensearch_dashboards.json files and opensearchDashboards.version to package.json files
    // we don't check for `opensearchDashboards.version` in 1.0+ but the plugin helpers can still be used
    // to build plugins for older OpenSearch Dashboards versions so we do our best to support those needs by
    // setting the property if the package.json file is encountered
    transformFileStream((file) => {
      if (file.relative !== 'opensearch_dashboards.json' && file.relative !== 'package.json') {
        return;
      }

      const json = file.contents.toString('utf8');
      const parsed = JSON.parse(json);

      file.contents = Buffer.from(
        JSON.stringify(
          file.relative === 'opensearch_dashboards.json'
            ? {
                ...parsed,
                opensearchDashboardsVersion,
              }
            : {
                ...parsed,
                opensearchDashboards: {
                  ...parsed.opensearchDashboards,
                  version: opensearchDashboardsVersion,
                },
              },
          null,
          2
        )
      );
    }),

    transformFileStream(async (file) => {
      if (file.path.includes('node_modules')) {
        return;
      }

      if (['.js', '.ts', '.tsx'].includes(file.extname)) {
        await transformFileWithBabel(file);
      }
    }),

    vfs.dest(buildDir)
  );
}
