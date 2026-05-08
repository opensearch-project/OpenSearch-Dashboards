/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParsedHit } from './types';
import { isSpanError, extractStatusCode } from '../ppl_resolve_helpers';

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
  filters: Array<{ field: string; value: any }>
): ParsedHit[] => {
  if (filters.length === 0) return spans;

  return spans.filter((span) => {
    return filters.every(({ field, value }) => {
      if (field === 'isError' || field === 'status.code') {
        return isStatusMatch(span, field, value);
      }
      const spanValue = field.includes('.')
        ? field.split('.').reduce((obj, key) => obj?.[key], span)
        : span[field];
      return spanValue === value;
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
