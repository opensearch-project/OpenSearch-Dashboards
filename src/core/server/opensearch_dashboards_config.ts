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

import { schema, TypeOf } from '@osd/config-schema';
import { ConfigDeprecationProvider } from 'packages/osd-config';

export type OpenSearchDashboardsConfigType = TypeOf<typeof config.schema>;

const deprecations: ConfigDeprecationProvider = ({ renameFromRoot }) => [
  renameFromRoot('kibana.enabled', 'opensearchDashboards.enabled'),
  renameFromRoot('kibana.index', 'opensearchDashboards.index'),
  renameFromRoot(
    'kibana.autocompleteTerminateAfter',
    'opensearchDashboards.autocompleteTerminateAfter'
  ),
  renameFromRoot('kibana.autocompleteTimeout', 'opensearchDashboards.autocompleteTimeout'),
];

export const config = {
  path: 'opensearchDashboards',
  schema: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    index: schema.string({ defaultValue: '.kibana' }),
    autocompleteTerminateAfter: schema.duration({ defaultValue: 100000 }),
    autocompleteTimeout: schema.duration({ defaultValue: 1000 }),
    branding: schema.object({
      logo: schema.object({
        defaultUrl: schema.string({
          defaultValue: '/',
        }),
        darkModeUrl: schema.string({
          defaultValue: '/',
        }),
      }),
      mark: schema.object({
        defaultUrl: schema.string({
          defaultValue: '/',
        }),
        darkModeUrl: schema.string({
          defaultValue: '/',
        }),
      }),
      loadingLogo: schema.object({
        defaultUrl: schema.string({
          defaultValue: '/',
        }),
        darkModeUrl: schema.string({
          defaultValue: '/',
        }),
      }),
      faviconUrl: schema.string({
        defaultValue: '/',
      }),
      applicationTitle: schema.string({
        defaultValue: '',
      }),
      useExpandedHeader: schema.boolean({
        defaultValue: true,
      }),
    }),
    survey: schema.object({
      url: schema.string({
        defaultValue: 'https://survey.opensearch.org',
      }),
    }),
  }),
  deprecations,
};
