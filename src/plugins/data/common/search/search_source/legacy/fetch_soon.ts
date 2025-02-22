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

import { SearchResponse } from 'elasticsearch';
import { UI_SETTINGS } from '../../../constants';
import { FetchHandlers, SearchRequest } from '../fetch';
import { ISearchOptions } from '../../index';
import { callClient } from './call_client';

/**
 * This function introduces a slight delay in the request process to allow multiple requests to queue
 * up (e.g. when a dashboard is loading).
 */
export async function fetchSoon(
  request: SearchRequest,
  options: ISearchOptions,
  fetchHandlers: FetchHandlers
) {
  const msToDelay = fetchHandlers.getConfig(UI_SETTINGS.COURIER_BATCH_SEARCHES) ? 50 : 0;
  return delayedFetch(request, options, fetchHandlers, msToDelay);
}

/**
 * Delays executing a function for a given amount of time, and returns a promise that resolves
 * with the result.
 * @param fn The function to invoke
 * @param ms The number of milliseconds to wait
 * @return Promise<any> A promise that resolves with the result of executing the function
 */
function delay<T>(fn: (...args: any) => T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fn()), ms);
  });
}

// The current batch/queue of requests to fetch
const requestsToFetch: { [key: string]: SearchRequest[] } = {};
const requestOptions: { [key: string]: ISearchOptions[] } = {};

// The in-progress fetch (if there is one)
const fetchInProgress: { [key: string]: any } = {};

/**
 * Delay fetching for a given amount of time, while batching up the requests to be fetched.
 * Returns a promise that resolves with the response for the given request.
 * @param request The request to fetch
 * @param ms The number of milliseconds to wait (and batch requests)
 * @return Promise<SearchResponse> The response for the given request
 */
async function delayedFetch(
  request: SearchRequest,
  options: ISearchOptions,
  fetchHandlers: FetchHandlers,
  ms: number
): Promise<SearchResponse<any>> {
  if (ms === 0) {
    return callClient([request], [options], fetchHandlers)[0];
  }
  const { dataSourceId, ...restRequest } = request;
  const key = dataSourceId ?? '';

  const i = requestsToFetch[key]?.length ?? 0;
  /**
   * The internal msearch API accepts only one data source per request.
   * To search requests with different options across multiple data sources,
   * they need to be grouped by data source and processed separately.
   * After processing, the grouped arrays are cleared.
   */
  requestsToFetch[key] = [...(requestsToFetch[key] ?? []), restRequest];
  requestOptions[key] = [...(requestOptions[key] ?? []), options];

  // Note: the typescript here only worked because `SearchResponse` was `any`
  // Since this code is legacy, I'm leaving the any here.
  const responses: any[] = await (fetchInProgress[key] =
    fetchInProgress[key] ||
    delay(() => {
      const response = callClient(
        requestsToFetch[key],
        requestOptions[key],
        fetchHandlers,
        dataSourceId
      );
      delete requestsToFetch[key];
      delete requestOptions[key];
      delete fetchInProgress[key];
      return response;
    }, ms));
  return responses[i];
}
