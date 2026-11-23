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
import { schema } from '@osd/config-schema';
import {
  HttpServiceSetup,
  LegacyAPICaller,
  OpenSearchDashboardsResponseFactory,
  RequestHandlerContext,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/server';
import {
  FieldSpec,
  IndexPatternAttributes,
  UpdateFieldsRequest,
  getDataSourceReference,
  getEffectiveFields,
} from '../../common';
import { IndexPatternsFetcher } from './fetcher';
import { decideLegacyClient } from '../../../data_source/common/util/';

// Objects written directly to the index by external tooling can store `fields` as an array.
const readSavedFields = (
  storedFields: IndexPatternAttributes['fields'] | FieldSpec[]
): FieldSpec[] => (Array.isArray(storedFields) ? storedFields : JSON.parse(storedFields || '[]'));

// Async functions can keep dead locals alive across awaits, so these parse field lists in their own
// frame and return only what the routes keep.
const readSavedPatternForRefresh = async (client: SavedObjectsClientContract, id: string) => {
  const {
    version,
    references,
    attributes: { fields: storedFields, ...attributes },
  } = await client.get<IndexPatternAttributes>('index-pattern', id);
  // Popularity is the only user setting stored on discovered fields; keep it across refreshes.
  const counts = new Map<string, number>();
  const scriptedFields: FieldSpec[] = [];
  readSavedFields(storedFields).forEach((field) => {
    if (field.scripted) {
      scriptedFields.push(field);
    } else if (field.count) {
      counts.set(field.name, field.count);
    }
  });
  return { version, references, attributes, counts, scriptedFields };
};

const discoverFieldsJson = async (
  fetcher: IndexPatternsFetcher,
  options: { pattern: string; metaFields: string[] },
  { counts, scriptedFields }: { counts: Map<string, number>; scriptedFields: FieldSpec[] }
): Promise<string> => {
  const discoveredFields = await fetcher.getFieldsForWildcard(options);
  // Saved in the shape the browser writes, so every field has a count (0 if never used). A
  // scripted field shadows a mapped field of the same name, so only one is saved.
  return JSON.stringify(
    getEffectiveFields<FieldSpec>([
      ...discoveredFields.map((field) =>
        Object.assign(field, { count: counts.get(field.name) ?? 0, scripted: false })
      ),
      ...scriptedFields,
    ])
  );
};

const readUpdatedFieldsJson = async (
  client: SavedObjectsClientContract,
  id: string,
  { scripted, counts }: Pick<UpdateFieldsRequest, 'scripted' | 'counts'>
): Promise<string> => {
  const { attributes } = await client.get<IndexPatternAttributes>('index-pattern', id);
  // Unknown names are ignored, so repeating a change is harmless. A scripted field may reuse the
  // name of a mapped field and then replaces it, so the saved list keeps one definition per name.
  // That also cleans up lists saved earlier with both entries.
  const removed = new Set(scripted?.remove ?? []);
  const countByName = new Map((counts ?? []).map(({ name, count }) => [name, count]));
  return JSON.stringify(
    getEffectiveFields<FieldSpec>([
      ...readSavedFields(attributes.fields).filter(
        (field) => !(field.scripted && removed.has(field.name))
      ),
      ...(scripted?.upsert ?? []),
    ]).map((field) => {
      const count = countByName.get(field.name);
      return count === undefined ? field : { ...field, count };
    })
  );
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
        const saved = await readSavedPatternForRefresh(savedObjectsClient, id);

        // Fields always come from the data source the pattern references, never from the request.
        const dataSourceId = getDataSourceReference(saved.references)?.id;
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

        const fields = await discoverFieldsJson(
          new IndexPatternsFetcher(callAsCurrentUser),
          { pattern: saved.attributes.title, metaFields: parsedFields },
          saved
        );

        const { version } = await savedObjectsClient.update(
          'index-pattern',
          id,
          { fields },
          { version: saved.version }
        );

        // Reuses the serialized list; returning an object would serialize the list a second time.
        return response.ok({
          headers: { 'content-type': 'application/json' },
          body: `{"fields":${fields},"version":${JSON.stringify(version)},"attributes":${JSON.stringify(
            saved.attributes
          )}}`,
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
          counts: schema.maybe(
            schema.arrayOf(
              schema.object({ name: schema.string(), count: schema.number({ min: 0 }) })
            )
          ),
        }),
      },
    },
    async (context, request, response) => {
      const savedObjectsClient = context.core.savedObjects.client;
      const { id } = request.params;
      const { version, attributes } = request.body;

      try {
        const fields = await readUpdatedFieldsJson(savedObjectsClient, id, request.body);

        const { version: savedVersion } = await savedObjectsClient.update(
          'index-pattern',
          id,
          { ...attributes, fields },
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
