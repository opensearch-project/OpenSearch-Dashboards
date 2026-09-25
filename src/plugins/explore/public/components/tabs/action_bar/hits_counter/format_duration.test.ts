/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDuration } from './format_duration';

describe('formatDuration', () => {
  it.each([
    [0, '0 ms'],
    [1, '1 ms'],
    [66, '66 ms'],
    [847, '847 ms'],
    [999, '999 ms'],
    [12.4, '12 ms'],
  ])('shows %p as milliseconds: %p', (elapsedMs, expected) => {
    expect(formatDuration(elapsedMs)).toBe(expected);
  });

  it.each([
    [1000, '1.000 s'],
    [1298, '1.298 s'],
    [42282, '42.282 s'],
    [65400, '65.400 s'],
    [3723456, '3,723.456 s'],
  ])('shows %p as seconds to the millisecond: %p', (elapsedMs, expected) => {
    expect(formatDuration(elapsedMs)).toBe(expected);
  });

  it('switches unit on the rounded value, so it never shows 1,000 ms', () => {
    expect(formatDuration(999.4)).toBe('999 ms');
    expect(formatDuration(999.6)).toBe('1.000 s');
  });

  it.each([undefined, NaN, Infinity, -1])('shows nothing for %p', (elapsedMs) => {
    expect(formatDuration(elapsedMs)).toBe('');
  });
});
