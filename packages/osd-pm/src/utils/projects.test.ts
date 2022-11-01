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

import { mkdir, symlink } from 'fs';
import { join, resolve } from 'path';
import del from 'del';
import { promisify } from 'util';

import { getProjectPaths } from '../config';
import { Project } from './project';
import {
  buildProjectGraph,
  getProjects,
  includeTransitiveProjects,
  ProjectGraph,
  ProjectMap,
  topologicallyBatchProjects,
} from './projects';
import { PROCESS_WORKING_DIR } from '@osd/cross-platform';

const rootPath = resolve(__dirname, '__fixtures__/opensearch-dashboards');
const rootPlugins = join(rootPath, 'plugins');

describe('#getProjects', () => {
  beforeAll(async () => {
    // Make sure we start clean
    await del(rootPlugins, { cwd: PROCESS_WORKING_DIR });

    await promisify(mkdir)(rootPlugins);

    await promisify(symlink)(
      join(__dirname, '__fixtures__/symlinked-plugins/corge'),
      join(rootPlugins, 'corge'),
      'junction' // This parameter would only be used on Windows
    );
  });

  afterAll(async () => await del(rootPlugins, { cwd: PROCESS_WORKING_DIR }));

  test('find all packages in the packages directory', async () => {
    const projects = await getProjects(rootPath, ['packages/*']);

    const expectedProjects = ['bar', 'foo'];

    expect(projects.size).toBe(2);
    expect([...projects.keys()]).toEqual(expect.arrayContaining(expectedProjects));
  });

  test('can specify root as a separate project', async () => {
    const projects = await getProjects(rootPath, ['.']);

    expect(projects.size).toBe(1);
    expect([...projects.keys()]).toEqual(['opensearch-dashboards']);
  });

  test('handles packages outside root', async () => {
    const projects = await getProjects(rootPath, ['../plugins/*']);

    const expectedProjects = ['baz', 'quux', 'zorge'];

    expect(projects.size).toBe(3);
    expect([...projects.keys()]).toEqual(expect.arrayContaining(expectedProjects));
  });

  test('throws if multiple projects has the same name', async () => {
    await expect(
      getProjects(rootPath, ['../plugins/*', '../other-plugins/*'])
    ).rejects.toHaveProperty('message', 'There are multiple projects with the same name [baz]');
  });

  test('includes additional projects in package.json', async () => {
    const projectPaths = getProjectPaths({ rootPath });
    const projects = await getProjects(rootPath, projectPaths);

    const expectedProjects = [
      'opensearch-dashboards',
      'bar',
      'foo',
      'with-additional-projects',
      'quux',
      'baz',
      'bar',
    ];

    expect([...projects.keys()]).toEqual(expect.arrayContaining(expectedProjects));
    expect(projects.size).toBe(expectedProjects.length);
  });

  describe('with exclude/include filters', () => {
    let projectPaths: string[];
    beforeEach(() => {
      projectPaths = getProjectPaths({ rootPath });
    });

    test('excludes projects specified in `exclude` filter', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        exclude: ['foo', 'bar', 'baz'],
      });

      expect([...projects.keys()].sort()).toEqual([
        'corge',
        'opensearch-dashboards',
        'quux',
        'with-additional-projects',
      ]);
    });

    test('ignores unknown projects specified in `exclude` filter', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        exclude: ['unknown-foo', 'bar', 'unknown-baz'],
      });

      expect([...projects.keys()].sort()).toEqual([
        'baz',
        'corge',
        'foo',
        'opensearch-dashboards',
        'quux',
        'with-additional-projects',
      ]);
    });

    test('includes only projects specified in `include` filter', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        include: ['foo', 'bar'],
      });

      expect([...projects.keys()].sort()).toEqual(['bar', 'foo']);
    });

    test('ignores unknown projects specified in `include` filter', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        include: ['unknown-foo', 'bar', 'unknown-baz'],
      });

      expect([...projects.keys()].sort()).toEqual(['bar']);
    });

    test('respects both `include` and `exclude` filters if specified at the same time', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        exclude: ['bar'],
        include: ['foo', 'bar', 'baz'],
      });

      expect([...projects.keys()].sort()).toEqual(['baz', 'foo']);
    });

    test('does not return any project if wrong `include` filter is specified', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        include: ['unknown-foo', 'unknown-bar'],
      });

      expect(projects.size).toBe(0);
    });

    test('does not return any project if `exclude` filter is specified for all projects', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        exclude: [
          'opensearch-dashboards',
          'bar',
          'corge',
          'foo',
          'with-additional-projects',
          'quux',
          'baz',
        ],
      });

      expect(projects.size).toBe(0);
    });

    test('does not return any project if `exclude` and `include` filters are mutually exclusive', async () => {
      const projects = await getProjects(rootPath, projectPaths, {
        exclude: ['foo', 'bar'],
        include: ['foo', 'bar'],
      });

      expect(projects.size).toBe(0);
    });
  });
});

describe('#buildProjectGraph', () => {
  test('builds full project graph', async () => {
    const allProjects = await getProjects(rootPath, ['.', 'packages/*', '../plugins/*']);
    const graph = buildProjectGraph(allProjects);

    const expected: { [k: string]: string[] } = {};
    for (const [projectName, projects] of graph.entries()) {
      expected[projectName] = projects.map((project: Project) => project.name);
    }

    expect(expected).toMatchSnapshot();
  });
});

describe('#topologicallyBatchProjects', () => {
  let projects: ProjectMap;
  let graph: ProjectGraph;
  beforeEach(async () => {
    projects = await getProjects(rootPath, ['.', 'packages/*', '../plugins/*']);
    graph = buildProjectGraph(projects);
  });

  test('batches projects topologically based on their project dependencies', async () => {
    const batches = topologicallyBatchProjects(projects, graph);

    const expectedBatches = batches.map((batch) => batch.map((project) => project.name));

    expect(expectedBatches).toMatchSnapshot();
  });

  test('batches projects topologically even if graph contains projects not presented in the project map', async () => {
    // Make sure that the project we remove really existed in the projects map.
    expect(projects.delete('foo')).toBe(true);

    const batches = topologicallyBatchProjects(projects, graph);

    const expectedBatches = batches.map((batch) => batch.map((project) => project.name));

    expect(expectedBatches).toMatchSnapshot();
  });

  describe('batchByWorkspace = true', () => {
    test('batches projects topologically based on their project dependencies and workspaces', async () => {
      const batches = topologicallyBatchProjects(projects, graph, { batchByWorkspace: true });

      const expectedBatches = batches.map((batch) => batch.map((project) => project.name));

      expect(expectedBatches).toEqual([
        ['opensearch-dashboards'],
        ['bar', 'foo'],
        ['baz', 'zorge'],
        ['quux'],
      ]);
    });
  });
});

describe('#includeTransitiveProjects', () => {
  test('includes transitive dependencies for OpenSearch Dashboards package', async () => {
    const projects = await getProjects(rootPath, ['.', 'packages/*']);

    const opensearchDashboards = projects.get('opensearch-dashboards')!;
    const withTransitive = includeTransitiveProjects([opensearchDashboards], projects);

    expect([...withTransitive.keys()]).toEqual(['opensearch-dashboards', 'foo']);
  });

  test('handles multiple projects with same transitive dep', async () => {
    const projects = await getProjects(rootPath, ['.', 'packages/*']);

    const opensearchDashboards = projects.get('opensearch-dashboards')!;
    const bar = projects.get('bar')!;
    const withTransitive = includeTransitiveProjects([opensearchDashboards, bar], projects);

    expect([...withTransitive.keys()]).toEqual(['opensearch-dashboards', 'bar', 'foo']);
  });

  test('handles projects with no deps', async () => {
    const projects = await getProjects(rootPath, ['.', 'packages/*']);

    const foo = projects.get('foo')!;
    const withTransitive = includeTransitiveProjects([foo], projects);

    expect([...withTransitive.keys()]).toEqual(['foo']);
  });

  test('includes dependencies of dependencies', async () => {
    const projects = await getProjects(rootPath, ['.', 'packages/*', '../plugins/*']);

    const quux = projects.get('quux')!;
    const withTransitive = includeTransitiveProjects([quux], projects);

    expect([...withTransitive.keys()]).toEqual(['quux', 'bar', 'baz', 'foo']);
  });
});
