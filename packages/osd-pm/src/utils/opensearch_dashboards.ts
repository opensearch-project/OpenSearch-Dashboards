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

import multimatch from 'multimatch';
import isPathInside from 'is-path-inside';

import { resolveDepsForProject, YarnLock } from './yarn_lock';
import { Log } from './log';
import { ProjectMap, getProjects, includeTransitiveProjects } from './projects';
import { Project } from './project';
import { getProjectPaths } from '../config';

/**
 * Helper class for dealing with a set of projects as children of
 * the OpenSearch Dashboards project. The osd/pm is currently implemented to be
 * more generic, where everything is an operation of generic projects,
 * but that leads to exceptions where we need the OpenSearch Dashboards project and
 * do things like `project.get('opensearch-dashboards')!`.
 *
 * Using this helper we can restructre the generic list of projects
 * as a OpenSearch Dashboards object which encapulates all the projects in the
 * workspace and knows about the root OpenSearch Dashboards project.
 */
export class OpenSearchDashboards {
  static async loadFrom(rootPath: string) {
    return new OpenSearchDashboards(await getProjects(rootPath, getProjectPaths({ rootPath })));
  }

  private readonly opensearchDashboardsProject: Project;

  constructor(private readonly allWorkspaceProjects: ProjectMap) {
    const opensearchDashboardsProject = allWorkspaceProjects.get('opensearch-dashboards');

    if (!opensearchDashboardsProject) {
      throw new TypeError(
        'Unable to create OpenSearch Dashboards object without all projects, including the OpenSearch Dashboards project.'
      );
    }

    this.opensearchDashboardsProject = opensearchDashboardsProject;
  }

  /** make an absolute path by resolving subPath relative to the opensearch-dashboards repo */
  getAbsolute(...subPath: string[]) {
    return Path.resolve(this.opensearchDashboardsProject.path, ...subPath);
  }

  /** convert an absolute path to a relative path, relative to the opensearch-dashboards repo */
  getRelative(absolute: string) {
    return Path.relative(this.opensearchDashboardsProject.path, absolute);
  }

  /** get a copy of the map of all projects in the opensearch-dashboards workspace */
  getAllProjects() {
    return new Map(this.allWorkspaceProjects);
  }

  /** determine if a project with the given name exists */
  hasProject(name: string) {
    return this.allWorkspaceProjects.has(name);
  }

  /** get a specific project, throws if the name is not known (use hasProject() first) */
  getProject(name: string) {
    const project = this.allWorkspaceProjects.get(name);

    if (!project) {
      throw new Error(`No package with name "${name}" in the workspace`);
    }

    return project;
  }

  /** get a project and all of the projects it depends on in a ProjectMap */
  getProjectAndDeps(name: string) {
    const project = this.getProject(name);
    return includeTransitiveProjects([project], this.allWorkspaceProjects);
  }

  /** filter the projects to just those matching certain paths/include/exclude tags */
  getFilteredProjects(options: {
    skipOpenSearchDashboardsPlugins: boolean;
    ossOnly: boolean;
    exclude: string[];
    include: string[];
  }) {
    const allProjects = this.getAllProjects();
    const filteredProjects: ProjectMap = new Map();

    const pkgJsonPaths = Array.from(allProjects.values()).map((p) => p.packageJsonLocation);
    const filteredPkgJsonGlobs = getProjectPaths({
      ...options,
      rootPath: this.opensearchDashboardsProject.path,
    }).map((g) => Path.resolve(g, 'package.json'));
    const matchingPkgJsonPaths = multimatch(pkgJsonPaths, filteredPkgJsonGlobs);

    for (const project of allProjects.values()) {
      const pathMatches = matchingPkgJsonPaths.includes(project.packageJsonLocation);
      const notExcluded = !options.exclude.includes(project.name);
      const isIncluded = !options.include.length || options.include.includes(project.name);

      if (pathMatches && notExcluded && isIncluded) {
        filteredProjects.set(project.name, project);
      }
    }

    return filteredProjects;
  }

  isPartOfRepo(project: Project) {
    return (
      project.path === this.opensearchDashboardsProject.path ||
      isPathInside(project.path, this.opensearchDashboardsProject.path)
    );
  }

  isOutsideRepo(project: Project) {
    return !this.isPartOfRepo(project);
  }

  resolveAllProductionDependencies(yarnLock: YarnLock, log: Log) {
    const opensearchDashboardsDeps = resolveDepsForProject({
      project: this.opensearchDashboardsProject,
      yarnLock,
      osd: this,
      includeDependentProject: true,
      productionDepsOnly: true,
      log,
    })!;

    return new Map([...opensearchDashboardsDeps.entries()]);
  }
}
