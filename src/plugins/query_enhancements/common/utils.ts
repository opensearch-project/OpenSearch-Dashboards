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
import { API } from './constants';

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
  let errorMessage = response.data.body?.message ?? response.data.body ?? response.data;

  // Check if errorMessage is an object and handle Error objects
  if (typeof errorMessage === 'object') {
    if (errorMessage instanceof Error) {
      // If errorMessage is an instance of Error, extract its message
      errorMessage = errorMessage.message;
    } else if (errorMessage.message) {
      // If errorMessage has a message property, extract that message
      errorMessage = JSON.stringify(errorMessage.message);
    } else {
      // If errorMessage is a plain object, stringify it
      errorMessage = JSON.stringify(errorMessage);
    }
  }

  const error = new Error(errorMessage);
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
    http
      .fetch({
        method: 'POST',
        path,
        body,
        signal,
      })
      .catch(async (error) => {
        if (error.name === 'AbortError' && context.body?.pollQueryResultsParams?.queryId) {
          // Cancel job
          try {
            await http.fetch({
              method: 'DELETE',
              path: API.DATA_SOURCE.ASYNC_JOBS,
              query: {
                id: query.dataset?.dataSource?.id,
                queryId: context.body?.pollQueryResultsParams.queryId,
              },
            });
          } catch (cancelError) {
            // eslint-disable-next-line no-console
            console.error('Failed to cancel query:', cancelError);
          }
        }
        throw error;
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

/**
 * Test if a PPL query is using search command
 * https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/search.rst
 */
export const isPPLSearchQuery = (query: Query) => {
  if (query.language !== 'PPL') {
    return false;
  }

  if (typeof query.query !== 'string') {
    return false;
  }

  const string = query.query.toLowerCase().replace(/\s/g, '');

  return string.startsWith('source=') || string.startsWith('searchsource=');
};
