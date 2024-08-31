/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from 'src/plugins/data/common';
import { from, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { EnhancedFetchContext, FetchFunction, QueryAggConfig, QueryStatusConfig } from './types';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return (
    date.getFullYear() +
    '-' +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + date.getDate()).slice(-2) +
    ' ' +
    ('0' + date.getHours()).slice(-2) +
    ':' +
    ('0' + date.getMinutes()).slice(-2) +
    ':' +
    ('0' + date.getSeconds()).slice(-2)
  );
};

export const getFields = (rawResponse: any) => {
  return rawResponse.data.schema?.map((field: any, index: any) => ({
    ...field,
    values: rawResponse.data.datarows?.map((row: any) => row[index]),
  }));
};

export const removeKeyword = (queryString: string | undefined) => {
  return queryString?.replace(new RegExp('.keyword'), '') ?? '';
};

export const handleFacetError = (response: any) => {
  const error = new Error(response.data);
  error.name = response.status;
  return throwError(error);
};

export const handleFetchError = (response: any) => {
  if (response.body.error) {
    const error = new Error(response.body.error.response);
    return throwError(error);
  }
};

export const fetch = (context: EnhancedFetchContext, query: Query, aggConfig?: QueryAggConfig) => {
  const { http, path, signal } = context;
  const body = JSON.stringify({ query: { ...query, format: 'jdbc' }, aggConfig });
  return from(
    http.fetch({
      method: 'POST',
      path,
      body,
      signal,
    })
  ).pipe(tap(handleFetchError));
};

export const handleQueryStatusPolling = <T, P = void>(
  fetchQueryStatus: FetchFunction<T, P>,
  interval: number = 5000
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const pollQueryStatus = async () => {
      try {
        const response: any = await fetchQueryStatus();
        // 1. lowercase / upper case
        // 2. SQL error -> comes as 500/503 not status (first query)
        //       2a) close the connection or instance to verify
        // 3. EMR -> query status request -> comes as status failed with 200 (second query)
        const status: string = (response.data.status as string).toUpperCase();

        if (status === 'SUCCESS') {
          resolve(response);
        } else if (status === 'FAILED') {
          reject(new Error('Job failed'));
        } else {
          setTimeout(pollQueryStatus, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    pollQueryStatus();
  });
};

export const buildQueryStatusConfig = (response: any) => {
  return {
    queryId: response.data.queryId,
    sessionId: response.data.sessionId,
  } as QueryStatusConfig;
};
