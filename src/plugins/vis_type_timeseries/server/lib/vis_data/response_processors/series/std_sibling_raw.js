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
import { getSiblingAggValue } from '../../helpers/get_sibling_agg_value';

/**
 * stdSiblingRaw - Modified version of stdSibling for the raw endpoint
 *
 * This processor is identical to stdSibling except it appends the metric ID
 * to the series ID for client-side differentiation, similar to stdMetricRaw.
 */
export function stdSiblingRaw(resp, panel, series, meta) {
  return (next) => (results) => {
    const metric = getLastMetric(series);

    if (!/_bucket$/.test(metric.type)) return next(results);
    if (metric.type === 'std_deviation_bucket' && metric.mode === 'band') return next(results);

    // For math metrics, we need to process all sibling aggregations as component metrics
    if (metric.type === 'math') {
      const decoration = getDefaultDecoration(series);
      // Process each sibling metric in the series
      series.metrics.forEach((m) => {
        // Only process sibling bucket metrics (not math, not bands)
        if (
          !/_bucket$/.test(m.type) ||
          m.type === 'math' ||
          (m.type === 'std_deviation_bucket' && m.mode === 'band')
        ) {
          return;
        }

        getSplits(resp, panel, series, meta).forEach((split) => {
          const data = split.timeseries.buckets.map((bucket) => {
            return [bucket.key, getSiblingAggValue(split, m)];
          });
          results.push({
            id: `${split.id}:${m.id}`,
            label: split.label,
            color: split.color,
            data,
            meta: split.meta,
            ...decoration,
          });
        });
      });
      return next(results);
    }

    // Regular processing for non-math sibling metrics
    const decoration = getDefaultDecoration(series);
    getSplits(resp, panel, series, meta).forEach((split) => {
      const data = split.timeseries.buckets.map((bucket) => {
        return [bucket.key, getSiblingAggValue(split, metric)];
      });
      results.push({
        // MODIFIED: Append metric ID to series ID for client-side differentiation
        id: `${split.id}:${metric.id}`,
        label: split.label,
        color: split.color,
        data,
        meta: split.meta,
        ...decoration,
      });
    });
    return next(results);
  };
}
