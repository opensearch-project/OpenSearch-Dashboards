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

import { seriesAgg } from './series_agg';
import { stdDeviationBands } from './std_deviation_bands';
import { stdDeviationSibling } from './std_deviation_sibling';
import { stdMetricRaw } from './std_metric_raw';
import { stdSiblingRaw } from './std_sibling_raw';
import { timeShift } from './time_shift';
import { dropLastBucket } from './drop_last_bucket';
// NOTE: mathAgg is intentionally NOT imported for raw data endpoint
// NOTE: Using stdMetricRaw and stdSiblingRaw instead of stdMetric/stdSibling
//       to append metric IDs to series IDs for client-side processing

export const processorsRaw = [
  percentile,
  percentileRank,
  stdDeviationBands,
  stdDeviationSibling,
  stdMetricRaw,
  stdSiblingRaw,
  // mathAgg, // EXCLUDED - client will handle math evaluation
  seriesAgg,
  timeShift,
  dropLastBucket,
];
