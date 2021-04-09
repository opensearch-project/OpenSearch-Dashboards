/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to opensearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. opensearch B.V. licenses this file to you under
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { resolve } from 'path';
import { OPENSEARCH_DASHBOARDS_ROOT } from './paths';
import { createLegacyOpenSearchTestCluster } from '../../legacy_opensearch';

import { setupUsers, DEFAULT_SUPERUSER_PASS } from './auth';

export async function runOpenSearch({ config, options }) {
  const { log, opensearchFrom } = options;
  const ssl = config.get('opensearchTestCluster.ssl');
  const license = config.get('opensearchTestCluster.license');
  const opensearchArgs = config.get('opensearchTestCluster.serverArgs');
  const opensearchEnvVars = config.get('opensearchTestCluster.serverEnvVars');
  const isSecurityEnabled = opensearchArgs.includes('xpack.security.enabled=true');

  const cluster = createLegacyOpenSearchTestCluster({
    port: config.get('servers.opensearch.port'),
    password: isSecurityEnabled
      ? DEFAULT_SUPERUSER_PASS
      : config.get('servers.opensearch.password'),
    license,
    log,
    basePath: resolve(OPENSEARCH_DASHBOARDS_ROOT, '.opensearch'),
    opensearchFrom: opensearchFrom || config.get('opensearchTestCluster.from'),
    dataArchive: config.get('opensearchTestCluster.dataArchive'),
    opensearchArgs,
    opensearchEnvVars,
    ssl,
  });

  await cluster.start();

  if (isSecurityEnabled) {
    await setupUsers({
      log,
      opensearchPort: config.get('servers.opensearch.port'),
      updates: [config.get('servers.opensearch'), config.get('servers.opensearchDashboards')],
      protocol: config.get('servers.opensearch').protocol,
      caPath: getRelativeCertificateAuthorityPath(config.get('osdTestServer.serverArgs')),
    });
  }

  return cluster;
}

function getRelativeCertificateAuthorityPath(opensearchConfig = []) {
  const caConfig = opensearchConfig.find(
    (config) => config.indexOf('--opensearch.ssl.certificateAuthorities') === 0
  );
  return caConfig ? caConfig.split('=')[1] : undefined;
}
