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

import { mockPackage } from './env.test.mocks';

import { Env, RawPackageInfo } from './env';
import { getEnvOptions } from './__mocks__/env';

const REPO_ROOT = '/test/opensearchDashboardsRoot';

const packageInfos: RawPackageInfo = {
  branch: 'main',
  version: '8.0.0',
  build: {
    number: 42,
    sha: 'one',
  },
  wazuh: {
    version: '4.x.x',
  },
};

beforeEach(() => {
  mockPackage.raw = {};
});

test('correctly creates default environment in dev mode when isDevClusterMaster (deprecated) is true', () => {
  mockPackage.raw = {
    branch: 'some-branch',
    version: 'some-version',
    wazuh: {
      version: '4.x.x',
    },
  };

  const defaultEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      configs: ['/test/cwd/config/opensearch_dashboards.yml'],
      isDevClusterMaster: true,
      isDevClusterManager: false,
    })
  );

  expect(defaultEnv).toMatchSnapshot('env properties');
  expect(defaultEnv.isDevClusterManager).toBeTruthy();
});

test('correctly creates default environment in dev mode when isDevClusterManager is true', () => {
  mockPackage.raw = {
    branch: 'some-branch',
    version: 'some-version',
    wazuh: {
      version: '4.x.x',
    },
  };

  const defaultEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      configs: ['/test/cwd/config/opensearch_dashboards.yml'],
      isDevClusterMaster: false,
      isDevClusterManager: true,
    })
  );

  expect(defaultEnv).toMatchSnapshot('env properties');
  expect(defaultEnv.isDevClusterManager).toBeTruthy();
});

test('correctly creates default environment in dev mode when isDevClusterManager and isDevClusterMaster both are true', () => {
  mockPackage.raw = {
    branch: 'some-branch',
    version: 'some-version',
    wazuh: {
      version: '4.x.x',
    },
  };

  const defaultEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      configs: ['/test/cwd/config/opensearch_dashboards.yml'],
      isDevClusterMaster: true,
      isDevClusterManager: true,
    })
  );

  expect(defaultEnv).toMatchSnapshot('env properties');
  expect(defaultEnv.isDevClusterManager).toBeTruthy();
});

test('correctly creates default environment in prod distributable mode.', () => {
  mockPackage.raw = {
    branch: 'feature-v1',
    version: 'v1',
    build: {
      distributable: true,
      number: 100,
      sha: 'feature-v1-build-sha',
    },
    wazuh: {
      version: '4.x.x',
    },
  };

  const defaultEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      cliArgs: { dev: false },
      configs: ['/some/other/path/some-opensearch-dashboards.yml'],
    })
  );

  expect(defaultEnv).toMatchSnapshot('env properties');
});

test('correctly creates default environment in prod non-distributable mode.', () => {
  mockPackage.raw = {
    branch: 'feature-v1',
    version: 'v1',
    build: {
      distributable: false,
      number: 100,
      sha: 'feature-v1-build-sha',
    },
    wazuh: {
      version: '4.x.x',
    },
  };

  const defaultEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      cliArgs: { dev: false },
      configs: ['/some/other/path/some-opensearch-dashboards.yml'],
    })
  );

  expect(defaultEnv).toMatchSnapshot('env properties');
});

test('correctly creates default environment if `--env.name` is supplied.', () => {
  mockPackage.raw = {
    branch: 'feature-v1',
    version: 'v1',
    build: {
      distributable: false,
      number: 100,
      sha: 'feature-v1-build-sha',
    },
    wazuh: {
      version: '4.x.x',
    },
  };

  const defaultDevEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      cliArgs: { envName: 'development' },
      configs: ['/some/other/path/some-opensearch-dashboards.yml'],
    })
  );

  const defaultProdEnv = Env.createDefault(
    REPO_ROOT,
    getEnvOptions({
      cliArgs: { dev: false, envName: 'production' },
      configs: ['/some/other/path/some-opensearch-dashboards.yml'],
    })
  );

  expect(defaultDevEnv).toMatchSnapshot('dev env properties');
  expect(defaultProdEnv).toMatchSnapshot('prod env properties');
});

test('correctly creates environment with constructor.', () => {
  const env = new Env(
    '/some/home/dir',
    {
      branch: 'feature-v1',
      version: 'v1',
      build: {
        distributable: true,
        number: 100,
        sha: 'feature-v1-build-sha',
      },
      wazuh: {
        version: '4.x.x',
      },
    },
    getEnvOptions({
      cliArgs: { dev: false },
      configs: ['/some/other/path/some-opensearch-dashboards.yml'],
    })
  );

  expect(env).toMatchSnapshot('env properties');
});

test('pluginSearchPaths contains examples plugins path if --run-examples flag is true', () => {
  const env = new Env(
    '/some/home/dir',
    packageInfos,
    getEnvOptions({
      cliArgs: { runExamples: true },
    })
  );

  expect(env.pluginSearchPaths).toContain('/some/home/dir/examples');
});

test('pluginSearchPaths does not contains examples plugins path if --run-examples flag is false', () => {
  const env = new Env(
    '/some/home/dir',
    packageInfos,
    getEnvOptions({
      cliArgs: { runExamples: false },
    })
  );

  expect(env.pluginSearchPaths).not.toContain('/some/home/dir/examples');
});
