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
  /** @see TimeBounds */
  time_field?: string;
  /** @see TimeBounds */
  start_time?: string;
  /** @see TimeBounds */
  end_time?: string;
};

/**
 * Inclusive bounds of a time filter already written into the query text, reported alongside it as
 * `time_field` / `start_time` / `end_time` so the engine has the window before it resolves the
 * queried index pattern -- it merges the mapping of every index that pattern matches before it parses
 * the filter, and nothing after that can narrow it.
 *
 * Bounds are UTC wall clock in `YYYY-MM-DD HH:mm:ss.SSS` with no zone designator, the same literals
 * the filter itself carries. The engine also accepts date math and ISO-8601 here, but sending the
 * clause's own literals is what guarantees the two describe the same window: a relative range
 * resolves to a different instant on every parse.
 *
 * Purely a hint -- the filter in the query text still does the filtering, so a request is answered
 * identically whether or not the engine acts on these.
 */
export interface TimeBounds {
  /** Time field the bounds constrain; the dataset's configured field, not necessarily `@timestamp`. */
  timeField: string;
  start: string;
  end: string;
}
