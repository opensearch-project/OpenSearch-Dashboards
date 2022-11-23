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

import { PROCESS_WORKING_DIR } from '@osd/cross-platform';
import { RunWithCommands, createFlagError, createFailError } from '@osd/dev-utils';

import { findOpenSearchDashboardsJson } from './find_opensearch_dashboards_json';
import { loadOpenSearchDashboardsPlatformExtension } from './load_opensearch_dashboards_platform_extension';
import * as Tasks from './tasks';
import { BuildContext, VersionContext } from './contexts';
import { resolveOpenSearchDashboardsVersion } from './resolve_opensearch_dashboards_version';
import { loadConfig } from './config';

const VERSION_PARAM_MATCH_DASHBOARDS = 'sync';
const VERSION_PARAM_USE_INPUT_FOR_EXTENSION = 'extension-version';
const VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY = 'compatibility-version';

export function runCli() {
  new RunWithCommands({
    description: 'Some helper tasks for extension-authors',
  })
    .command({
      name: 'build',
      description: `
        Copies files from the source into a zip archive that can be distributed for installation into production
        OpenSearch Dashboards installs. The archive includes the non-development npm dependencies and builds itself using
        raw files in the source directory so make sure they are clean/up to date. The resulting archive can be found at:

          build/{extension.extensionId}-{opensearchDashboardsVersion}.zip

      `,
      flags: {
        boolean: ['skip-archive'],
        string: ['opensearch-dashboards-version'],
        alias: {
          k: 'opensearch-dashboards-version',
        },
        help: `
          --skip-archive                       Don't create the zip file, just create the build/opensearch-dashboards directory
          --opensearch-dashboards-version, -k  OpenSearch Dashboards version that the built extension will target
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

        const extensionDir = await findOpenSearchDashboardsJson(PROCESS_WORKING_DIR);
        if (!extensionDir) {
          throw createFailError(
            `Unable to find OpenSearch Dashboards Platform extension in [${PROCESS_WORKING_DIR}] or any of its parent directories. Has it been migrated properly? Does it have a opensearch_dashboards.json file?`
          );
        }

        const extension = loadOpenSearchDashboardsPlatformExtension(extensionDir);
        const config = await loadConfig(log, extension);
        const opensearchDashboardsVersion = await resolveOpenSearchDashboardsVersion(
          versionFlag,
          extension
        );

        const sourceDir = extension.directory;
        const buildDir = Path.resolve(
          extension.directory,
          'build/opensearch-dashboards',
          extension.manifest.extensionId
        );

        const context: BuildContext = {
          log,
          extension,
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
        string: [VERSION_PARAM_USE_INPUT_FOR_EXTENSION, VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY],
        help: `
          --${VERSION_PARAM_MATCH_DASHBOARDS.padEnd(
            35,
            ' '
          )}Update the versions to match OpenSearch Dashboards'
          --${VERSION_PARAM_USE_INPUT_FOR_EXTENSION.padEnd(
            35,
            ' '
          )}Update the extension's version to the one specified
          --${VERSION_PARAM_USE_INPUT_FOR_COMPATIBILITY.padEnd(
            35,
            ' '
          )}Update the extension's compatibility version to the one specified
        `,
        allowUnexpected: true,
      },
      async run({ log, flags }) {
        const extensionDir = await findOpenSearchDashboardsJson(PROCESS_WORKING_DIR);
        if (!extensionDir) {
          throw createFailError(
            `Unable to find OpenSearch Dashboards Platform extension in [${PROCESS_WORKING_DIR}] or any of its parent directories. Has it been migrated properly? Does it have a opensearch_dashboards.json file?`
          );
        }

        let dashboardsPackage;
        try {
          dashboardsPackage = await import(Path.join(PROCESS_WORKING_DIR, '../../package.json'));
        } catch (ex) {
          throw createFailError(`Unable to parse the OpenSearch Dashboards' package.json file`);
        }

        let extensionPackage;
        try {
          extensionPackage = await import(Path.join(PROCESS_WORKING_DIR, 'package.json'));
        } catch (ex) {
          throw createFailError(`Unable to parse the extension's package.json file`);
        }

        let manifestFile;
        try {
          manifestFile = await import(Path.join(PROCESS_WORKING_DIR, 'opensearch_dashboards.json'));
        } catch (ex) {
          throw createFailError(`Unable to parse the extension's opensearch_dashboards.json file`);
        }

        const dashboardsVersion = dashboardsPackage.version;
        const extensionVersion = extensionPackage.version;
        const manifestCompatibilityVersion = manifestFile.opensearchDashboardsVersion;

        log.info(
          `The extension is on v${extensionVersion} and requires OpenSearch Dashboards v${manifestCompatibilityVersion}, ${
            manifestCompatibilityVersion === dashboardsVersion ? 'and' : 'but'
          } the one found in the directory hierarchy is on v${dashboardsVersion}.`
        );

        let askedToChange = false;
        let updatedExtensionVersion = extensionVersion;
        let updatedCompatibilityVersion = manifestCompatibilityVersion;

        const doSync = flags[VERSION_PARAM_MATCH_DASHBOARDS];
        if (doSync) {
          if (!['boolean', 'string'].includes(typeof doSync))
            throw createFlagError(`expected a single --${VERSION_PARAM_MATCH_DASHBOARDS} flag`);

          /* if using legacy versions, the extension's version has a now-redundant `.0` appended to the semantic
           * version number of OpenSearch Dashboards. If OpenSearch Dashboards has a version with a suffix, the
           * suffix has to be removed before we append the `.0`.
           */
          updatedExtensionVersion =
            doSync === 'legacy'
              ? `${dashboardsVersion.replace(/^(\d+\.\d+\.\d+)(-.*)?$/, '$1')}.0`
              : dashboardsVersion;
          updatedCompatibilityVersion = `${dashboardsVersion}`;

          askedToChange = true;
        }

        const extensionVersionValue = flags[VERSION_PARAM_USE_INPUT_FOR_EXTENSION];
        if (extensionVersionValue) {
          if (typeof extensionVersionValue !== 'string')
            throw createFlagError(
              `expected a single --${VERSION_PARAM_USE_INPUT_FOR_EXTENSION} flag`
            );
          if (!/^\d+(\.\d+){2,}(-\S+)?$/.test(extensionVersionValue))
            throw createFlagError(
              `expected a valid version starting with #.#.# where # are numbers to follow the --${VERSION_PARAM_USE_INPUT_FOR_EXTENSION} flag`
            );

          updatedExtensionVersion = extensionVersionValue;
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
          extensionVersion: updatedExtensionVersion,
          compatibilityVersion: updatedCompatibilityVersion,
        };

        await Tasks.updateVersions(context);
      },
    })
    .execute();
}
