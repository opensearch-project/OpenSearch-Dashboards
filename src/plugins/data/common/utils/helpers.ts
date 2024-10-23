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
}

export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const handleQueryResults = async <T>(
  options: QueryStatusOptions
): Promise<FetchStatusResponse> => {
  const { pollQueryResults, interval = 5000 } = options;
  let queryResultsRes: FetchStatusResponse;
  let queryStatus;
  do {
    // Wait for the given interval in ms before polling for the query status/results
    await delay(interval);
    queryResultsRes = await pollQueryResults();
    queryStatus = queryResultsRes?.status?.toUpperCase();
  } while (queryStatus !== 'SUCCESS' && queryStatus !== 'FAILED');

  if (queryStatus === 'FAILED') {
    throw new Error(queryResultsRes?.body.error);
  }

  return queryResultsRes;
};
