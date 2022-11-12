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

import { PROCESS_WORKING_DIR } from '@osd/cross-platform';
import { RunWithCommands, createFlagError, createFailError } from '@osd/dev-utils';

import { findOpenSearchDashboardsJson } from './find_opensearch_dashboards_json';
import { loadOpenSearchDashboardsPlatformPlugin } from './load_opensearch_dashboards_platform_plugin';
import * as Tasks from './tasks';
import { BuildContext, VersionContext } from './contexts';
import { resolveOpenSearchDashboardsVersion } from './resolve_opensearch_dashboards_version';
import { loadConfig } from './config';

const VERSION_PARAM_MATCH_DASHBOARDS = 'sync';
const VERSION_PARAM_USE_INPUT_FOR_PLUGIN = 'plugin-version';
const VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY = 'compatibility-version';

export function runCli() {
  new RunWithCommands({
    description: 'Some helper tasks for plugin-authors',
  })
    .command({
      name: 'build',
      description: `
        Copies files from the source into a zip archive that can be distributed for installation into production
        OpenSearch Dashboards installs. The archive includes the non-development npm dependencies and builds itself using
        raw files in the source directory so make sure they are clean/up to date. The resulting archive can be found at:

          build/{plugin.id}-{opensearchDashboardsVersion}.zip

      `,
      flags: {
        boolean: ['skip-archive'],
        string: ['opensearch-dashboards-version'],
        alias: {
          k: 'opensearch-dashboards-version',
        },
        help: `
          --skip-archive                       Don't create the zip file, just create the build/opensearch-dashboards directory
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

        const pluginDir = await findOpenSearchDashboardsJson(PROCESS_WORKING_DIR);
        if (!pluginDir) {
          throw createFailError(
            `Unable to find OpenSearch Dashboards Platform plugin in [${PROCESS_WORKING_DIR}] or any of its parent directories. Has it been migrated properly? Does it have a opensearch_dashboards.json file?`
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
    .command({
      name: 'version',
      description: `
        Without any options, it would display information about the versions found in the manifest file. With options, it
        updates the version and opensearchDashboardsVersion in the opensearch_dashboards.json and the version,
        opensearchDashboards.version, and opensearchDashboards.templateVersion in the package.json files to the values
        provided or syncs them with the version of OpenSearch Dashboards. The versions are expected to start with #.#.#
        where # are numbers.
      `,
      flags: {
        string: [VERSION_PARAM_USE_INPUT_FOR_PLUGIN, VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY],
        help: `
          --${VERSION_PARAM_MATCH_DASHBOARDS.padEnd(
            35,
            ' '
          )}Update the versions to match OpenSearch Dashboards'
          --${VERSION_PARAM_USE_INPUT_FOR_PLUGIN.padEnd(
            35,
            ' '
          )}Update the plugin's version to the one specified
          --${VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY.padEnd(
            35,
            ' '
          )}Update the plugin's compatibility version to the one specified
        `,
        allowUnexpected: true,
      },
      async run({ log, flags }) {
        const pluginDir = await findOpenSearchDashboardsJson(PROCESS_WORKING_DIR);
        if (!pluginDir) {
          throw createFailError(
            `Unable to find OpenSearch Dashboards Platform plugin in [${PROCESS_WORKING_DIR}] or any of its parent directories. Has it been migrated properly? Does it have a opensearch_dashboards.json file?`
          );
        }

        let dashboardsPackage;
        try {
          dashboardsPackage = await import(Path.join(PROCESS_WORKING_DIR, '../../package.json'));
        } catch (ex) {
          throw createFailError(`Unable to parse the OpenSearch Dashboards' package.json file`);
        }

        let pluginPackage;
        try {
          pluginPackage = await import(Path.join(PROCESS_WORKING_DIR, 'package.json'));
        } catch (ex) {
          throw createFailError(`Unable to parse the plugin's package.json file`);
        }

        let manifestFile;
        try {
          manifestFile = await import(Path.join(PROCESS_WORKING_DIR, 'opensearch_dashboards.json'));
        } catch (ex) {
          throw createFailError(`Unable to parse the plugin's opensearch_dashboards.json file`);
        }

        const dashboardsVersion = dashboardsPackage.version;
        const pluginVersion = pluginPackage.version;
        const manifestCompatibilityVersion = manifestFile.opensearchDashboardsVersion;

        log.info(
          `The plugin is on v${pluginVersion} and requires OpenSearch Dashboards v${manifestCompatibilityVersion}, ${
            manifestCompatibilityVersion === dashboardsVersion ? 'and' : 'but'
          } the one found in the directory hierarchy is on v${dashboardsVersion}.`
        );

        let askedToChange = false;
        let updatedPluginVersion = pluginVersion;
        let updatedCompatibilityVersion = manifestCompatibilityVersion;

        const doSync = flags[VERSION_PARAM_MATCH_DASHBOARDS];
        if (doSync) {
          if (!['boolean', 'string'].includes(typeof doSync))
            throw createFlagError(`expected a single --${VERSION_PARAM_MATCH_DASHBOARDS} flag`);

          /* if using legacy versions, the plugin's version has a now-redundant `.0` appended to the semantic
           * version number of OpenSearch Dashboards. If OpenSearch Dashboards has a version with a suffix, the
           * suffix has to be removed before we append the `.0`.
           */
          updatedPluginVersion =
            doSync === 'legacy'
              ? `${dashboardsVersion.replace(/^(\d+\.\d+\.\d+)(-.*)?$/, '$1')}.0`
              : dashboardsVersion;
          updatedCompatibilityVersion = `${dashboardsVersion}`;

          askedToChange = true;
        }

        const pluginVersionValue = flags[VERSION_PARAM_USE_INPUT_FOR_PLUGIN];
        if (pluginVersionValue) {
          if (typeof pluginVersionValue !== 'string')
            throw createFlagError(`expected a single --${VERSION_PARAM_USE_INPUT_FOR_PLUGIN} flag`);
          if (!/^\d+(\.\d+){2,}(-\S+)?$/.test(pluginVersionValue))
            throw createFlagError(
              `expected a valid version starting with #.#.# where # are numbers to follow the --${VERSION_PARAM_USE_INPUT_FOR_PLUGIN} flag`
            );

          updatedPluginVersion = pluginVersionValue;
          askedToChange = true;
        }

        const compatibilityVersionValue = flags[VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY];
        if (compatibilityVersionValue) {
          if (typeof compatibilityVersionValue !== 'string')
            throw createFlagError(
              `expected a single --${VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY} flag`
            );
          if (!/^\d+(\.\d+){2,}(-\S+)?$/.test(compatibilityVersionValue))
            throw createFlagError(
              `expected a valid version starting with #.#.# where # are numbers to follow the --${VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY} flag`
            );

          updatedCompatibilityVersion = compatibilityVersionValue;
          askedToChange = true;
        }

        if (!askedToChange) return;

        const context: VersionContext = {
          log,
          sourceDir: PROCESS_WORKING_DIR,
          pluginVersion: updatedPluginVersion,
          compatibilityVersion: updatedCompatibilityVersion,
        };

        await Tasks.updateVersions(context);
      },
    })
    .execute();
}
