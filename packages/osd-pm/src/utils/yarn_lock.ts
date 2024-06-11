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

// @ts-expect-error published types are worthless
import { parse as parseLockfile } from '@yarnpkg/lockfile';
import { standardize } from '@osd/cross-platform';
import { resolve, isAbsolute } from 'path';

import { readFile } from '../utils/fs';
import { OpenSearchDashboards } from '../utils/opensearch_dashboards';
import { Project } from '../utils/project';
import { Log } from '../utils/log';

export interface YarnLock {
  /** a simple map of name@versionrange tags to metadata about a package */
  [key: string]: {
    /** resolved version installed for this pacakge */
    version: string;
    /** resolved url for this pacakge */
    resolved: string;
    /** yarn calculated integrity value for this package */
    integrity: string;
    dependencies?: {
      /** name => versionRange dependencies listed in package's manifest */
      [key: string]: string;
    };
    optionalDependencies?: {
      /** name => versionRange dependencies listed in package's manifest */
      [key: string]: string;
    };
  };
}

export async function readYarnLock(osd: OpenSearchDashboards): Promise<YarnLock> {
  try {
    const contents = await readFile(osd.getAbsolute('yarn.lock'), 'utf8');
    const yarnLock = parseLockfile(contents);

    if (yarnLock.type === 'success') {
      return fixFileLinks(yarnLock.object, osd.getAbsolute());
    }

    throw new Error('unable to read yarn.lock file, please run `yarn osd bootstrap`');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return {};
}

/**
 * Converts relative `file:` paths to absolute paths
 * Yarn parsing method converts all file URIs to relative paths and this
 * breaks the single-version requirement as dependencies to the same path
 * would differ in their URIs across OSD and packages.
 */
function fixFileLinks(yarnLock: YarnLock, projectRoot: string): YarnLock {
  const fileLinkDelimiter = '@file:';

  const linkedKeys = Object.keys(yarnLock).filter((key) => key.includes(fileLinkDelimiter));

  if (linkedKeys.length === 0) return yarnLock;

  const updatedYarnLock = { ...yarnLock };
  for (const key of linkedKeys) {
    const [keyName, keyPath, ...rest] = key.split(fileLinkDelimiter);
    if (!isAbsolute(keyPath)) {
      const updatedKeyName = [keyName, standardize(resolve(projectRoot, keyPath)), ...rest].join(
        fileLinkDelimiter
      );
      updatedYarnLock[updatedKeyName] = updatedYarnLock[key];
    }
  }

  return updatedYarnLock;
}

/**
 * Get a list of the absolute dependencies of this project, as resolved
 * in the yarn.lock file, does not include other projects in the workspace
 * or their dependencies
 */
export function resolveDepsForProject({
  project: rootProject,
  yarnLock,
  osd,
  log,
  productionDepsOnly,
  includeDependentProject,
}: {
  project: Project;
  yarnLock: YarnLock;
  osd: OpenSearchDashboards;
  log: Log;
  productionDepsOnly: boolean;
  includeDependentProject: boolean;
}) {
  /** map of [name@range, { name, version }] */
  const resolved = new Map<string, { name: string; version: string }>();

  const seenProjects = new Set<Project>();
  const projectQueue: Project[] = [rootProject];
  const depQueue: Array<[string, string]> = [];

  while (projectQueue.length) {
    const project = projectQueue.shift()!;
    if (seenProjects.has(project)) {
      continue;
    }
    seenProjects.add(project);

    const projectDeps = Object.entries(
      productionDepsOnly ? project.productionDependencies : project.allDependencies
    );
    for (const [name, versionRange] of projectDeps) {
      depQueue.push([name, versionRange]);
    }

    while (depQueue.length) {
      const [name, versionRange] = depQueue.shift()!;
      const req = `${name}@${versionRange}`;

      if (resolved.has(req)) {
        continue;
      }

      if (includeDependentProject && osd.hasProject(name)) {
        projectQueue.push(osd.getProject(name)!);
      }

      if (!osd.hasProject(name)) {
        const pkg = yarnLock[req];
        if (!pkg) {
          log.warning(
            'yarn.lock file is out of date, please run `yarn osd bootstrap` to re-enable caching'
          );
          return;
        }

        resolved.set(req, { name, version: pkg.version });

        const allDepsEntries = [
          ...Object.entries(pkg.dependencies || {}),
          ...Object.entries(pkg.optionalDependencies || {}),
        ];

        for (const [childName, childVersionRange] of allDepsEntries) {
          depQueue.push([childName, childVersionRange]);
        }
      }
    }
  }

  return resolved;
}
