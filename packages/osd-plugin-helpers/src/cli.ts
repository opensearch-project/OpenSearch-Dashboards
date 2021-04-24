/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import Path from 'path';

import { RunWithCommands, createFlagError, createFailError } from '@osd/dev-utils';

import { findOpenSearchDashboardsJson } from './find_opensearch_dashboards_json';
import { loadOpenSearchDashboardsPlatformPlugin } from './load_opensearch_dashboards_platform_plugin';
import * as Tasks from './tasks';
import { BuildContext } from './build_context';
import { resolveOpenSearchDashboardsVersion } from './resolve_opensearch_dashboards_version';
import { loadConfig } from './config';

export function runCli() {
  new RunWithCommands({
    description: 'Some helper tasks for plugin-authors',
  })
    .command({
      name: 'build',
      description: `
        Copies files from the source into a zip archive that can be distributed for
        installation into production OpenSearch Dashboards installs. The archive includes the non-
        development npm dependencies and builds itself using raw files in the source
        directory so make sure they are clean/up to date. The resulting archive can
        be found at:

          build/{plugin.id}-{opensearchDashboardsVersion}.zip

      `,
      flags: {
        boolean: ['skip-archive'],
        string: ['opensearch-dashboards-version'],
        alias: {
          k: 'opensearch-dashboards-version',
        },
        help: `
          --skip-archive        Don't create the zip file, just create the build/opensearch-dashboards directory
          --opensearch-dashboards-version, -v  OpenSearch version that the
        `,
      },
      async run({ log, flags }) {
        const versionFlag = flags['opensearch-dashboards-version'];
        if (versionFlag !== undefined && typeof versionFlag !== 'string') {
          throw createFlagError('expected a single --opensearch-dashboards-version flag');
        }

        const skipArchive = flags['skip-archive'];
        if (skipArchive !== undefined && typeof skipArchive !== 'boolean') {
          throw createFlagError('expected a single --skip-archive flag');
        }

        const pluginDir = await findOpenSearchDashboardsJson(process.cwd());
        if (!pluginDir) {
          throw createFailError(
            `Unable to find OpenSearch Dashboards Platform plugin in [${process.cwd()}] or any of its parent directories. Has it been migrated properly? Does it have a opensearch_dashboards.json file?`
          );
        }

        const plugin = loadOpenSearchDashboardsPlatformPlugin(pluginDir);
        const config = await loadConfig(log, plugin);
        const opensearchDashboardsVersion = await resolveOpenSearchDashboardsVersion(
          versionFlag,
          plugin
        );

        const sourceDir = plugin.directory;
        const buildDir = Path.resolve(
          plugin.directory,
          'build/opensearch-dashboards',
          plugin.manifest.id
        );

        const context: BuildContext = {
          log,
          plugin,
          config,
          sourceDir,
          buildDir,
          opensearchDashboardsVersion,
        };

        await Tasks.initTargets(context);
        await Tasks.optimize(context);
        await Tasks.writePublicAssets(context);
        await Tasks.writeServerFiles(context);
        await Tasks.yarnInstall(context);

        if (skipArchive !== true) {
          await Tasks.createArchive(context);
        }
      },
    })
    .execute();
}
