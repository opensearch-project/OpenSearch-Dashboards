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

import { pageObjects } from './page_objects';
import { services } from './services';

export default async function ({ readConfigFile }) {
  const commonConfig = await readConfigFile(require.resolve('../common/config'));

  return {
    testFiles: [
      require.resolve('./apps/bundles'),
      require.resolve('./apps/console'),
      require.resolve('./apps/context'),
      require.resolve('./apps/dashboard'),
      require.resolve('./apps/getting_started'),
      require.resolve('./apps/home'),
      require.resolve('./apps/management'),
      require.resolve('./apps/saved_objects_management'),
      require.resolve('./apps/status_page'),
      require.resolve('./apps/visualize'),
      require.resolve('./apps/vis_builder'),
    ],
    pageObjects,
    services,

    servers: commonConfig.get('servers'),

    opensearchTestCluster: commonConfig.get('opensearchTestCluster'),

    osdTestServer: {
      ...commonConfig.get('osdTestServer'),
      serverArgs: [
        ...commonConfig.get('osdTestServer.serverArgs'),
        // '--telemetry.optIn=false',
        '--savedObjects.maxImportPayloadBytes=10485760',
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
        pathname: '/app/data-explorer/discover',
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
      visBuilder: {
        pathname: '/app/vis-builder',
        hash: '/',
      },
      dashboard: {
        pathname: '/app/dashboards',
        hash: '/list',
      },
      management: {
        pathname: '/app/management',
      },
      /** @obsolete "management" should be instead of "settings" **/
      settings: {
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
        test_shakespeare_reader: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['shakes*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },
        test_testhuge_reader: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['testhuge*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },
        test_alias_reader: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['alias*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },
        //for sample data - can remove but not add sample data.( not ml)- for ml use built in role.
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

        opensearch_dashboards_date_nanos: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['date-nanos'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },

        opensearch_dashboards_date_nanos_custom: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['date_nanos_custom_timestamp'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },

        opensearch_dashboards_date_nanos_mixed: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['date_nanos_mixed', 'timestamp-*'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },

        opensearch_dashboards_timefield: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['without-timefield', 'with-timefield'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },

        opensearch_dashboards_large_strings: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['testlargestring'],
                privileges: ['read', 'view_index_metadata'],
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
                names: ['animals-*', 'dogbreeds'],
                privileges: ['read', 'view_index_metadata'],
                field_security: { grant: ['*'], except: [] },
              },
            ],
            run_as: [],
          },
          opensearchDashboards: [],
        },

        test_alias1_reader: {
          opensearch: {
            cluster: [],
            indices: [
              {
                names: ['alias1'],
                privileges: ['read', 'view_index_metadata'],
              },
            ],
          },
        },
      },
      defaultRoles: ['test_logstash_reader', 'opensearch_dashboards_admin'],
    },
  };
}
