/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isManagedObject, getManagedBy } from './is_managed';

describe('isManagedObject', () => {
  it('returns true for objects managed by osdctl', () => {
    expect(
      isManagedObject({ labels: { 'managed-by': 'osdctl' } })
    ).toBe(true);
  });

  it('returns true for objects managed by any tool', () => {
    expect(
      isManagedObject({ labels: { 'managed-by': 'terraform' } })
    ).toBe(true);
  });

  it('returns false when managed-by is absent', () => {
    expect(
      isManagedObject({ labels: { team: 'platform' } })
    ).toBe(false);
  });

  it('returns false when labels is absent', () => {
    expect(isManagedObject({ title: 'Test' })).toBe(false);
  });

  it('returns false for undefined attributes', () => {
    expect(isManagedObject(undefined)).toBe(false);
  });

  it('returns false for empty attributes', () => {
    expect(isManagedObject({})).toBe(false);
  });

  it('returns false when managed-by is empty string', () => {
    expect(
      isManagedObject({ labels: { 'managed-by': '' } })
    ).toBe(false);
  });
});

describe('getManagedBy', () => {
  it('returns the tool name when managed', () => {
    expect(
      getManagedBy({ labels: { 'managed-by': 'osdctl' } })
    ).toBe('osdctl');
  });

  it('returns undefined when not managed', () => {
    expect(getManagedBy({ title: 'Test' })).toBeUndefined();
  });

  it('returns undefined for undefined attributes', () => {
    expect(getManagedBy(undefined)).toBeUndefined();
  });
});
