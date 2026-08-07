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

import { percentile } from './percentile';
import { percentileRank } from './percentile_rank';
import { percentileRaw } from './percentile_raw';

import { seriesAgg } from './series_agg';
import { stdDeviationBands } from './std_deviation_bands';
import { stdDeviationSibling } from './std_deviation_sibling';
import { stdMetricRaw } from './std_metric_raw';
import { stdSiblingRaw } from './std_sibling_raw';
// math is evaluated in the browser (process_math_series.js); timeShift and
// dropLastBucket must run AFTER math, so they are applied client-side in
// post_process_raw_series.js. stdMetricRaw/stdSiblingRaw append metric ids to series
// ids for client-side math; percentileRaw emits percentile component series so math
// can reference percentile values (e.g. params.x where x = `${metricId}[95]`).

export const processorsRaw = [
  percentile,
  percentileRank,
  percentileRaw,
  stdDeviationBands,
  stdDeviationSibling,
  stdMetricRaw,
  stdSiblingRaw,
  seriesAgg,
  // mathAgg, timeShift, dropLastBucket are applied client-side (after math)
];
