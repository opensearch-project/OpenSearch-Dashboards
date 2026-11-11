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
import { IRouter, LegacyCallAPIOptions, Logger } from 'src/core/server';
import { SavedObjectsErrorHelpers } from '../../../../../../core/server';
import { getWorkspaceState } from '../../../../../../core/server/utils';
import { getFinalSavedObjects, getNestedField, setNestedField } from '../data_sets/util';
import { createIndexName } from '../lib/create_index_name';
import { loadData } from '../lib/load_data';
import { SampleDatasetSchema } from '../lib/sample_dataset_registry_types';
import {
  dateToIso8601IgnoringTime,
  translateTimeRelativeToDifference,
  translateTimeRelativeToWeek,
} from '../lib/translate_timestamp';
import { SampleDataUsageTracker } from '../usage/usage';
import { DataSourceEngineType } from '../../../../../data_source/common/data_sources';

// OpenSearch Serverless time series collections can briefly reject writes to an index that was
// just (re)created. On those collections the rejected documents are resent, for up to about 60
// seconds.
const INDEX_NOT_FOUND_MAX_RETRIES = 12;
const INDEX_NOT_FOUND_RETRY_DELAY_MS = 5000;

// Errors seen while a just (re)created time series index is not yet ready for writes. A generic
// "Bad Request" without details is included: real document errors explain what is wrong.
const isTransientIndexItemError = (item: any) => {
  const error = item.index?.error;
  return (
    error?.type === 'index_not_found_exception' ||
    item.index?.status >= 500 ||
    (error?.type === 'illegal_argument_exception' && error?.reason === 'Bad Request')
  );
};

const isIndexNotFoundError = (err: any) =>
  err?.body?.error?.type === 'index_not_found_exception' ||
  /index_not_found_exception/.test(err?.message ?? '');

interface InsertDataOptions {
  retryIndexNotFound?: boolean;
  retryDelayMs?: number;
}

export const isServerlessTimeSeriesIndex = async (
  caller: (endpoint: string, clientParams?: Record<string, any>) => Promise<any>,
  index: string
) => {
  // Time series collections set index.timestamp_field on every index; other backends don't.
  try {
    const settings = await caller('indices.getSettings', { index });
    return Object.values(settings ?? {}).some(
      (indexSettings: any) => indexSettings?.settings?.index?.timestamp_field !== undefined
    );
  } catch (err) {
    return false;
  }
};

export const insertDataIntoIndex = (
  dataIndexConfig: any,
  index: string,
  nowReference: string,
  caller: (
    endpoint: string,
    clientParams?: Record<string, any>,
    options?: LegacyCallAPIOptions
  ) => Promise<any>,
  logger: Logger,
  {
    retryIndexNotFound = false,
    retryDelayMs = INDEX_NOT_FOUND_RETRY_DELAY_MS,
  }: InsertDataOptions = {}
) => {
  // Function to update timestamps
  function updateTimestamps(doc: any) {
    dataIndexConfig.timeFields
      .filter((timeFieldName: string) => getNestedField(doc, timeFieldName))
      .forEach((timeFieldName: string) => {
        const timeValue = getNestedField(doc, timeFieldName);
        const updatedTime = dataIndexConfig.preserveDayOfWeekTimeOfDay
          ? translateTimeRelativeToWeek(timeValue, dataIndexConfig.currentTimeMarker, nowReference)
          : translateTimeRelativeToDifference(
              timeValue,
              dataIndexConfig.currentTimeMarker,
              nowReference
            );
        setNestedField(doc, timeFieldName, updatedTime);
      });
    return doc;
  }

  const bulkInsert = async (docs: any) => {
    const bulk: any[] = [];
    docs.forEach((doc: any) => {
      const insertCmd: any = { index: { _index: index } };
      if (doc._id) {
        insertCmd.index._id = doc._id;
        delete doc._id;
      }
      bulk.push(insertCmd);
      bulk.push(updateTimestamps(doc));
    });

    let pending = bulk;
    for (let attempt = 0; ; attempt++) {
      const canRetry = retryIndexNotFound && attempt < INDEX_NOT_FOUND_MAX_RETRIES;
      let resp;
      try {
        resp = await caller('bulk', {
          body: pending,
        });
      } catch (err) {
        // The whole request was rejected, so no document was written and it is safe to resend.
        if (canRetry && isIndexNotFoundError(err)) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          continue;
        }
        throw err;
      }
      if (!resp.errors) {
        return;
      }

      const failed: any[] = [];
      let onlyRetryable = true;
      resp.items.forEach((item: any, i: number) => {
        const error = item.index?.error;
        if (!error) {
          return;
        }
        if (!isTransientIndexItemError(item)) {
          onlyRetryable = false;
        }
        failed.push(pending[i * 2], pending[i * 2 + 1]);
      });

      if (canRetry && onlyRetryable) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        pending = failed;
        continue;
      }

      const errMsg = `sample_data install errors while bulk inserting. OpenSearch response: ${JSON.stringify(
        resp,
        null,
        ''
      )}`;
      logger.warn(errMsg);
      return Promise.reject(
        new Error(
          `Unable to load sample data into index "${index}", see OpenSearch Dashboards logs for details`
        )
      );
    }
  };
  return loadData(dataIndexConfig.dataPath, bulkInsert); // this returns a Promise
};

export function createInstallRoute(
  router: IRouter,
  sampleDatasets: SampleDatasetSchema[],
  logger: Logger,
  usageTracker: SampleDataUsageTracker
): void {
  router.post(
    {
      path: '/api/sample_data/{id}',
      validate: {
        params: schema.object({ id: schema.string() }),
        // TODO validate now as date
        query: schema.object({
          now: schema.maybe(schema.string()),
          data_source_id: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, req, res) => {
      const { params, query } = req;
      const dataSourceId = query.data_source_id;
      const workspaceState = getWorkspaceState(req);
      const workspaceId = workspaceState?.requestWorkspaceId;

      const sampleDataset = sampleDatasets.find(({ id }) => id === params.id);
      if (!sampleDataset) {
        return res.notFound();
      }
      //  @ts-ignore Custom query validation used
      const now = query.now ? new Date(query.now) : new Date();
      const nowReference = dateToIso8601IgnoringTime(now);
      const counts = {};
      const caller = dataSourceId
        ? context.dataSource.opensearch.legacy.getClient(dataSourceId).callAPI
        : context.core.opensearch.legacy.client.callAsCurrentUser;

      let dataSourceTitle;
      let isServerlessDataSource = false;
      try {
        if (dataSourceId) {
          const dataSource = await context.core.savedObjects.client
            .get('data-source', dataSourceId)
            .then((response) => {
              const attributes: any = response?.attributes || {};
              return {
                id: response.id,
                title: attributes.title,
                engineType: attributes.dataSourceEngineType,
              };
            });

          dataSourceTitle = dataSource.title;
          isServerlessDataSource =
            dataSource.engineType === DataSourceEngineType.OpenSearchServerless;
        }
      } catch (err) {
        return res.internalError({ body: err });
      }

      for (let i = 0; i < sampleDataset.dataIndices.length; i++) {
        const dataIndexConfig = sampleDataset.dataIndices[i];
        const index =
          dataIndexConfig.indexName ?? createIndexName(sampleDataset.id, dataIndexConfig.id);

        // clean up any old installation of dataset
        try {
          await caller('indices.delete', {
            index,
          });
        } catch (err) {
          // ignore delete errors
        }

        try {
          const createIndexParams = {
            index,
            body: {
              settings: dataSourceId
                ? { index: { number_of_shards: 1 } }
                : { index: { number_of_shards: 1, auto_expand_replicas: '0-1' } },
              mappings: { properties: dataIndexConfig.fields },
            },
          };
          await caller('indices.create', createIndexParams);
        } catch (err) {
          const errMsg = `Unable to create sample data index "${index}", error: ${err.message}`;
          logger.warn(errMsg);
          return res.customError({ body: errMsg, statusCode: err.status });
        }

        const retryIndexNotFound =
          isServerlessDataSource && (await isServerlessTimeSeriesIndex(caller, index));

        try {
          const count = await insertDataIntoIndex(
            dataIndexConfig,
            index,
            nowReference,
            caller,
            logger,
            { retryIndexNotFound }
          );
          (counts as any)[index] = count;
        } catch (err) {
          const errMsg = `sample_data install errors while loading data. Error: ${err}`;
          logger.warn(errMsg);
          return res.internalError({ body: errMsg });
        }
      }

      let createResults;
      const savedObjectsList = getFinalSavedObjects({
        dataset: sampleDataset,
        workspaceId,
        dataSourceId,
        dataSourceTitle,
      });

      try {
        createResults = await context.core.savedObjects.client.bulkCreate(
          savedObjectsList.map(({ version, ...savedObject }) => savedObject),
          { overwrite: true }
        );
      } catch (err) {
        const errMsg = `bulkCreate failed, error: ${err.message}`;
        logger.warn(errMsg);
        if (workspaceId && SavedObjectsErrorHelpers.isForbiddenError(err)) {
          return res.forbidden({ body: errMsg });
        }
        return res.internalError({ body: errMsg });
      }
      const errors = createResults.saved_objects.filter((savedObjectCreateResult) => {
        return Boolean(savedObjectCreateResult.error);
      });
      if (errors.length > 0) {
        const errMsg = `sample_data install errors while loading saved objects. Errors: ${errors.join(
          ','
        )}`;
        logger.warn(errMsg);
        return res.customError({ body: errMsg, statusCode: 403 });
      }
      usageTracker.addInstall(params.id);

      // FINALLY
      return res.ok({
        body: {
          opensearchIndicesCreated: counts,
          opensearchDashboardsSavedObjectsLoaded: savedObjectsList.length,
        },
      });
    }
  );
}
