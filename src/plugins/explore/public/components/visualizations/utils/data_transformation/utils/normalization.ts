/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper function to normalize empty/null/undefined values
 * @param value - Value to normalize
 * @param defaultValue - Default value to use for empty values
 * @returns Normalized string value
 */
export const normalizeEmptyValue = (value: any, defaultValue: string = '-'): string => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value);
};
