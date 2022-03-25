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

import { FtrConfigProviderContext } from '@osd/test/types/ftr';

export default async function ({ readConfigFile }: FtrConfigProviderContext) {
  const commonConfig = await readConfigFile(require.resolve('../functional/config.js'));

  return {
    testFiles: [require.resolve('./index.ts')],
    pageObjects: commonConfig.get('pageObjects'),
    services: commonConfig.get('services'),
    servers: commonConfig.get('servers'),
    opensearchTestCluster: commonConfig.get('opensearchTestCluster'),

    osdTestServer: {
      ...commonConfig.get('osdTestServer'),
      serverArgs: [
        ...commonConfig.get('osdTestServer.serverArgs'),
        '--oss',
        // '--telemetry.optIn=false',
        '--dashboard.allowByValueEmbeddables=true',
      ],
    },

    uiSettings: {
      defaults: {
        'accessibility:disableAnimations': true,
        'dateFormat:tz': 'UTC',
      },
    },

    apps: {
      opensearchDashboards: {
        pathname: '/app/opensearch-dashboards',
      },
      status_page: {
        pathname: '/status',
      },
      discover: {
        pathname: '/app/discover',
        hash: '/',
      },
      context: {
        pathname: '/app/discover',
        hash: '/context',
      },
      visualize: {
        pathname: '/app/visualize',
        hash: '/',
      },
      dashboard: {
        pathname: '/app/dashboards',
        hash: '/list',
      },
      management: {
        pathname: '/app/management',
      },
      console: {
        pathname: '/app/dev_tools',
        hash: '/console',
      },
      home: {
        pathname: '/app/home',
        hash: '/',
      },
    },
    junit: {
      reportName: 'Chrome UI Functional Tests',
    },
    browser: {
      type: 'chrome',
    },

    security: {
      roles: {
        test_logstash_reader: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['logstash*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },
        // for sample data - can remove but not add sample data
        opensearch_dashboards_sample_admin: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['opensearch_dashboards_sample*'],
                privileges: ['read', 'view_index_metadata', 'manage', 'create_index', 'index'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },
        long_window_logstash: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['long-window-logstash-*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },

        animals: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['animals-*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },
      },
      defaultRoles: ['opensearch_dashboards_admin'],
    },
  };
}
