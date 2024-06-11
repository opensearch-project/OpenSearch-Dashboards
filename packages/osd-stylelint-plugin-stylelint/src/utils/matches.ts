/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractRegex } from './extract_regex';

/**
 * Checks if a given value matches a specified pattern.
 *
 * @param matcher - The pattern to match against (can be a string or regex).
 * @param value - The value to check for a match.
 * @returns {boolean} - A boolean indicating whether the value matches the pattern.
 */
export const matches = (matcher: string, value: string) => {
  const regex = extractRegex(matcher);
  if (!regex) {
    return value === matcher;
  }

  return regex.test(value);
};
