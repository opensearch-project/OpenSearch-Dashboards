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

import copy from 'cpy';
import del from 'del';
import { join, relative, resolve } from 'path';

import { getProjectPaths } from '../config';
import { isDirectory, isFile } from '../utils/fs';
import { log } from '../utils/log';
import { readPackageJson, writePackageJson } from '../utils/package_json';
import { Project } from '../utils/project';
import {
  buildProjectGraph,
  getProjects,
  includeTransitiveProjects,
  topologicallyBatchProjects,
} from '../utils/projects';

export async function buildProductionProjects({
  opensearchDashboardsRoot,
  buildRoot,
}: {
  opensearchDashboardsRoot: string;
  buildRoot: string;
}) {
  const projects = await getProductionProjects(opensearchDashboardsRoot);
  const projectGraph = buildProjectGraph(projects);
  const batchedProjects = topologicallyBatchProjects(projects, projectGraph);

  const projectNames = [...projects.values()].map((project) => project.name);
  log.info(`Preparing production build for [${projectNames.join(', ')}]`);

  for (const batch of batchedProjects) {
    for (const project of batch) {
      await deleteTarget(project);
      await buildProject(project);
      await copyToBuild(project, opensearchDashboardsRoot, buildRoot);
    }
  }
}

/**
 * Returns the subset of projects that should be built into the production
 * bundle. As we copy these into OpenSearch Dashboards 's `node_modules` during the build step,
 * and let OpenSearch Dashboards 's build process be responsible for installing dependencies,
 * we only include OpenSearch Dashboards 's transitive _production_ dependencies. If onlyOSS
 * is supplied, we omit projects with build.oss in their package.json set to false.
 */
async function getProductionProjects(rootPath: string) {
  const projectPaths = getProjectPaths({ rootPath });
  const projects = await getProjects(rootPath, projectPaths);
  const projectsSubset = [projects.get('opensearch-dashboards')!];

  const productionProjects = includeTransitiveProjects(projectsSubset, projects, {
    onlyProductionDependencies: true,
  });

  // We remove OpenSearch Dashboards , as we're already building OpenSearch Dashboards
  productionProjects.delete('opensearch-dashboards');

  productionProjects.forEach((project) => {
    if (project.getBuildConfig().oss === false) {
      productionProjects.delete(project.json.name);
    }
  });
  return productionProjects;
}

async function deleteTarget(project: Project) {
  const targetDir = project.targetLocation;

  if (await isDirectory(targetDir)) {
    await del(targetDir, { force: true });
  }
}

async function buildProject(project: Project) {
  // Explicitly defined targets override any bootstrap scripts
  if (project.hasBuildTargets()) {
    await project.buildForTargets();
  } else if (project.hasScript('build')) {
    await project.runScript('build');
  }
}

/**
 * Copy all the project's files from its "intermediate build directory" and
 * into the build. The intermediate directory can either be the root of the
 * project or some other location defined in the project's `package.json`.
 *
 * When copying all the files into the build, we exclude `node_modules` because
 * we want the OpenSearch Dashboards build to be responsible for actually installing all
 * dependencies. The primary reason for allowing the OpenSearch Dashboards build process to
 * manage dependencies is that it will "dedupe" them, so we don't include
 * unnecessary copies of dependencies.
 */
async function copyToBuild(project: Project, opensearchDashboardsRoot: string, buildRoot: string) {
  // We want the package to have the same relative location within the build
  const relativeProjectPath = relative(opensearchDashboardsRoot, project.path);
  const buildProjectPath = resolve(buildRoot, relativeProjectPath);

  await copy(['**/*', '!node_modules/**'], buildProjectPath, {
    cwd: project.getIntermediateBuildDirectory(),
    dot: true,
    nodir: true,
    parents: true,
  });

  // If a project is using an intermediate build directory, we special-case our
  // handling of `package.json`, as the project build process might have copied
  // (a potentially modified) `package.json` into the intermediate build
  // directory already. If so, we want to use that `package.json` as the basis
  // for creating the production-ready `package.json`. If it's not present in
  // the intermediate build, we fall back to using the project's already defined
  // `package.json`.
  const packageJson = (await isFile(join(buildProjectPath, 'package.json')))
    ? await readPackageJson(buildProjectPath)
    : project.json;

  await writePackageJson(buildProjectPath, packageJson);
}
