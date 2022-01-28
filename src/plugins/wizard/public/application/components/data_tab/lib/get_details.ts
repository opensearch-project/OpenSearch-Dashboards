/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-ignore
import { fieldCalculator } from './field_calculator';
import { IndexPattern, IndexPatternField } from '../../../../../../data/public';

export function getDetails(
  field: IndexPatternField,
  hits: Array<Record<string, unknown>>,
  columns: string[],
  indexPattern?: IndexPattern | null
) {
  if (!indexPattern) {
    return {};
  }
  const details = {
    ...fieldCalculator.getFieldValueCounts({
      hits,
      field,
      indexPattern,
      count: 5,
      grouped: false,
    }),
    columns,
  };
  if (details.buckets) {
    for (const bucket of details.buckets) {
      bucket.display = indexPattern.getFormatterForField(field).convert(bucket.value);
    }
  }
  return details;
}
