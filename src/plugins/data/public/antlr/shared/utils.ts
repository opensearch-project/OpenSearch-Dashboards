/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IDataSourceRequestHandlerParams {
  dataSourceId: string;
  title: string;
}

export const fetchData = (
  tables: string[],
  queryFormatter: (table: string, dataSourceId?: string, title?: string) => any,
  api: any,
  dataSet: any
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    try {
      const dataSourceId = dataSet && dataSet.dataSourceRef ? dataSet.dataSourceRef.id : undefined;
      const title = dataSet && dataSet.dataSourceRef ? dataSet.dataSourceRef.name : undefined;

      const fetchPromises = tables.map(async (table) => {
        const body = JSON.stringify(queryFormatter(table, dataSourceId, title));
        return api.http.fetch({
          method: 'POST',
          path: '/api/enhancements/search/sql',
          body,
        });
      });

      Promise.all(fetchPromises)
        .then((dataFrames) => resolve(dataFrames))
        .catch((err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export const fetchTableSchemas = (
  tables: string[],
  api: any,
  selectedDataSet: any
): Promise<any[]> => {
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
    selectedDataSet
  );
};

export const fetchColumnValues = (
  tables: string[],
  column: string,
  api: any,
  selectedDataSet: any
): Promise<any[]> => {
  return fetchData(
    tables,
    (table, dataSourceId, title) => ({
      query: { qs: `SELECT DISTINCT ${column} FROM ${table} LIMIT 10`, format: 'jdbc' },
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
    selectedDataSet
  );
};
