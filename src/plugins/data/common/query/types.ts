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

import { Dataset } from '../types';

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

export * from './timefilter/types';

// eslint-disable-next-line
export type Query = {
  query: string | { [key: string]: any };
  language: string;
  dataset?: Dataset;
  profile?: boolean;
  /** Ask the engine to return a partial result over the aggregatable indices on a mapping conflict. */
  partial_result?: boolean;
  /**
   * Absolute bounds of the time filter appended to the query, so the engine can skip indices that
   * cannot hold data in that range. A hint only: the filter itself still travels in the query text,
   * so results are unchanged whether or not the engine acts on it.
   */
  time_range?: TimeRangeHint;
};

/**
 * Inclusive bounds of a time filter, as UTC wall clock in `YYYY-MM-DD HH:mm:ss.SSS` with no zone
 * designator -- the same literals the filter itself carries, so an engine reading these interprets
 * them exactly as it interprets the filter.
 */
export interface TimeRangeHint {
  /** Time field the bounds apply to, as configured on the dataset. */
  field: string;
  from: string;
  to: string;
}
