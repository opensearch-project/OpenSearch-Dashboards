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
import { transformFileWithBabel, transformFileStream } from '@osd/dev-utils';

import { BuildContext } from '../contexts';

const asyncPipeline = promisify(pipeline);

export async function writeServerFiles({
  log,
  config,
  extension,
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
        ...(extension.manifest.server
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
    // we don't check for `opensearchDashboards.version` in 1.0+ but the extension helpers can still be used
    // to build extensions for older OpenSearch Dashboards versions so we do our best to support those needs by
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
