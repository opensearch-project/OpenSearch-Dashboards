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

import { getDefaultDecoration } from '../../helpers/get_default_decoration';
import { getSplits } from '../../helpers/get_splits';
import { getLastMetric } from '../../helpers/get_last_metric';
import { mapBucket } from '../../helpers/map_bucket';
import { METRIC_TYPES } from '../../../../../common/metric_types';

/**
 * stdMetricRaw - Modified version of stdMetric for the raw endpoint
 *
 * This processor is identical to stdMetric except it appends the metric ID
 * to the series ID. This allows the client-side code to differentiate between
 * different metrics in the same series when evaluating math expressions.
 *
 * Example:
 *   Regular stdMetric: id = "series-1"
 *   stdMetricRaw: id = "series-1:count" or "series-1:avg-cpu"
 *
 * This format allows client-side process_math_series.js to find component
 * metrics by searching for series IDs matching the pattern "series-id:*"
 */
export function stdMetricRaw(resp, panel, series, meta) {
  return (next) => (results) => {
    const metric = getLastMetric(series);
    if (metric.type === METRIC_TYPES.STD_DEVIATION && metric.mode === 'band') {
      return next(results);
    }

    if ([METRIC_TYPES.PERCENTILE_RANK, METRIC_TYPES.PERCENTILE].includes(metric.type)) {
      return next(results);
    }
    if (/_bucket$/.test(metric.type)) return next(results);

    // For math metrics, we need to process all NON-math metrics as component metrics
    // instead of just processing the last metric
    if (metric.type === 'math') {
      const decoration = getDefaultDecoration(series);
      // Process each non-math metric in the series
      series.metrics.forEach((m) => {
        // Skip math, percentile, percentile_rank, sibling, and band metrics
        if (
          m.type === 'math' ||
          m.type === METRIC_TYPES.PERCENTILE ||
          m.type === METRIC_TYPES.PERCENTILE_RANK ||
          /_bucket$/.test(m.type) ||
          (m.type === METRIC_TYPES.STD_DEVIATION && m.mode === 'band')
        ) {
          return;
        }

        getSplits(resp, panel, series, meta).forEach((split) => {
          const data = split.timeseries.buckets.map(mapBucket(m));
          results.push({
            id: `${split.id}:${m.id}`,
            label: split.label,
            labelFormatted: split.labelFormatted,
            color: split.color,
            data,
            meta: split.meta,
            ...decoration,
          });
        });
      });
      return next(results);
    }

    // Regular processing for non-math metrics
    const decoration = getDefaultDecoration(series);
    getSplits(resp, panel, series, meta).forEach((split) => {
      const data = split.timeseries.buckets.map(mapBucket(metric));
      results.push({
        // MODIFIED: Append metric ID to series ID for client-side differentiation
        id: `${split.id}:${metric.id}`,
        label: split.label,
        labelFormatted: split.labelFormatted,
        color: split.color,
        data,
        meta: split.meta,
        ...decoration,
      });
    });
    return next(results);
  };
}
