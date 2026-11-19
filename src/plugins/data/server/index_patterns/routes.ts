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

import Boom from '@hapi/boom';
import { omit } from 'lodash';
import { schema } from '@osd/config-schema';
import {
  HttpServiceSetup,
  LegacyAPICaller,
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';
import { FieldSpec, IndexPatternAttributes, getDataSourceReference } from '../../common';
import { IndexPatternsFetcher } from './fetcher';
import { decideLegacyClient } from '../../../data_source/common/util/';

// Objects written directly to the index by external tooling can store `fields` as an array.
const readSavedFields = (attributes: IndexPatternAttributes): FieldSpec[] => {
  const storedFields = attributes.fields;
  return Array.isArray(storedFields) ? storedFields : JSON.parse(storedFields || '[]');
};

const boomErrorResponse = (response: OpenSearchDashboardsResponseFactory, error: Boom.Boom) =>
  response.customError({
    statusCode: error.output.statusCode,
    body: { message: error.output.payload.message, attributes: error.output.payload },
  });

// Saved attributes `_update_fields` can change along with the fields; null clears one.
const savedAttribute = schema.maybe(schema.oneOf([schema.string(), schema.literal(null)]));

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
      const callAsCurrentUser = await decideLegacyClient(context, request);
      const indexPatterns = new IndexPatternsFetcher(callAsCurrentUser);
      const { pattern, meta_fields: metaFields } = request.query;

      let parsedFields: string[] = [];
      try {
        parsedFields = parseMetaFields(metaFields);
      } catch {
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
      const callAsCurrentUser = await decideLegacyClient(context, request);

      const indexPatterns = new IndexPatternsFetcher(callAsCurrentUser);
      const { pattern, interval, look_back: lookBack, meta_fields: metaFields } = request.query;

      let parsedFields: string[] = [];
      try {
        parsedFields = parseMetaFields(metaFields);
      } catch {
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
      } catch {
        return response.notFound();
      }
    }
  );

  router.post(
    {
      path: '/api/index_patterns/{id}/_refresh_fields',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        query: schema.object({
          meta_fields: schema.oneOf([schema.string(), schema.arrayOf(schema.string())], {
            defaultValue: [],
          }),
        }),
      },
    },
    async (context, request, response) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const { id } = request.params;

      let parsedFields: string[] = [];
      try {
        parsedFields = parseMetaFields(request.query.meta_fields);
      } catch {
        return response.badRequest();
      }

      try {
        const savedObject = await savedObjectsClient.get<IndexPatternAttributes>(
          'index-pattern',
          id
        );

        const savedFields = readSavedFields(savedObject.attributes);

        // Fields always come from the data source the pattern references, never from the request.
        const dataSourceId = getDataSourceReference(savedObject.references)?.id;
        if (dataSourceId && !context.dataSource) {
          return response.badRequest({
            body: {
              message: `Index pattern [${id}] references a data source, but data sources are not enabled`,
            },
          });
        }
        const callAsCurrentUser: LegacyAPICaller = dataSourceId
          ? (context.dataSource.opensearch.legacy.getClient(dataSourceId)
              .callAPI as LegacyAPICaller)
          : context.core.opensearch.legacy.client.callAsCurrentUser;

        // Popularity is the only user setting stored on discovered fields; keep it across refreshes.
        const savedCounts = new Map<string, number>();
        savedFields.forEach(({ name, scripted, count }) => {
          if (!scripted && count) {
            savedCounts.set(name, count);
          }
        });
        const fetcher = new IndexPatternsFetcher(callAsCurrentUser);
        const discoveredFields = await fetcher.getFieldsForWildcard({
          pattern: savedObject.attributes.title,
          metaFields: parsedFields,
        });
        const fields: FieldSpec[] = [
          ...discoveredFields.map((field) => {
            const count = savedCounts.get(field.name);
            return count ? { ...field, count } : field;
          }),
          ...savedFields.filter((field) => field.scripted),
        ];

        const { version } = await savedObjectsClient.update(
          'index-pattern',
          id,
          { fields: JSON.stringify(fields) },
          { version: savedObject.version }
        );

        return response.ok({
          body: { fields, version, attributes: omit(savedObject.attributes, 'fields') },
        });
      } catch (error) {
        if (Boom.isBoom(error)) {
          return boomErrorResponse(response, error);
        }
        throw error;
      }
    }
  );

  router.post(
    {
      path: '/api/index_patterns/{id}/_update_fields',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          version: schema.maybe(schema.string()),
          attributes: schema.maybe(
            schema.object({
              title: savedAttribute,
              displayName: savedAttribute,
              description: savedAttribute,
              signalType: savedAttribute,
              timeFieldName: savedAttribute,
              intervalName: savedAttribute,
              sourceFilters: savedAttribute,
              fieldFormatMap: savedAttribute,
              type: savedAttribute,
              typeMeta: savedAttribute,
              schemaMappings: savedAttribute,
            })
          ),
          scripted: schema.maybe(
            schema.object({
              upsert: schema.maybe(
                schema.arrayOf(
                  schema.object(
                    {
                      name: schema.string({ minLength: 1 }),
                      type: schema.string(),
                      script: schema.string(),
                      scripted: schema.literal(true),
                      searchable: schema.boolean(),
                      aggregatable: schema.boolean(),
                    },
                    // Keep the rest of the field as the browser serialized it (count, lang, ...).
                    { unknowns: 'allow' }
                  )
                )
              ),
              remove: schema.maybe(schema.arrayOf(schema.string())),
            })
          ),
          counts: schema.maybe(schema.recordOf(schema.string(), schema.number({ min: 0 }))),
        }),
      },
    },
    async (context, request, response) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const { id } = request.params;
      const { version, attributes, scripted, counts } = request.body;

      try {
        const savedObject = await savedObjectsClient.get<IndexPatternAttributes>(
          'index-pattern',
          id
        );
        const savedFields = readSavedFields(savedObject.attributes);

        // Discovered fields are written only by _refresh_fields, so a scripted field can't take
        // the name of one.
        const upserts: FieldSpec[] = scripted?.upsert ?? [];
        const collision = upserts.find((upsert) =>
          savedFields.some((field) => field.name === upsert.name && !field.scripted)
        );
        if (collision) {
          return response.badRequest({
            body: {
              message: `[${collision.name}] is a discovered field of index pattern [${id}] and can't be replaced by a scripted field`,
            },
          });
        }

        // Unknown names are ignored, so repeating a change is harmless.
        const removed = new Set(scripted?.remove ?? []);
        const upsertByName = new Map(upserts.map((field) => [field.name, field]));
        const savedNames = new Set(savedFields.map((field) => field.name));
        const countByName = new Map(Object.entries(counts ?? {}));
        const fields = [
          ...savedFields
            .filter((field) => !(field.scripted && removed.has(field.name)))
            .map((field) => upsertByName.get(field.name) ?? field),
          ...Array.from(upsertByName.values()).filter((field) => !savedNames.has(field.name)),
        ].map((field) => {
          const count = countByName.get(field.name);
          return count === undefined ? field : { ...field, count };
        });

        const { version: savedVersion } = await savedObjectsClient.update(
          'index-pattern',
          id,
          { ...attributes, fields: JSON.stringify(fields) },
          { version }
        );

        return response.ok({ body: { version: savedVersion } });
      } catch (error) {
        if (Boom.isBoom(error)) {
          return boomErrorResponse(response, error);
        }
        throw error;
      }
    }
  );
}
