/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDefaultDecoration } from '../../helpers/get_default_decoration';
import { getSplits } from '../../helpers/get_splits';
import { getLastMetric } from '../../helpers/get_last_metric';
import { mapBucket } from '../../helpers/map_bucket';
import { METRIC_TYPES } from '../../../../../common/metric_types';

const PERCENTILE_VALUE_RE = /\[([0-9.]+)\]$/;

/**
 * Emits percentile component series for a math series so the browser can evaluate
 * math variables that reference percentile values.
 *
 * For each math variable of the form `${percentileMetricId}[${value}]`, emits a
 * component series id `${split.id}:${percentileMetricId}[${value}]` whose data is the
 * per-bucket Nth percentile. The math evaluator resolves variables by `variable.field`,
 * so the id suffix matches the field exactly. Non-math series are left untouched.
 */
export function percentileRaw(resp, panel, series, meta) {
  return (next) => (results) => {
    const lastMetric = getLastMetric(series);
    if (lastMetric.type !== 'math') {
      return next(results);
    }

    const mathMetric = lastMetric;
    const variables = mathMetric.variables || [];
    const decoration = getDefaultDecoration(series);

    series.metrics.forEach((metric) => {
      if (metric.type !== METRIC_TYPES.PERCENTILE) {
        return;
      }

      // Collect the distinct percentile values this math metric references for this
      // percentile metric, e.g. fields "p[50]" and "p[95]" -> ['50', '95'].
      const referencedValues = [
        ...new Set(
          variables
            .filter((v) => typeof v.field === 'string' && v.field.startsWith(metric.id))
            .map((v) => {
              const match = v.field.match(PERCENTILE_VALUE_RE);
              return match ? match[1] : null;
            })
            .filter((value) => value != null)
        ),
      ];

      referencedValues.forEach((value) => {
        getSplits(resp, panel, series, meta).forEach((split) => {
          const data = split.timeseries.buckets.map(mapBucket({ ...metric, percent: value }));
          results.push({
            id: `${split.id}:${metric.id}[${value}]`,
            label: split.label,
            labelFormatted: split.labelFormatted,
            color: split.color,
            data,
            meta: split.meta,
            ...decoration,
          });
        });
      });
    });

    return next(results);
  };
}
