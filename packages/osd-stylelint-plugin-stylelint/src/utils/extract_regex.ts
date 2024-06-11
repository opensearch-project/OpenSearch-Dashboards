/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts a regular expression from the provided string value.
 * @param value - The string value to extract the regular expression from.
 * @returns The extracted regular expression if the value is a valid regex, otherwise undefined.
 */
export const extractRegex = (value: string) => {
  if (!value.startsWith('/')) {
    return undefined;
  }

  const split = value.split('/');
  split.shift();

  const flags = split.pop();
  if (split.length === 0) {
    return undefined;
  }

  const pattern = split.join('/');

  return new RegExp(pattern, flags);
};
