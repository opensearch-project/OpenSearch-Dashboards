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

import { PollQueryResultsHandler, FetchStatusResponse } from '../data_frames';

export interface QueryStatusOptions {
  pollQueryResults: PollQueryResultsHandler;
  queryId?: string;
  interval?: number;
  /**
   * Called with every poll response that is not yet terminal (neither SUCCESS nor FAILED).
   * Sources that return rows while a query is still running put them on that response, so
   * this is how a caller renders results before the query completes.
   */
  onPollResponse?: (response: FetchStatusResponse) => void;
}

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Upper bound for a serialized error shown as a failed query's message. */
const MAX_FAILED_QUERY_MESSAGE_LENGTH = 1000;

/**
 * The message of a query a search strategy reported as failed (at start or while polling): the
 * error itself when it is a string, else its `message`, else the serialized error (truncated), so
 * an unknown error shape still reaches the user.
 */
export const getFailedQueryMessage = (error: unknown): string => {
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== '{}') {
        return serialized.length > MAX_FAILED_QUERY_MESSAGE_LENGTH
          ? `${serialized.slice(0, MAX_FAILED_QUERY_MESSAGE_LENGTH)}…`
          : serialized;
      }
    } catch {
      // Not serializable (e.g. circular): fall through to the generic message.
    }
  }
  return 'Query failed';
};

export const handleQueryResults = async <T>(
  options: QueryStatusOptions
): Promise<FetchStatusResponse> => {
  const { pollQueryResults, interval = 5000, onPollResponse } = options;
  let queryResultsRes: FetchStatusResponse;
  let queryStatus;
  do {
    // Wait for the given interval in ms before polling for the query status/results
    await delay(interval);
    queryResultsRes = await pollQueryResults();
    queryStatus = queryResultsRes?.status?.toUpperCase();
    if (onPollResponse && queryStatus !== 'SUCCESS' && queryStatus !== 'FAILED') {
      onPollResponse(queryResultsRes);
    }
  } while (queryStatus !== 'SUCCESS' && queryStatus !== 'FAILED');

  if (queryStatus === 'FAILED') {
    throw new Error(
      getFailedQueryMessage((queryResultsRes as { body?: { error?: unknown } })?.body?.error)
    );
  }

  return queryResultsRes;
};
