/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const EMPTY_VALUE_LABEL = '(empty)';

/**
 * Normalize empty/null/undefined values to a consistent label.
 * Used for series names, category labels, and grouping keys.
 */
export const normalizeEmptyValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return EMPTY_VALUE_LABEL;
  }
  return String(value);
};
