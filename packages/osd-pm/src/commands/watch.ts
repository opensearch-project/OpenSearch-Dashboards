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

import { CliError } from '../utils/errors';
import { log } from '../utils/log';
import { parallelizeBatches } from '../utils/parallelize';
import { ProjectMap, topologicallyBatchProjects } from '../utils/projects';
import { waitUntilWatchIsReady } from '../utils/watch';
import { ICommand } from './';

/**
 * Name of the script in the package/project package.json file to run during `osd watch`.
 */
const watchScriptName = 'osd:watch';

/**
 * Name of the OpenSearch Dashboards project.
 */
const opensearchDashboardsProjectName = 'opensearch-dashboards';

/**
 * Command that traverses through list of available projects/packages that have `osd:watch` script in their
 * package.json files, groups them into topology aware batches and then processes theses batches one by one
 * running `osd:watch` scripts in parallel within the same batch.
 *
 * Command internally relies on the fact that most of the build systems that are triggered by `osd:watch`
 * will emit special "marker" once build/watch process is ready that we can use as completion condition for
 * the `osd:watch` script and eventually for the entire batch. Currently we support completion "markers" for
 * `webpack` and `tsc` only, for the rest we rely on predefined timeouts.
 */
export const WatchCommand: ICommand = {
  description: 'Runs `osd:watch` script for every project.',
  name: 'watch',

  async run(projects, projectGraph) {
    const projectsToWatch: ProjectMap = new Map();
    for (const project of projects.values()) {
      // We can't watch project that doesn't have `osd:watch` script.
      if (project.hasScript(watchScriptName)) {
        projectsToWatch.set(project.name, project);
      }
    }

    if (projectsToWatch.size === 0) {
      throw new CliError(
        `There are no projects to watch found. Make sure that projects define 'osd:watch' script in 'package.json'.`
      );
    }

    const projectNames = Array.from(projectsToWatch.keys());
    log.info(`Running ${watchScriptName} scripts for [${projectNames.join(', ')}].`);

    // OpenSearch Dashboards should always be run the last, so we don't rely on automatic
    // topological batching and push it to the last one-entry batch manually.
    const shouldWatchOpenSearchDashboardsProject = projectsToWatch.delete(
      opensearchDashboardsProjectName
    );

    const batchedProjects = topologicallyBatchProjects(projectsToWatch, projectGraph);

    if (shouldWatchOpenSearchDashboardsProject) {
      batchedProjects.push([projects.get(opensearchDashboardsProjectName)!]);
    }

    await parallelizeBatches(batchedProjects, async (pkg) => {
      const completionHint = await waitUntilWatchIsReady(
        pkg.runScriptStreaming(watchScriptName, {
          debug: false,
        }).stdout
      );

      log.success(`[${pkg.name}] Initial build completed (${completionHint}).`);
    });
  },
};
