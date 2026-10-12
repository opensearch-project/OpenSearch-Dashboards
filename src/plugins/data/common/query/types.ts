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
  /** @see TimeBounds */
  time_field?: string;
  /** @see TimeBounds */
  start_time?: string;
  /** @see TimeBounds */
  end_time?: string;
};

/**
 * Inclusive bounds of the time filter already written into the query text, reported alongside it as
 * `time_field` / `start_time` / `end_time` so an engine can skip indices outside the window.
 *
 * UTC wall clock in `YYYY-MM-DD HH:mm:ss.SSS` -- the same literals the filter carries, so the two
 * cannot describe different windows. A hint only: the filter still does the filtering.
 */
export interface TimeBounds {
  /** Time field the bounds constrain; the dataset's configured field, not necessarily `@timestamp`. */
  timeField: string;
  start: string;
  end: string;
}
