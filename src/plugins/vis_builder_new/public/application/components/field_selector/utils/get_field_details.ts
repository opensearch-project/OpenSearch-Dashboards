/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { IndexPattern, IndexPatternField } from '../../../../../../data/public';
import { FieldDetails } from '../types';

import { getFieldValueCounts } from './field_calculator';

export function getFieldDetails(
  field: IndexPatternField,
  hits: Array<Record<string, unknown>>,
  indexPattern?: IndexPattern
): FieldDetails {
  const defaultDetails = {
    error: '',
    exists: 0,
    total: 0,
    buckets: [],
  };
  if (!indexPattern) {
    return {
      ...defaultDetails,
      error: i18n.translate('visBuilder.fieldSelector.noIndexPatternSelectedErrorMessage', {
        defaultMessage: 'Index pattern not specified.',
      }),
    };
  }
  if (!hits.length) {
    return {
      ...defaultDetails,
      error: i18n.translate('visBuilder.fieldSelector.noHits', {
        defaultMessage:
          'No documents match the selected query and filters. Try increasing time range or removing filters.',
      }),
    };
  }
  const details = {
    ...defaultDetails,
    ...getFieldValueCounts({
      hits,
      field,
      indexPattern,
      count: 5,
      grouped: false,
    }),
  };
  if (details.buckets) {
    for (const bucket of details.buckets) {
      bucket.display = indexPattern.getFormatterForField(field).convert(bucket.value);
    }
  }
  return details;
}
