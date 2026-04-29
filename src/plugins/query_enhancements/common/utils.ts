/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from 'src/plugins/data/common';
import { from, timer } from 'rxjs';
import { filter, mergeMap, take, takeWhile } from 'rxjs/operators';
import { stringify } from '@osd/std';
import { DEFAULT_DATA, getHighlightRequest } from '../../data/common';
import {
  EnhancedFetchContext,
  QueryAggConfig,
  QueryStatusConfig,
  QueryStatusOptions,
} from './types';
import { API } from './constants';
import {
  OpenSearchErrorResponse,
  OpenSearchErrorContext,
  OpenSearchError,
} from '../../data/common';

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
    ('0' + date.getSeconds()).slice(-2) +
    '.' +
    ('00' + date.getMilliseconds()).slice(-3)
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

export interface EnhancedError extends Error {
  status: number;
  errorBody?: OpenSearchErrorResponse;
  errorContext?: {
    context?: OpenSearchErrorContext;
    code?: string;
    type?: string;
    location?: string[];
  };
}

export const throwFacetError = (response: any): never => {
  // Preserve the full error body for rich error context
  const errorBody: unknown = response.data.body ?? response.data;

  // Extract error details if they exist (OpenSearch enhanced error format)
  let errorMessage: string;
  let errorContext:
    | {
        context?: OpenSearchErrorContext;
        code?: string;
        type?: string;
        location?: string[];
      }
    | undefined;
  let typedErrorBody: OpenSearchErrorResponse | undefined;

  if (typeof errorBody === 'object' && errorBody !== null) {
    if (errorBody instanceof Error) {
      errorMessage = errorBody.message;
    } else if ('error' in errorBody && typeof errorBody.error === 'object' && errorBody.error) {
      // OpenSearch enhanced error format with error.details, error.context, etc.
      const errObj = errorBody.error as Partial<OpenSearchError>;
      errorMessage = errObj.details ?? errObj.reason ?? JSON.stringify(errObj);

      // Build typed error response
      if ('status' in errorBody && typeof errorBody.status === 'number') {
        typedErrorBody = errorBody as OpenSearchErrorResponse;
      }

      errorContext = {
        ...(errObj.context && { context: errObj.context }),
        ...(errObj.code && { code: errObj.code }),
        ...(errObj.type && { type: errObj.type }),
        ...(errObj.location && { location: errObj.location }),
      };
    } else if ('message' in errorBody && typeof errorBody.message === 'string') {
      errorMessage = errorBody.message;
    } else {
      errorMessage = JSON.stringify(errorBody);
    }
  } else {
    errorMessage = String(errorBody);
  }

  const error = new Error(errorMessage) as EnhancedError;
  error.name = response.data.status ?? response.status ?? response.data.statusCode;
  error.status = error.name;

  // Attach full error body for consumers that need rich context
  if (typedErrorBody) {
    error.errorBody = typedErrorBody;
  }

  // Attach structured context if available
  if (errorContext && Object.keys(errorContext).length > 0) {
    error.errorContext = errorContext;
  }

  throw error;
};

export const fetch = (context: EnhancedFetchContext, query: Query, aggConfig?: QueryAggConfig) => {
  const { http, path, signal } = context;
  // Only request highlight for dataset types backed by OpenSearch indices
  const datasetType = query.dataset?.type;
  const supportsHighlight =
    !datasetType ||
    datasetType === DEFAULT_DATA.SET_TYPES.INDEX_PATTERN ||
    datasetType === DEFAULT_DATA.SET_TYPES.INDEX;
  const highlight =
    isPPLSearchQuery(query) && supportsHighlight
      ? getHighlightRequest(query.query, true)
      : undefined;
  const body = stringify({
    query: { ...query, format: 'jdbc' },
    aggConfig,
    pollQueryResultsParams: context.body?.pollQueryResultsParams,
    timeRange: context.body?.timeRange,
    ...(highlight && { highlight }),
    ...(context.body?.queryId && { queryId: context.body.queryId }),
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
        if (error.name === 'AbortError') {
          if (context.body?.pollQueryResultsParams?.queryId) {
            // Cancel async job
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
              console.error('Failed to cancel async query:', cancelError);
            }
          } else if (context.body?.queryId) {
            // Fire-and-forget: notify backend to cancel the PPL task.
            // No need to await — the UI should move on immediately.
            http
              .fetch({
                method: 'POST',
                path: API.PPL_CANCEL,
                body: JSON.stringify({
                  queryId: context.body.queryId,
                  dataSourceId: query.dataset?.dataSource?.id,
                }),
              })
              .catch((cancelError) => {
                // eslint-disable-next-line no-console
                console.error('Failed to cancel PPL query:', cancelError);
              });
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
 * Detects whether a PPL query ends with a `head` command in the main query,
 * ignoring any trailing `| where ...` clauses (appended time-range filters)
 * and any `head` commands inside subquery brackets [...].
 */
export const queryEndsWithHead = (queryString: string): boolean => {
  const masked = queryString.replace(/\[.*?\]/g, (match) => '\0'.repeat(match.length));
  return /\|\s*head\b(\s+\d+)?(\s+from\s+\d+)?\s*(\|\s*where\b.*)?\s*$/i.test(masked);
};

/**
 * Test if a PPL query is using search command
 * https://github.com/opensearch-project/sql/blob/main/docs/user/ppl/cmd/search.md
 */
export const isPPLSearchQuery = (
  query: Query
): query is Omit<Query, 'query'> & { query: string } => {
  if (query.language !== 'PPL') {
    return false;
  }

  if (typeof query.query !== 'string') {
    return false;
  }

  const string = query.query.toLowerCase().replace(/\s/g, '');

  return string.startsWith('source=') || string.startsWith('searchsource=');
};
