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

import { resolve, parse, dirname, isAbsolute, relative } from 'path';

import loadJsonFile from 'load-json-file';
import { resolveToFullPathSync, resolveToShortPathSync, realPathSync } from './path';

const readOpenSearchDashboardsPkgJson = (dir: string) => {
  try {
    const path = resolve(dir, 'package.json');
    const json = loadJsonFile.sync(path) as { [key: string]: any };
    if (json?.name === 'opensearch-dashboards') {
      return json;
    }
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }

    throw error;
  }
};

const findOpenSearchDashboardsPackageJson = () => {
  // search for the opensearch-dashboards directory, since this file is moved around it might
  // not be where we think but should always be a relatively close parent
  // of this directory
  const startDir = realPathSync(__dirname);
  const { root: rootDir } = parse(startDir);
  let cursor = startDir;
  while (true) {
    const opensearchDashboardsPkgJson = readOpenSearchDashboardsPkgJson(cursor);
    if (opensearchDashboardsPkgJson) {
      return {
        opensearchDashboardsDir: cursor,
        opensearchDashboardsPkgJson: opensearchDashboardsPkgJson as {
          name: string;
          branch: string;
        },
      };
    }

    const parent = dirname(cursor);
    if (parent === rootDir) {
      throw new Error(`unable to find opensearch-dashboards directory from ${startDir}`);
    }
    cursor = parent;
  }
};

const {
  opensearchDashboardsDir,
  opensearchDashboardsPkgJson,
} = findOpenSearchDashboardsPackageJson();

export const REPO_ROOT = resolveToFullPathSync(opensearchDashboardsDir);
export const REPO_ROOT_8_3 = resolveToShortPathSync(opensearchDashboardsDir);
export const UPSTREAM_BRANCH = opensearchDashboardsPkgJson.branch;

export const getMatchingRoot = (path: string, rootPaths: string | string[]) => {
  const rootPathsArray = Array.isArray(rootPaths) ? rootPaths : [rootPaths];

  // We can only find the appropriate root if an absolute path was given
  if (path && isAbsolute(path)) {
    // Return the matching root if one is found or return `undefined`
    return rootPathsArray.find((root) => path.startsWith(root));
  }

  return undefined;
};

export const getRepoRoot = (path: string) => getMatchingRoot(path, [REPO_ROOT, REPO_ROOT_8_3]);

export const relativeToRepoRoot = (path: string) => {
  const repoRoot = getRepoRoot(path);
  return repoRoot ? relative(repoRoot, path) : null;
};
