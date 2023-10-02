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
import { IRouter } from 'src/core/server';
import { DataSourceAttributes } from 'src/plugins/data_source/common/data_sources';
import { getIndexPatternTitle } from '../../../data/common/index_patterns/utils';
import { injectMetaAttributes } from '../lib';
import { ISavedObjectsManagement } from '../services';

export const registerFindRoute = (
  router: IRouter,
  managementServicePromise: Promise<ISavedObjectsManagement>
) => {
  router.get(
    {
      path: '/api/opensearch-dashboards/management/saved_objects/_find',
      validate: {
        query: schema.object({
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          type: schema.oneOf([schema.string(), schema.arrayOf(schema.string())]),
          namespaces: schema.maybe(
            schema.oneOf([schema.string(), schema.arrayOf(schema.string())])
          ),
          search: schema.maybe(schema.string()),
          defaultSearchOperator: schema.oneOf([schema.literal('OR'), schema.literal('AND')], {
            defaultValue: 'OR',
          }),
          sortField: schema.maybe(schema.string()),
          hasReference: schema.maybe(
            schema.object({
              type: schema.string(),
              id: schema.string(),
            })
          ),
          fields: schema.oneOf([schema.string(), schema.arrayOf(schema.string())], {
            defaultValue: [],
          }),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const managementService = await managementServicePromise;
      const { client } = context.core.savedObjects;
      const searchTypes = Array.isArray(req.query.type) ? req.query.type : [req.query.type];
      const includedFields = Array.isArray(req.query.fields)
        ? req.query.fields
        : [req.query.fields];
      const importAndExportableTypes = searchTypes.filter((type) =>
        managementService.isImportAndExportable(type)
      );

      const searchFields = new Set<string>();
      importAndExportableTypes.forEach((type) => {
        const searchField = managementService.getDefaultSearchField(type);
        if (searchField) {
          searchFields.add(searchField);
        }
      });

      const getDataSource = async (id: string) => {
        return await client.get<DataSourceAttributes>('data-source', id);
      };

      const findResponse = await client.find<any>({
        ...req.query,
        fields: undefined,
        searchFields: [...searchFields],
      });

      const savedObjects = await Promise.all(
        findResponse.saved_objects.map(async (obj) => {
          if (obj.type === 'index-pattern') {
            const result = { ...obj };
            result.attributes.title = await getIndexPatternTitle(
              obj.attributes.title,
              obj.references,
              getDataSource
            );
            return result;
          } else {
            return obj;
          }
        })
      );

      const enhancedSavedObjects = savedObjects
        .map((so) => injectMetaAttributes(so, managementService))
        .map((obj) => {
          const result = { ...obj, attributes: {} as Record<string, any> };
          for (const field of includedFields) {
            result.attributes[field] = obj.attributes[field];
          }
          return result;
        });

      return res.ok({
        body: {
          ...findResponse,
          saved_objects: enhancedSavedObjects,
        },
      });
    })
  );
};
