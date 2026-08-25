/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedHit } from './types';
import { isSpanError, extractStatusCode } from '../ppl_resolve_helpers';
import { extractSpanDuration } from '../../utils/span_data_utils';

/** Client-side filter field for a minimum span duration (value in nanoseconds). */
export const DURATION_MIN_FILTER_FIELD = 'durationMin';

export const parseHits = (payloadData: string): ParsedHit[] => {
  try {
    const parsed = JSON.parse(payloadData);
    let hits: ParsedHit[] = [];

    if (parsed.hits && Array.isArray(parsed.hits.hits)) {
      hits = parsed.hits.hits;
    } else if (Array.isArray(parsed)) {
      hits = parsed;
    }

    return hits;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error processing payloadData:', error);
    return [];
  }
};

export const applySpanFilters = (
  spans: ParsedHit[],
  filters: Array<{ field: string; value: any; operator?: '=' | '!=' }>
): ParsedHit[] => {
  if (filters.length === 0) return spans;

  return spans.filter((span) => {
    return filters.every(({ field, value, operator }) => {
      if (field === 'isError' || field === 'status.code') {
        return isStatusMatch(span, field, value);
      }
      if (field === DURATION_MIN_FILTER_FIELD) {
        return extractSpanDuration(span) >= (value as number);
      }
      const spanValue = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], span)
        : span[field];
      // Coerce both sides to strings so a numeric field value (e.g. 200) still
      // matches a value coming from a text input, and honor the != operator.
      const matches = String(spanValue) === String(value);
      return operator === '!=' ? !matches : matches;
    });
  });
};

export const isStatusMatch = (span: ParsedHit, field: string, value: any): boolean => {
  if (field === 'isError' && value === true) {
    return isSpanError(span);
  }

  if (field === 'status.code') {
    // First check for error (status code 2)
    if (value === 2) {
      return isSpanError(span);
    }

    // Then check for OK (status code 1)
    if (value === 1) {
      return !isSpanError(span);
    }

    // Final check for Unset (status code 0)
    if (value === 0) {
      return extractStatusCode(span.status) === 0;
    }
  }

  return false;
};
