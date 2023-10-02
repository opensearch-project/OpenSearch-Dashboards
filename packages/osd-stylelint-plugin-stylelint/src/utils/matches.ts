/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { extractRegex } from './extract_regex';

export const matches = (matcher: string, value: string) => {
  const regex = extractRegex(matcher);
  if (!regex) {
    return value === matcher;
  }

  return regex.test(value);
};
