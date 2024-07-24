/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { from } from 'rxjs';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';

export interface IDataSourceRequestHandlerParams {
  dataSourceId: string;
  title: string;
}

export const getRawSuggestionData$ = (
  connectionsService: any,
  dataSourceReuqstHandler: ({
    dataSourceId,
    title,
  }: IDataSourceRequestHandlerParams) => Promise<any>,
  defaultReuqstHandler: () => any
) =>
  connectionsService.getSelectedConnection$().pipe(
    distinctUntilChanged(),
    switchMap((connection: any) => {
      if (connection === undefined) {
        return from(defaultReuqstHandler());
      }
      const dataSourceId = connection?.dataSource?.id;
      const title = connection?.attributes?.title;
      return from(dataSourceReuqstHandler({ dataSourceId, title }));
    })
  );

export const fetchData = (
  tables: string[],
  queryFormatter: (table: string, dataSourceId?: string, title?: string) => any,
  api: any,
  connectionService: any
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    getRawSuggestionData$(
      connectionService,
      ({ dataSourceId, title }) => {
        return Promise.all(
          tables.map(async (table) => {
            const body = JSON.stringify(queryFormatter(table, dataSourceId, title));
            return api.http.fetch({
              method: 'POST',
              path: '/api/enhancements/search/sql',
              body,
            });
          })
        );
      },
      () => {
        return Promise.all(
          tables.map(async (table) => {
            const body = JSON.stringify(queryFormatter(table));
            return api.http.fetch({
              method: 'POST',
              path: '/api/enhancements/search/sql',
              body,
            });
          })
        );
      }
    ).subscribe({
      next: (dataFrames: any) => resolve(dataFrames),
      error: (err: any) => {
        // TODO: pipe error to UI
        reject(err);
      },
    });
  });
};

export const fetchTableSchemas = (
  tables: string[],
  api: any,
  connectionService: any
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
    connectionService
  );
};

export const fetchColumnValues = (
  tables: string[],
  column: string,
  api: any,
  connectionService: any
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
    connectionService
  );
};
