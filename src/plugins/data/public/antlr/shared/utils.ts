/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { from } from 'rxjs';
import { distinctUntilChanged, startWith, switchMap } from 'rxjs/operators';
import { DataSetManager } from '../../query';

export interface IDataSourceRequestHandlerParams {
  dataSourceId: string;
  title: string;
}

// Function to get raw suggestion data
export const getRawSuggestionData$ = (
  dataSetManager: DataSetManager,
  dataSourceRequestHandler: ({
    dataSourceId,
    title,
  }: IDataSourceRequestHandlerParams) => Promise<any>,
  defaultRequestHandler: () => Promise<any>
) =>
  dataSetManager.getUpdates$().pipe(
    startWith(dataSetManager.getDataSet()),
    distinctUntilChanged(),
    switchMap((dataSet) => {
      if (!dataSet) {
        return from(defaultRequestHandler());
      }
      const dataSourceId = dataSet?.dataSourceRef?.id;
      const title = dataSet?.dataSourceRef?.name;
      return from(dataSourceRequestHandler({ dataSourceId, title }));
    })
  );

const fetchFromAPI = async (api: any, body: string) => {
  try {
    return await api.http.fetch({
      method: 'POST',
      path: '/api/enhancements/search/sql',
      body,
    });
  } catch (err) {
    // TODO: pipe error to UI
    return Promise.reject(err);
  }
};

// Generic fetchData function
export const fetchData = (
  tables: string[],
  queryFormatter: (table: string, dataSourceId?: string, title?: string) => any,
  api: any,
  dataSetManager: DataSetManager
) => {
  return new Promise((resolve, reject) => {
    getRawSuggestionData$(
      dataSetManager,
      ({ dataSourceId, title }) => {
        const requests = tables.map(async (table) => {
          const body = JSON.stringify(queryFormatter(table, dataSourceId, title));
          return fetchFromAPI(api, body);
        });
        return Promise.all(requests);
      },
      () => {
        const requests = tables.map(async (table) => {
          const body = JSON.stringify(queryFormatter(table));
          return fetchFromAPI(api, body);
        });
        return Promise.all(requests);
      }
    ).subscribe({
      next: (dataFrames: any) => resolve(dataFrames),
      error: (err: Error) => {
        // TODO: pipe error to UI
        reject(err);
      },
    });
  });
};

// Specific fetch function for table schemas
export const fetchTableSchemas = (tables: string[], api: any, dataSetManager: DataSetManager) => {
  return fetchData(
    tables,
    (table, dataSourceId, title) => ({
      query: { qs: `DESCRIBE TABLES LIKE ${table}`, format: 'jdbc' },
      df: {
        meta: {
          queryConfig: {
            dataSourceId: dataSourceId || undefined,
            title: title || undefined,
          },
        },
      },
    }),
    api,
    dataSetManager
  );
};
