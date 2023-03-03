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

import { copyWorkspacePackages } from '@osd/pm';
import { parse } from 'semver';

import { read, write, Task } from '../lib';

export const CreatePackageJson: Task = {
  description: 'Creating build-ready version of package.json',

  async run(config, log, build) {
    const pkg = config.getOpenSearchDashboardsPkg();
    /**
     * OpenSearch server uses the `branch` property from `package.json` to
     * build links to the documentation. If set to `main`, it would use `/latest`
     * and if not, it would use the `version` to construct URLs.
     */
    const buildVersion = config.getBuildVersion();
    let branch;
    if (pkg.branch === 'main') {
      branch = pkg.branch;
    } else {
      const parsedBuildVersion = parse(buildVersion);
      if (parsedBuildVersion) {
        branch = `${parsedBuildVersion.major}.${parsedBuildVersion.minor}`;
        log.info(`Updating package.branch to ${branch}`);
      } else {
        const validDocPathsPattern = /^\d+\.\d+$/;
        if (validDocPathsPattern.test(pkg.branch as string)) {
          branch = pkg.branch;
        } else {
          // package version was not parsable and branch is unusable
          throw new Error(
            `Failed to identify documentation path while generating package.json: encountered invalid build version (${buildVersion}) and branch property (${pkg.branch}).`
          );
        }
      }
    }

    const newPkg = {
      name: pkg.name,
      private: true,
      description: pkg.description,
      keywords: pkg.keywords,
      version: buildVersion,
      branch,
      build: {
        number: config.getBuildNumber(),
        sha: config.getBuildSha(),
        distributable: true,
        release: config.isRelease,
      },
      repository: pkg.repository,
      engines: {
        node: pkg.engines.node,
      },
      resolutions: pkg.resolutions,
      workspaces: pkg.workspaces,
      dependencies: pkg.dependencies,
    };

    await write(build.resolvePath('package.json'), JSON.stringify(newPkg, null, '  '));
  },
};

export const RemovePackageJsonDeps: Task = {
  description: 'Removing dependencies from package.json',

  async run(config, log, build) {
    const path = build.resolvePath('package.json');
    const pkg = JSON.parse(await read(path));

    delete pkg.dependencies;
    delete pkg.private;
    delete pkg.resolutions;

    await write(build.resolvePath('package.json'), JSON.stringify(pkg, null, '  '));
  },
};

export const RemoveWorkspaces: Task = {
  description: 'Remove workspace artifacts',

  async run(config, log, build) {
    await copyWorkspacePackages(build.resolvePath());

    const path = build.resolvePath('package.json');
    const pkg = JSON.parse(await read(path));

    delete pkg.workspaces;

    await write(build.resolvePath('package.json'), JSON.stringify(pkg, null, '  '));
  },
};
