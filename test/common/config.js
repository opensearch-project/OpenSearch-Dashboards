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

//import path from 'path';
import { format as formatUrl } from 'url';
import { opensearchTestConfig, osdTestConfig, opensearchDashboardsServerTestUser } from '@osd/test';
import { services } from './services';

export default function () {
  const servers = {
    opensearchDashboards: osdTestConfig.getUrlParts(),
    opensearch: opensearchTestConfig.getUrlParts(),
  };

  return {
    servers,

    opensearchTestCluster: {
      license: 'oss',
      from: 'snapshot',
      serverArgs: [],
    },

    osdTestServer: {
      buildArgs: [],
      sourceArgs: ['--no-base-path', '--env.name=development'],
      serverArgs: [
        '--logging.json=false',
        `--server.port=${osdTestConfig.getPort()}`,
        '--status.allowAnonymous=true',
        `--opensearch.hosts=${formatUrl(servers.opensearch)}`,
        `--opensearch.username=${opensearchDashboardsServerTestUser.username}`,
        `--opensearch.password=${opensearchDashboardsServerTestUser.password}`,
        `--home.disableWelcomeScreen=false`,
        `--home.disableNewThemeModal=true`,
        // Needed for async search functional tests to introduce a delay
        `--data.search.aggs.shardDelay.enabled=true`,
        //`--security.showInsecureClusterWarning=false`,
        // '--telemetry.banner=false',
        // '--telemetry.optIn=false',
        // These are *very* important to have them pointing to staging
        // '--telemetry.url=https://telemetry-staging.opensearch.org/xpack/v2/send',
        // '--telemetry.optInStatusUrl=https://telemetry-staging.opensearch.org/opt_in_status/v2/send',
        `--server.maxPayloadBytes=1759977`,
        // newsfeed mock service
        // `--plugin-path=${path.join(__dirname, 'fixtures', 'plugins', 'newsfeed')}`,
        // `--newsfeed.service.urlRoot=${servers.opensearchDashboards.protocol}://${servers.opensearchDashboards.hostname}:${servers.opensearchDashboards.port}`,
        // `--newsfeed.service.pathTemplate=/api/_newsfeed-FTS-external-service-simulators/opensearch-dashboards/v{VERSION}.json`,
        // Custom branding config
        `--opensearchDashboards.branding.logo.defaultUrl=https://opensearch.org/assets/brand/SVG/Logo/opensearch_logo_default.svg`,
        `--opensearchDashboards.branding.logo.darkModeUrl=https://opensearch.org/assets/brand/SVG/Logo/opensearch_logo_darkmode.svg`,
        `--opensearchDashboards.branding.mark.defaultUrl=https://opensearch.org/assets/brand/SVG/Mark/opensearch_mark_default.svg`,
        `--opensearchDashboards.branding.mark.darkModeUrl=https://opensearch.org/assets/brand/SVG/Mark/opensearch_mark_darkmode.svg`,
        `--opensearchDashboards.branding.applicationTitle=OpenSearch`,
      ],
    },
    services,
  };
}
