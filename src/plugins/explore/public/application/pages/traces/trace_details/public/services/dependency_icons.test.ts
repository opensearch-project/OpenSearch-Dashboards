/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDependencyBrandIcon } from './dependency_icons';

describe('getDependencyBrandIcon', () => {
  it('returns a brand icon for known systems, case-insensitively', () => {
    ['postgresql', 'redis', 'mysql', 'mongodb'].forEach((system) => {
      expect(getDependencyBrandIcon(system)).toBeTruthy();
    });
    expect(getDependencyBrandIcon('PostgreSQL')).toBe(getDependencyBrandIcon('postgresql'));
  });

  it('reuses the compatible engine icon for forks', () => {
    expect(getDependencyBrandIcon('valkey')).toBe(getDependencyBrandIcon('redis'));
    expect(getDependencyBrandIcon('mariadb')).toBe(getDependencyBrandIcon('mysql'));
  });

  it('returns undefined for unknown or missing systems so callers use the category glyph', () => {
    expect(getDependencyBrandIcon('kafka')).toBeUndefined();
    expect(getDependencyBrandIcon('')).toBeUndefined();
    expect(getDependencyBrandIcon(undefined)).toBeUndefined();
  });
});
