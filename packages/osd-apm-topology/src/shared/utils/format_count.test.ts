/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatCount, formatRequestCount, MISSING_COUNT } from './format_count';

describe('formatCount', () => {
  it('abbreviates thousands and millions', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(5000)).toBe('5.0K');
    expect(formatCount(2500000)).toBe('2.5M');
    expect(formatCount(undefined)).toBe('0');
  });
});

describe('formatRequestCount', () => {
  it('shows a node without metrics as missing, not 0', () => {
    expect(formatRequestCount(undefined)).toBe(MISSING_COUNT);
    expect(formatRequestCount({ requests: 0 })).toBe('0');
    expect(formatRequestCount({ requests: 1200 })).toBe('1.2K');
  });
});
