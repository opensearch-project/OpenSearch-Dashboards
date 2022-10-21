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
import {
  HttpServiceSetup,
  LegacyAPICaller,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import { IndexPatternsFetcher } from './fetcher';

export function registerRoutes(http: HttpServiceSetup) {
  const parseMetaFields = (metaFields: string | string[]) => {
    let parsedFields: string[] = [];
    if (typeof metaFields === 'string') {
      parsedFields = JSON.parse(metaFields);
    } else {
      parsedFields = metaFields;
    }
    return parsedFields;
  };

  const router = http.createRouter();
  router.get(
    {
      path: '/api/index_patterns/_fields_for_wildcard',
      validate: {
        query: schema.object({
          pattern: schema.string(),
          meta_fields: schema.oneOf([schema.string(), schema.arrayOf(schema.string())], {
            defaultValue: [],
          }),
          data_source: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const callAsCurrentUser = await decideClient(context, request);
      const indexPatterns = new IndexPatternsFetcher(callAsCurrentUser);
      const { pattern, meta_fields: metaFields } = request.query;

      let parsedFields: string[] = [];
      try {
        parsedFields = parseMetaFields(metaFields);
      } catch (error) {
        return response.badRequest();
      }

      try {
        const fields = await indexPatterns.getFieldsForWildcard({
          pattern,
          metaFields: parsedFields,
        });

        return response.ok({
          body: { fields },
          headers: {
            'content-type': 'application/json',
          },
        });
      } catch (error) {
        if (
          typeof error === 'object' &&
          !!error?.isBoom &&
          !!error?.output?.payload &&
          typeof error?.output?.payload === 'object'
        ) {
          const payload = error?.output?.payload;
          return response.notFound({
            body: {
              message: payload.message,
              attributes: payload,
            },
          });
        } else {
          return response.notFound();
        }
      }
    }
  );

  router.get(
    {
      path: '/api/index_patterns/_fields_for_time_pattern',
      validate: {
        query: schema.object({
          pattern: schema.string(),
          interval: schema.maybe(schema.string()),
          look_back: schema.number({ min: 1 }),
          meta_fields: schema.oneOf([schema.string(), schema.arrayOf(schema.string())], {
            defaultValue: [],
          }),
          data_source: schema.maybe(schema.string()),
        }),
      },
    },
    async (context: RequestHandlerContext, request: any, response: any) => {
      const callAsCurrentUser = await decideClient(context, request);

      const indexPatterns = new IndexPatternsFetcher(callAsCurrentUser);
      const { pattern, interval, look_back: lookBack, meta_fields: metaFields } = request.query;

      let parsedFields: string[] = [];
      try {
        parsedFields = parseMetaFields(metaFields);
      } catch (error) {
        return response.badRequest();
      }

      try {
        const fields = await indexPatterns.getFieldsForTimePattern({
          pattern,
          interval: interval ? interval : '',
          lookBack,
          metaFields: parsedFields,
        });

        return response.ok({
          body: { fields },
          headers: {
            'content-type': 'application/json',
          },
        });
      } catch (error) {
        return response.notFound();
      }
    }
  );
}

const decideClient = async (
  context: RequestHandlerContext,
  request: any
): Promise<LegacyAPICaller> => {
  const dataSourceId = request.query.data_source;
  return dataSourceId
    ? (context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI as LegacyAPICaller)
    : context.core.opensearch.legacy.client.callAsCurrentUser;
};
