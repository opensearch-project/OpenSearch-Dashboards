/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
