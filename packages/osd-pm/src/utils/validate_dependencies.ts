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

// @ts-expect-error published types are useless
import { stringify as stringifyLockfile, parse as parseLockFile } from '@yarnpkg/lockfile';
import dedent from 'dedent';
import chalk from 'chalk';
import path from 'path';
import { readFileSync } from 'fs';
import { satisfies, rcompare } from 'semver';

import { writeFile } from './fs';
import { OpenSearchDashboards } from '../utils/opensearch_dashboards';
import { YarnLock } from './yarn_lock';
import { log } from './log';
import { Project } from './project';
import { ITree, treeToString } from './projects_tree';

enum SingleVersionResolution {
  STRICT = 'strict',
  LOOSE = 'loose',
  FORCE = 'force',
  BRUTE_FORCE = 'brute-force',
  IGNORE = 'ignore',
}

export async function validateDependencies(
  osd: OpenSearchDashboards,
  yarnLock: YarnLock,
  /* `singleVersionResolution` controls how violations of single-version-dependencies is applied.
   *    STRICT (default): throw an error and exit
   *    LOOSE: identify and install a single version that satisfies all ranges
   *    BRUTE_FORCE: identify and install the newest version
   *    IGNORE: show all errors without exiting
   *
   * `LOOSE`:
   *          Reconciles the various versions installed as a result of having multiple ranges for a dependency, by
   *          choosing one that satisfies all said ranges. Even though installing the chosen version updates the
   *          lock-files, no package.json changes would be needed.
   *
   * `BRUTE_FORCE`:
   *          With no care for reconciliation, the newest of the various versions installed is chosen, irrespective of
   *          whether it satisfies any of the ranges. Installing the chosen version updates the lock-files and a range
   *          in the form of `^<version>` is applied to all `package.json` files that declared the dependency.
   *
   * `FORCE`:
   *          For each dependency, first LOOSE resolution is attempted but if that fails, BRUTE_FORCE is applied.
   *
   * `IGNORE`:
   *          Behaves just like `strict` by showing errors when different ranges of a package are marked as
   *          dependencies, but it does not terminate the script.
   */
  singleVersionResolution: SingleVersionResolution = SingleVersionResolution.STRICT
) {
  // look through all the packages in the yarn.lock file to see if
  // we have accidentally installed multiple lodash v4 versions
  const lodash4Versions = new Set<string>();
  const lodash4Reqs = new Set<string>();
  for (const [req, dep] of Object.entries(yarnLock)) {
    if (req.startsWith('lodash@') && dep.version.startsWith('4.')) {
      lodash4Reqs.add(req);
      lodash4Versions.add(dep.version);
    }
  }

  // if we find more than one lodash v4 version installed then delete
  // lodash v4 requests from the yarn.lock file and prompt the user to
  // retry bootstrap so that a single v4 version will be installed
  if (lodash4Versions.size > 1) {
    for (const req of lodash4Reqs) {
      delete yarnLock[req];
    }

    await writeFile(osd.getAbsolute('yarn.lock'), stringifyLockfile(yarnLock), 'utf8');

    log.error(dedent`

      Multiple version of lodash v4 were detected, so they have been removed
      from the yarn.lock file. Please rerun yarn osd bootstrap to coalese the
      lodash versions installed.

      If you still see this error when you re-bootstrap then you might need
      to force a new dependency to use the latest version of lodash via the
      "resolutions" field in package.json.

      If you have questions about this please reach out to the operations team.

    `);

    process.exit(1);
  }

  // look through all the dependencies of production packages and production
  // dependencies of those packages to determine if we're shipping any versions
  // of lodash v3 in the distributable
  const prodDependencies = osd.resolveAllProductionDependencies(yarnLock, log);
  const lodash3Versions = new Set<string>();
  for (const dep of prodDependencies.values()) {
    if (dep.name === 'lodash' && dep.version.startsWith('3.')) {
      lodash3Versions.add(dep.version);
    }
  }

  // if any lodash v3 packages were found we abort and tell the user to fix things
  if (lodash3Versions.size) {
    log.error(dedent`

      Due to changes in the yarn.lock file and/or package.json files a version of
      lodash 3 is now included in the production dependencies. To reduce the size of
      our distributable and especially our front-end bundles we have decided to
      prevent adding any new instances of lodash 3.

      Please inspect the changes to yarn.lock or package.json files to identify where
      the lodash 3 version is coming from and remove it.

      If you have questions about this please reack out to the operations team.

    `);

    process.exit(1);
  }

  let hasIssues = false;

  // look through all the package.json files to find packages which have mismatched version ranges
  const depRanges = new Map<string, Array<{ range: string; projects: Project[] }>>();
  for (const project of osd.getAllProjects().values()) {
    for (const [dep, range] of Object.entries(
      // Don't be bothered with validating dev-deps when validating single-version loosely
      singleVersionResolution === SingleVersionResolution.LOOSE
        ? project.productionDependencies
        : project.allDependencies
    )) {
      const existingDep = depRanges.get(dep);
      if (!existingDep) {
        depRanges.set(dep, [
          {
            range,
            projects: [project],
          },
        ]);
        continue;
      }

      const existingRange = existingDep.find((existing) => existing.range === range);
      if (!existingRange) {
        existingDep.push({
          range,
          projects: [project],
        });
        continue;
      }

      existingRange.projects.push(project);
    }
  }

  const cachedManifests = new Map<string, any>();
  const violatingSingleVersionDepRanges = new Map<
    string,
    Array<{ range: string; projects: Project[] }>
  >();
  depRangesLoop: for (const [depName, ranges] of depRanges) {
    // No violation if just a single range of a dependency is used
    if (ranges.length === 1) continue;

    const installedVersions = new Set<string>();
    const installedDepVersionsCache = new Map<string, string>();
    const desiredRanges = new Map<string, Project[]>();

    rangesLoop: for (const { range, projects } of ranges) {
      for (const project of projects) {
        if (!cachedManifests.has(project.path))
          cachedManifests.set(
            project.path,
            // If there are errors reading or parsing the lockfiles, don't catch and let them fall through
            parseLockFile(readFileSync(path.join(project.path, 'yarn.lock'), 'utf-8'))
          );
        const { object: deps } = cachedManifests.get(project.path);
        if (deps?.[`${depName}@${range}`]?.version) {
          installedVersions.add(deps[`${depName}@${range}`].version);
          installedDepVersionsCache.set(
            `${project.name}#${depName}`,
            deps[`${depName}@${range}`].version
          );
        } else {
          log.warning(`Failed to find the installed version for ${depName}@${range}`);
          // If we cannot read any one of the installed versions of a depName, there is no point in continuing with it
          installedVersions.clear();
          desiredRanges.clear();
          break rangesLoop;
        }
      }

      desiredRanges.set(range, projects);
    }

    // More than one range is used but couldn't get all the installed versions: call out violation
    if (installedVersions.size === 0) {
      violatingSingleVersionDepRanges.set(depName, ranges);
      continue; // go to the next depRange
    }

    if (
      singleVersionResolution === SingleVersionResolution.LOOSE ||
      // validating with force first acts like loose
      singleVersionResolution === SingleVersionResolution.FORCE
    ) {
      if (installedVersions.size === 1) {
        hasIssues = true;

        /* When validating single-version loosely, ignore multiple ranges when they result in the installation of
         * a single version.
         */
        log.info(
          `Ignored single version requirement for ${depName} as all installations are using v${
            installedVersions.values().next().value
          }.`
        );

        continue; // go to the next depRange
      }

      const sortedInstalledVersion = Array.from(installedVersions).sort(rcompare);
      const rangePatterns = Array.from(desiredRanges.keys());

      for (const installedVersion of sortedInstalledVersion) {
        if (rangePatterns.every((range) => satisfies(installedVersion, range))) {
          // Install the version on all projects that have this dep; keep the original range.
          for (const { range, projects } of ranges) {
            for (const project of projects) {
              // Don't bother updating anything if the desired version is already installed
              if (installedDepVersionsCache.get(`${project.name}#${depName}`) === installedVersion)
                continue;

              await project.installDependencyVersion(
                depName,
                installedVersion,
                depName in project.devDependencies,
                // When validating single-version loosely, when a version change is needed, the range shouldn't change
                range
              );
            }
          }

          hasIssues = true;

          const conflictingRanges = ranges
            .map(({ range, projects }) => `${range} => ${projects.map((p) => p.name).join(', ')}`)
            .join('\n              ');
          log.warning(dedent`

            [single_version_dependencies] Multiple version ranges for package "${depName}"
            were found across different package.json files. A suitable version, v${installedVersion}, was
            identified and installed.

            The conflicting version ranges are:
              ${conflictingRanges}
          `);

          // A usable version was identified so no need to check the lower versions
          continue depRangesLoop; // go to the next depRange
        }
      }

      /* Here because a suitable version was not found. When validating single-version loosely and here, give up.
       * However, don't give up when validating with force and act like brute-force!
       */
      if (singleVersionResolution === SingleVersionResolution.LOOSE) {
        violatingSingleVersionDepRanges.set(depName, ranges);
        continue; // go to the next depRange
      }
    }

    if (
      singleVersionResolution === SingleVersionResolution.BRUTE_FORCE ||
      // validating with force here means we failed to get results when acting loosely
      singleVersionResolution === SingleVersionResolution.FORCE
    ) {
      const sortedInstalledVersion = Array.from(installedVersions).sort(rcompare);

      hasIssues = true;

      const suitableVersion = sortedInstalledVersion[0];
      const suitableRange = `^${suitableVersion}`;

      // Install the version on all projects that have this dep; use the suitable range.
      for (const { projects } of ranges) {
        for (const project of projects) {
          await project.installDependencyVersion(
            depName,
            suitableVersion,
            depName in project.devDependencies,
            suitableRange
          );
        }
      }

      const conflictingRanges = ranges
        .map(({ range, projects }) => `${range} => ${projects.map((p) => p.name).join(', ')}`)
        .join('\n              ');
      log.warning(dedent`

            [single_version_dependencies] Multiple version ranges for package "${depName}"
            were found across different package.json files. A version, v${suitableVersion}, was identified as the most recent
            already installed replacement. All package.json files have been updated to indicate a dependency on \`${depName}@${suitableRange}\`.

            The conflicting version ranges are:
              ${conflictingRanges}
          `);

      continue; // go to the next depRange
    }

    // Here because validation was not loose, forced, or brute-forced; just call out the vilation.
    violatingSingleVersionDepRanges.set(depName, ranges);
  }

  if (violatingSingleVersionDepRanges.size > 0) {
    const duplicateRanges = Array.from(violatingSingleVersionDepRanges.entries())
      .reduce(
        (acc: string[], [dep, ranges]) => [
          ...acc,
          dep,
          ...ranges.map(
            ({ range, projects }) => `  ${range} => ${projects.map((p) => p.name).join(', ')}`
          ),
        ],
        []
      )
      .join('\n        ');

    log.error(dedent`

      [single_version_dependencies] Multiple version ranges for the same dependency
      were found declared across different package.json files. Please consolidate
      those to match across all package.json files. Different versions for the
      same dependency is not supported.

      If you have questions about this please reach out to the operations team.

      The conflicting dependencies are:

        ${duplicateRanges}
    `);

    if (singleVersionResolution !== SingleVersionResolution.IGNORE) {
      process.exit(1);
    }
  }

  // look for packages that have the `opensearchDashboards.devOnly` flag in their package.json
  // and make sure they aren't included in the production dependencies of OpenSearch Dashboards
  const devOnlyProjectsInProduction = getDevOnlyProductionDepsTree(osd, 'opensearch-dashboards');
  if (devOnlyProjectsInProduction) {
    log.error(dedent`
      Some of the packages in the production dependency chain for OpenSearch Dashboards are
      flagged with "opensearchDashboards.devOnly" in their package.json. Please check changes made to
      packages and their dependencies to ensure they don't end up in production.

      The devOnly dependencies that are being dependend on in production are:

        ${treeToString(devOnlyProjectsInProduction).split('\n').join('\n        ')}
    `);

    process.exit(1);
  }

  log.success(
    hasIssues ? 'yarn.lock analysis completed' : 'yarn.lock analysis completed without any issues'
  );
}

function getDevOnlyProductionDepsTree(osd: OpenSearchDashboards, projectName: string) {
  const project = osd.getProject(projectName);
  const childProjectNames = [
    ...Object.keys(project.productionDependencies).filter((name) => osd.hasProject(name)),
  ];

  const children = childProjectNames
    .map((n) => getDevOnlyProductionDepsTree(osd, n))
    .filter((t): t is ITree => !!t);

  if (!children.length && !project.isFlaggedAsDevOnly()) {
    return;
  }

  const tree: ITree = {
    name: project.isFlaggedAsDevOnly() ? chalk.red.bold(projectName) : projectName,
    children,
  };

  return tree;
}
