/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from 'src/plugins/data/common';
import { from, timer } from 'rxjs';
import { filter, mergeMap, take, takeWhile } from 'rxjs/operators';
import { stringify } from '@osd/std';
import {
  EnhancedFetchContext,
  QueryAggConfig,
  QueryStatusConfig,
  QueryStatusOptions,
} from './types';

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

export const throwFacetError = (response: any) => {
  const error = new Error(response.data.body?.message ?? response.data.body ?? response.data);
  error.name = response.data.status ?? response.status ?? response.data.statusCode;
  (error as any).status = error.name;
  throw error;
};

export const fetch = (context: EnhancedFetchContext, query: Query, aggConfig?: QueryAggConfig) => {
  const { http, path, signal } = context;
  const body = stringify({
    query: { ...query, format: 'jdbc' },
    aggConfig,
    pollQueryResultsParams: context.body?.pollQueryResultsParams,
    timeRange: context.body?.timeRange,
  });
  return from(
    http.fetch({
      method: 'POST',
      path,
      body,
      signal,
    })
  );
};

export const handleQueryStatus = <T>(options: QueryStatusOptions<T>): Promise<T> => {
  const { fetchStatus, interval = 5000, isServer = false } = options;

  return timer(0, interval)
    .pipe(
      mergeMap(() => fetchStatus()),
      takeWhile((response) => {
        const status = isServer
          ? (response as any)?.data?.status?.toUpperCase()
          : (response as any)?.status?.toUpperCase();
        return status !== 'SUCCESS' && status !== 'FAILED';
      }, true),
      filter((response) => {
        const status = isServer
          ? (response as any)?.data?.status?.toUpperCase()
          : (response as any)?.status?.toUpperCase();
        if (status === 'FAILED') {
          throw new Error('Job failed');
        }
        return status === 'SUCCESS';
      }),
      take(1)
    )
    .toPromise();
};

export const buildQueryStatusConfig = (response: any) => {
  return {
    queryId: response.data.queryId,
    sessionId: response.data.sessionId,
  } as QueryStatusConfig;
};
