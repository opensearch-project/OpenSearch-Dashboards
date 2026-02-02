/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationType } from '../../../types';
import { CalculationMethod, calculateValue } from '../../calculation';

/**
 * Aggregate values based on aggregation type
 * @param aggregationType - Type of aggregation to apply
 * @param values - Array of numeric values to aggregate
 * @returns Aggregated value or null if no values
 */
export const aggregateValues = (
  aggregationType?: AggregationType,
  values?: number[],
  calculateType?: CalculationMethod
) => {
  if (!values || values.length === 0) return null;

  if (calculateType) {
    return calculateValue(values, calculateType);
  }

  switch (aggregationType) {
    case AggregationType.SUM:
      return values.reduce((a, b) => a + b, 0);
    case AggregationType.MEAN:
      return values.reduce((a, b) => a + b, 0) / values.length;
    case AggregationType.MAX:
      return Math.max(...values);
    case AggregationType.MIN:
      return Math.min(...values);
    case AggregationType.COUNT:
      return values.length;
    case AggregationType.NONE:
    default:
      return values[0];
  }
};
