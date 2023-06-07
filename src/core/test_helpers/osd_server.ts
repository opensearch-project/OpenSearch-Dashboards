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

import { Client } from 'elasticsearch';
import { ToolingLog, REPO_ROOT } from '@osd/dev-utils';
import {
  createLegacyOpenSearchTestCluster,
  opensearchTestConfig,
  opensearchDashboardsServerTestUser,
  opensearchDashboardsTestUser,
} from '@osd/test';
import { defaultsDeep, get } from 'lodash';
import { resolve } from 'path';
import { BehaviorSubject } from 'rxjs';
import supertest from 'supertest';

import { CoreStart } from 'src/core/server';
import { LegacyAPICaller } from '../server/opensearch';
import { CliArgs, Env } from '../server/config';
import { Root } from '../server/root';
import OsdServer from '../../legacy/server/osd_server';

export type HttpMethod = 'delete' | 'get' | 'head' | 'post' | 'put';

const DEFAULTS_SETTINGS = {
  server: {
    autoListen: true,
    host: '0.0.0.0',
    // Use the ephemeral port to make sure that tests use the first available
    // port and aren't affected by the timing issues in test environment.
    port: 0,
    xsrf: { disableProtection: true },
  },
  logging: { silent: true },
  plugins: {},
  migrations: { skip: true },
};

const DEFAULT_SETTINGS_WITH_CORE_PLUGINS = {
  plugins: { scanDirs: [resolve(__dirname, '../../legacy/core_plugins')] },
  opensearch: {
    hosts: [opensearchTestConfig.getUrl()],
    username: opensearchDashboardsServerTestUser.username,
    password: opensearchDashboardsServerTestUser.password,
  },
};

export function createRootWithSettings(
  settings: Record<string, any>,
  cliArgs: Partial<CliArgs> = {}
) {
  const env = Env.createDefault(REPO_ROOT, {
    configs: [],
    cliArgs: {
      dev: false,
      quiet: false,
      silent: false,
      watch: false,
      repl: false,
      basePath: false,
      runExamples: false,
      disableOptimizer: true,
      cache: true,
      dist: false,
      ...cliArgs,
    },
    isDevClusterMaster: false,
    isDevClusterManager: false,
  });

  return new Root(
    {
      getConfig$: () => new BehaviorSubject(defaultsDeep({}, settings, DEFAULTS_SETTINGS)),
    },
    env
  );
}

/**
 * Returns supertest request attached to the core's internal native Node server.
 * @param root
 * @param method
 * @param path
 */
export function getSupertest(root: Root, method: HttpMethod, path: string) {
  const testUserCredentials = Buffer.from(
    `${opensearchDashboardsTestUser.username}:${opensearchDashboardsTestUser.password}`
  );
  return supertest((root as any).server.http.httpServer.server.listener)
    [method](path)
    .set('Authorization', `Basic ${testUserCredentials.toString('base64')}`);
}

/**
 * Creates an instance of Root with default configuration
 * tailored for unit tests.
 *
 * @param {Object} [settings={}] Any config overrides for this instance.
 * @returns {Root}
 */
export function createRoot(settings = {}, cliArgs: Partial<CliArgs> = {}) {
  return createRootWithSettings(settings, cliArgs);
}

/**
 *  Creates an instance of Root, including all of the core plugins,
 *  with default configuration tailored for unit tests.
 *
 *  @param {Object} [settings={}] Any config overrides for this instance.
 *  @returns {Root}
 */
export function createRootWithCorePlugins(settings = {}) {
  return createRootWithSettings(defaultsDeep({}, settings, DEFAULT_SETTINGS_WITH_CORE_PLUGINS));
}

/**
 * Returns `osdServer` instance used in the "legacy" OpenSearch Dashboards.
 * @param root
 */
export function getOsdServer(root: Root): OsdServer {
  return (root as any).server.legacy.osdServer;
}

export const request: Record<
  HttpMethod,
  (root: Root, path: string) => ReturnType<typeof getSupertest>
> = {
  delete: (root, path) => getSupertest(root, 'delete', path),
  get: (root, path) => getSupertest(root, 'get', path),
  head: (root, path) => getSupertest(root, 'head', path),
  post: (root, path) => getSupertest(root, 'post', path),
  put: (root, path) => getSupertest(root, 'put', path),
};

export interface TestOpenSearchServer {
  getStartTimeout: () => number;
  start: (opensearchArgs: string[], opensearchEnvVars: Record<string, string>) => Promise<void>;
  stop: () => Promise<void>;
  cleanup: () => Promise<void>;
  getClient: () => Client;
  getCallCluster: () => LegacyAPICaller;
  getUrl: () => string;
}

export interface TestOpenSearchUtils {
  stop: () => Promise<void>;
  opensearch: TestOpenSearchServer;
  hosts: string[];
  username: string;
  password: string;
}

export interface TestOpenSearchDashboardsUtils {
  root: Root;
  coreStart: CoreStart;
  osdServer: OsdServer;
  stop: () => Promise<void>;
}

export interface TestUtils {
  startOpenSearch: () => Promise<TestOpenSearchUtils>;
  startOpenSearchDashboards: () => Promise<TestOpenSearchDashboardsUtils>;
}

/**
 * Creates an instance of the Root, including all of the core "legacy" plugins,
 * with default configuration tailored for unit tests, and starts opensearch.
 *
 * @param options
 * @prop settings Any config overrides for this instance.
 * @prop adjustTimeout A function(t) => this.timeout(t) that adjust the timeout of a
 * test, ensuring the test properly waits for the server to boot without timing out.
 */
export function createTestServers({
  adjustTimeout,
  settings = {},
}: {
  adjustTimeout: (timeout: number) => void;
  settings?: {
    opensearch?: {
      license: 'oss' | 'basic' | 'gold' | 'trial';
      [key: string]: any;
    };
    osd?: {
      /**
       * An array of directories paths, passed in via absolute path strings
       */
      plugins?: {
        paths: string[];
        [key: string]: any;
      };
      [key: string]: any;
    };
    /**
     * Users passed in via this prop are created in OpenSearch in adition to the standard opensearch and opensearchDashboards users.
     * Note, this prop is ignored when using an oss, or basic license
     */
    users?: Array<{ username: string; password: string; roles: string[] }>;
  };
}): TestUtils {
  if (!adjustTimeout) {
    throw new Error('adjustTimeout is required in order to avoid flaky tests');
  }
  const license = get(settings, 'opensearch.license', 'oss');
  const usersToBeAdded = get(settings, 'users', []);
  if (usersToBeAdded.length > 0) {
    if (license !== 'trial') {
      throw new Error(
        'Adding users is only supported by createTestServers when using a trial license'
      );
    }
  }

  const log = new ToolingLog({
    level: 'debug',
    writeTo: process.stdout,
  });

  log.indent(6);
  log.info('starting opensearch');
  log.indent(4);

  const opensearch = createLegacyOpenSearchTestCluster(
    defaultsDeep({}, get(settings, 'opensearch', {}), {
      log,
      license,
    })
  );

  log.indent(-4);

  // Add time for OSD and adding users
  adjustTimeout(opensearch.getStartTimeout() + 100000);

  const osdSettings: any = get(settings, 'osd', {});

  return {
    startOpenSearch: async () => {
      await opensearch.start(get(settings, 'opensearch.opensearchArgs', []));

      if (['gold', 'trial'].includes(license)) {
        // Override provided configs
        osdSettings.opensearch = {
          hosts: [opensearchTestConfig.getUrl()],
          username: opensearchDashboardsServerTestUser.username,
          password: opensearchDashboardsServerTestUser.password,
        };
      }

      return {
        stop: async () => await opensearch.cleanup(),
        opensearch,
        hosts: [opensearchTestConfig.getUrl()],
        username: opensearchDashboardsServerTestUser.username,
        password: opensearchDashboardsServerTestUser.password,
      };
    },
    startOpenSearchDashboards: async () => {
      const root = createRootWithCorePlugins(osdSettings);

      await root.setup();
      const coreStart = await root.start();

      const osdServer = getOsdServer(root);

      return {
        root,
        osdServer,
        coreStart,
        stop: async () => await root.shutdown(),
      };
    },
  };
}
