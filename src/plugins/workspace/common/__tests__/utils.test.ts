/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateWorkspaceColor } from '../utils';

describe('validateWorkspaceColor', () => {
  it('should return true for a valid 6-digit hex color code', () => {
    expect(validateWorkspaceColor('#ABCDEF')).toBe(true);
    expect(validateWorkspaceColor('#123456')).toBe(true);
  });

  it('should return true for a valid 3-digit hex color code', () => {
    expect(validateWorkspaceColor('#ABC')).toBe(true);
    expect(validateWorkspaceColor('#DEF')).toBe(true);
  });

  it('should return false for an invalid color code', () => {
    expect(validateWorkspaceColor('#GHI')).toBe(false);
    expect(validateWorkspaceColor('#12345')).toBe(false);
    expect(validateWorkspaceColor('#ABCDEFG')).toBe(false);
    expect(validateWorkspaceColor('ABCDEF')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(validateWorkspaceColor('')).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(validateWorkspaceColor()).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(validateWorkspaceColor('#abcdef')).toBe(true);
    expect(validateWorkspaceColor('#ABC')).toBe(true);
  });
});
