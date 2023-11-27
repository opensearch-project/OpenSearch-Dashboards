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

export const configSchema = schema.object({
  disableWelcomeScreen: schema.boolean({ defaultValue: false }),
  disableNewThemeModal: schema.boolean({ defaultValue: false }),
  newHomepage: schema.boolean({ defaultValue: false }),
  hero: schema.object({
    enabled: schema.boolean({ defaultValue: true }),
    title: schema.string({ defaultValue: 'Try the Query Assistant' }),
    body: schema.string({
      defaultValue:
        'Automatically generate complex queries using simple conversational prompts. AI assisted summary helps you navigate and understand errors from your logs.{br}{br}You will be redirected to the observability playground where you will need to login. All the {terms} of the playground still apply.',
    }),
    img: schema.maybe(
      schema.object({
        src: schema.maybe(schema.string()),
        link: schema.maybe(schema.string()),
      })
    ),
    actionButton: schema.object({
      text: schema.string({ defaultValue: 'Try in Log Explorer' }),
      app: schema.string({ defaultValue: 'observability-logs' }),
      path: schema.string({ defaultValue: '#/explorer' }),
    }),
    externalActionButton: schema.maybe(
      schema.object({
        text: schema.string(),
        link: schema.string(),
      })
    ),
    secondaryButton: schema.object({
      text: schema.string({ defaultValue: 'Learn more' }),
      link: schema.string({
        defaultValue: 'https://opensearch.org/platform/observability/index.html',
      }),
    }),
    prompts: schema.arrayOf(
      schema.object({
        text: schema.string(),
        app: schema.string(),
        path: schema.string(),
      }),
      {
        defaultValue: [
          {
            text: 'How many errors are there in my logs?',
            app: 'observability-logs',
            path:
              '#/explorer?datasourceType=DEFAULT_INDEX_PATTERNS&indexPattern=sso-logs&datasourceName=Default%20cluster',
          },
          {
            text: 'Show me the number of flights each day?',
            app: 'observability-logs',
            path:
              '#/explorer?datasourceType=DEFAULT_INDEX_PATTERNS&indexPattern=opensearch_dashboards_sample_data_flights&datasourceName=Default%20cluster',
          },
          {
            text: 'What are top visited urls on my website?',
            app: 'observability-logs',
            path:
              '#/explorer?datasourceType=DEFAULT_INDEX_PATTERNS&indexPattern=opensearch_dashboards_sample_data_logs&datasourceName=Default%20cluster',
          },
          {
            text: 'Show me the number of orders grouped by gender',
            app: 'observability-logs',
            path:
              '#/explorer?datasourceType=DEFAULT_INDEX_PATTERNS&indexPattern=opensearch_dashboards_sample_data_ecommerce&datasourceName=Default%20cluster',
          },
        ],
      }
    ),
  }),
});

export type ConfigSchema = TypeOf<typeof configSchema>;
