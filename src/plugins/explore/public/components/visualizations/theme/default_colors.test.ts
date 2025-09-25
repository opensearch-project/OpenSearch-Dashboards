/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getColorGroups, resolveColor } from './default_colors';

describe('getColorGroups', () => {
  it('returns color groups', () => {
    const groups = getColorGroups();
    expect(groups).toHaveProperty('red');
    expect(groups).toHaveProperty('blue');
    expect(groups.red).toHaveProperty('red1');
  });
});

describe('resolveColor', () => {
  it('returns undefined for empty input', () => {
    expect(resolveColor()).toBeUndefined();
  });

  it('returns hex color', () => {
    expect(resolveColor('#FF0000')).toBe('#FF0000');
  });

  it('resolves color name from groups', () => {
    const result = resolveColor('red1');
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('returns original string for unknown colors', () => {
    expect(resolveColor('unknown')).toBe('unknown');
  });
});
