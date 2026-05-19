/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isManagedByCode, managedLockConflictMessage } from './managed_lock';

describe('isManagedByCode', () => {
  it('returns true when managed-by is osdctl', () => {
    expect(isManagedByCode({ labels: { 'managed-by': 'osdctl' } })).toBe(true);
  });

  it('returns false when managed-by is a different value', () => {
    expect(isManagedByCode({ labels: { 'managed-by': 'terraform' } })).toBe(false);
  });

  it('returns false when labels is absent', () => {
    expect(isManagedByCode({ title: 'Test' })).toBe(false);
  });

  it('returns false when attributes is empty', () => {
    expect(isManagedByCode({})).toBe(false);
  });

  it('returns false when labels has no managed-by key', () => {
    expect(isManagedByCode({ labels: { team: 'platform' } })).toBe(false);
  });
});

describe('managedLockConflictMessage', () => {
  it('returns a structured 409 error body', () => {
    const result = managedLockConflictMessage('dashboard', 'my-dash');
    expect(result.statusCode).toBe(409);
    expect(result.error).toBe('Conflict');
    expect(result.message).toContain('dashboard/my-dash');
    expect(result.message).toContain('managed by code');
    expect(result.message).toContain('_bulk_apply');
    expect(result.message).toContain('force=true');
  });
});
