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
import _ from 'lodash';
import { IRouter } from 'src/core/server';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';
import { createIndexName } from '../lib/create_index_name';
import { SampleDataUsageTracker } from '../usage/usage';

export function createUninstallRoute(
  router: IRouter,
  sampleDatasets: SampleDatasetSchema[],
  usageTracker: SampleDataUsageTracker
): void {
  router.delete(
    {
      path: '/api/sample_data/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        query: schema.object({
          data_source_id: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const sampleDataset = sampleDatasets.find(({ id }) => id === request.params.id);
      const dataSourceId = request.query.data_source_id;

      if (!sampleDataset) {
        return response.notFound();
      }

      const caller = dataSourceId
        ? context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
        : context.core.opensearch.legacy.client.callAsCurrentUser;

      for (let i = 0; i < sampleDataset.dataIndices.length; i++) {
        const dataIndexConfig = sampleDataset.dataIndices[i];
        const index = createIndexName(sampleDataset.id, dataIndexConfig.id);

        try {
          await caller('indices.delete', { index });
        } catch (err) {
          return response.customError({
            statusCode: err.status,
            body: {
              message: `Unable to delete sample data index "${index}", error: ${err.message}`,
            },
          });
        }
      }

      const savedObjectsList = dataSourceId
        ? sampleDataset.getDataSourceIntegratedSavedObjects(dataSourceId)
        : sampleDataset.savedObjects;

      const deletePromises = savedObjectsList.map(({ type, id }) =>
        context.core.savedObjects.client.delete(type, id)
      );

      try {
        await Promise.all(deletePromises);
      } catch (err) {
        // ignore 404s since users could have deleted some of the saved objects via the UI
        if (_.get(err, 'output.statusCode') !== 404) {
          return response.customError({
            statusCode: err.status,
            body: {
              message: `Unable to delete sample dataset saved objects, error: ${err.message}`,
            },
          });
        }
      }

      // track the usage operation in a non-blocking way
      usageTracker.addUninstall(request.params.id);

      return response.noContent();
    }
  );
}
