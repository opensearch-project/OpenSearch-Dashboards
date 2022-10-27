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

import { schema } from '@osd/config-schema';
import { IRouter, LegacyAPICaller } from 'src/core/server';

export function registerResolveIndexRoute(router: IRouter): void {
  router.get(
    {
      path: '/internal/index-pattern-management/resolve_index/{query}',
      validate: {
        params: schema.object({
          query: schema.string(),
        }),
        query: schema.object({
          expand_wildcards: schema.maybe(
            schema.oneOf([
              schema.literal('all'),
              schema.literal('open'),
              schema.literal('closed'),
              schema.literal('hidden'),
              schema.literal('none'),
            ])
          ),
          data_source: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, req, res) => {
      const queryString = req.query.expand_wildcards
        ? { expand_wildcards: req.query.expand_wildcards }
        : null;

      const dataSourceId = req.query.data_source;
      const caller = dataSourceId
        ? context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
        : context.core.opensearch.legacy.client.callAsCurrentUser;

      try {
        const result = await caller('transport.request', {
          method: 'GET',
          path: `/_resolve/index/${encodeURIComponent(req.params.query)}${
            queryString ? '?' + new URLSearchParams(queryString).toString() : ''
          }`,
        });
        return res.ok({ body: result });
      } catch (err) {
        return res.customError({
          statusCode: err.statusCode || 500,
          body: {
            message: err.message,
            attributes: {
              error: err.body?.error || err.message,
            },
          },
        });
      }
    }
  );
}
