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

import { resolve } from 'path';
import { format } from 'url';
import { get, toPath } from 'lodash';
import { Cluster } from '@osd/opensearch';
import { CI_PARALLEL_PROCESS_PREFIX } from '../ci_parallel_process_prefix';
import { opensearchTestConfig } from './opensearch_test_config';

import { OPENSEARCH_DASHBOARDS_ROOT } from '../';
import * as legacyOpenSearch from 'elasticsearch';
const path = require('path');
const del = require('del');

export function createLegacyOpenSearchTestCluster(options = {}) {
  const {
    port = opensearchTestConfig.getPort(),
    password = 'changeme',
    license = 'oss',
    log,
    basePath = resolve(OPENSEARCH_DASHBOARDS_ROOT, '.opensearch'),
    opensearchFrom = opensearchTestConfig.getBuildFrom(),
    dataArchive,
    opensearchArgs: customOpenSearchArgs = [],
    opensearchEnvVars,
    clusterName: customClusterName = 'opensearch-test-cluster',
    ssl,
  } = options;

  const clusterName = `${CI_PARALLEL_PROCESS_PREFIX}${customClusterName}`;

  const opensearchArgs = [
    `cluster.name=${clusterName}`,
    `http.port=${port}`,
    'discovery.type=single-node',
    `transport.port=${opensearchTestConfig.getTransportPort()}`,
    `indices.id_field_data.enabled=false`,
    ...customOpenSearchArgs,
  ];

  const config = {
    version: opensearchTestConfig.getVersion(),
    installPath: resolve(basePath, clusterName),
    sourcePath: resolve(OPENSEARCH_DASHBOARDS_ROOT, '../opensearch'),
    password,
    license,
    basePath,
    opensearchArgs,
  };

  const cluster = new Cluster({ log, ssl });

  return new (class OpenSearchTestCluster {
    getStartTimeout() {
      const second = 1000;
      const minute = second * 60;

      return opensearchFrom === 'snapshot' ? 3 * minute : 6 * minute;
    }

    async start() {
      let installPath;

      if (opensearchFrom === 'source') {
        installPath = (await cluster.installSource(config)).installPath;
      } else if (opensearchFrom === 'snapshot') {
        installPath = (await cluster.installSnapshot(config)).installPath;
      } else if (path.isAbsolute(opensearchFrom)) {
        installPath = opensearchFrom;
      } else {
        throw new Error(`unknown option opensearchFrom "${opensearchFrom}"`);
      }

      if (dataArchive) {
        await cluster.extractDataDirectory(installPath, dataArchive);
      }

      await cluster.start(installPath, {
        password: config.password,
        opensearchArgs,
        opensearchEnvVars,
      });
    }

    async stop() {
      await cluster.stop();
      log.info('[opensearch] stopped');
    }

    async cleanup() {
      await this.stop();
      await del(config.installPath, { force: true });
      log.info('[opensearch] cleanup complete');
    }

    /**
     * Returns an opensearch Client to the configured cluster
     */
    getClient() {
      return new legacyOpenSearch.Client({
        host: this.getUrl(),
      });
    }

    getCallCluster() {
      return createCallCluster(this.getClient());
    }

    getUrl() {
      const parts = opensearchTestConfig.getUrlParts();
      parts.port = port;

      return format(parts);
    }
  })();
}

/**
 *  Create a callCluster function that properly executes methods on an
 *  elasticsearch-js client
 *
 *  @param  {elasticsearch.Client} opensearchClient
 *  @return {Function}
 */
function createCallCluster(opensearchClient) {
  return function callCluster(method, params) {
    const path = toPath(method);
    const contextPath = path.slice(0, -1);

    const action = get(opensearchClient, path);
    const context = contextPath.length ? get(opensearchClient, contextPath) : opensearchClient;

    return action.call(context, params);
  };
}
