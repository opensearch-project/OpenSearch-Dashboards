/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateWorkspaceId } from './utils';

describe('validateWorkspaceId', () => {
  it('accepts IDs between 6 and 36 URL-safe characters', () => {
    expect(validateWorkspaceId('abc_12')).toBe(true);
    expect(validateWorkspaceId('a'.repeat(36))).toBe(true);
  });

  it('rejects IDs outside the supported format', () => {
    expect(validateWorkspaceId('abc')).toBe(false);
    expect(validateWorkspaceId('a'.repeat(37))).toBe(false);
    expect(validateWorkspaceId('invalid id')).toBe(false);
  });
});
