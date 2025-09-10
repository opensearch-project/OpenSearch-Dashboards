/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatPPLQuery, pplRangeFormatProvider, pplOnTypeFormatProvider } from './formatter';

describe('formatPPLQuery', () => {
  it('should format single pipe separated query', () => {
    const input = 'source=table1 | fields field1, field2';
    const expected = 'source=table1\n| fields field1, field2';
    expect(formatPPLQuery(input)).toBe(expected);
  });

  it('should format multiple pipe separated query', () => {
    const input = 'source=table1 | fields field1, field2 | where field1 > 10';
    const expected = 'source=table1\n| fields field1, field2\n| where field1 > 10';
    expect(formatPPLQuery(input)).toBe(expected);
  });

  it('should handle extra whitespace', () => {
    const input = 'source=table1    |    fields field1, field2   |   where field1 > 10';
    const expected = 'source=table1\n| fields field1, field2\n| where field1 > 10';
    expect(formatPPLQuery(input)).toBe(expected);
  });

  it('should handle query without pipes', () => {
    const input = 'source=table1';
    const expected = 'source=table1';
    expect(formatPPLQuery(input)).toBe(expected);
  });
});
