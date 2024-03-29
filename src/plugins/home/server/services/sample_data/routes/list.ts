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

import { IRouter } from 'src/core/server';
import { schema } from '@osd/config-schema';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';
import { createIndexName } from '../lib/create_index_name';

const NOT_INSTALLED = 'not_installed';
const INSTALLED = 'installed';
const UNKNOWN = 'unknown';

export const createListRoute = (router: IRouter, sampleDatasets: SampleDatasetSchema[]) => {
  router.get(
    {
      path: '/api/sample_data',
      validate: {
        query: schema.object({ data_source_id: schema.maybe(schema.string()) }),
      },
    },
    async (context, req, res) => {
      const dataSourceId = req.query.data_source_id;

      const registeredSampleDatasets = sampleDatasets.map((sampleDataset) => {
        return {
          id: sampleDataset.id,
          name: sampleDataset.name,
          description: sampleDataset.description,
          previewImagePath: sampleDataset.previewImagePath,
          darkPreviewImagePath: sampleDataset.darkPreviewImagePath,
          hasNewThemeImages: sampleDataset.hasNewThemeImages,
          overviewDashboard: sampleDataset.getDataSourceIntegratedDashboard(dataSourceId),
          appLinks: sampleDataset.appLinks,
          defaultIndex: sampleDataset.getDataSourceIntegratedDefaultIndex(dataSourceId),
          dataIndices: sampleDataset.dataIndices.map(({ id }) => ({ id })),
          status: sampleDataset.status,
          statusMsg: sampleDataset.statusMsg,
        };
      });
      const isInstalledPromises = registeredSampleDatasets.map(async (sampleDataset) => {
        const caller = dataSourceId
          ? context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
          : context.core.opensearch.legacy.client.callAsCurrentUser;

        for (let i = 0; i < sampleDataset.dataIndices.length; i++) {
          const dataIndexConfig = sampleDataset.dataIndices[i];
          const index = createIndexName(sampleDataset.id, dataIndexConfig.id);
          try {
            const indexExists = await caller('indices.exists', { index });

            if (!indexExists) {
              sampleDataset.status = NOT_INSTALLED;
              return;
            }

            const { count } = await caller('count', {
              index,
            });

            if (count === 0) {
              sampleDataset.status = NOT_INSTALLED;
              return;
            }
          } catch (err) {
            sampleDataset.status = UNKNOWN;
            sampleDataset.statusMsg = err.message;
            return;
          }
        }
        try {
          await context.core.savedObjects.client.get('dashboard', sampleDataset.overviewDashboard);
        } catch (err) {
          if (context.core.savedObjects.client.errors.isNotFoundError(err)) {
            sampleDataset.status = NOT_INSTALLED;
            return;
          }

          sampleDataset.status = UNKNOWN;
          sampleDataset.statusMsg = err.message;
          return;
        }

        sampleDataset.status = INSTALLED;
      });

      await Promise.all(isInstalledPromises);
      return res.ok({ body: registeredSampleDatasets });
    }
  );
};
