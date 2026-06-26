/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  validateWorkspaceColor,
  getInvalidWorkspacePermissions,
  getInvalidWorkspacePermissionsError,
  normalizeWorkspacePermissions,
} from '../utils';

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

describe('getInvalidWorkspacePermissions', () => {
  it('should return an empty array when permissions are undefined or empty', () => {
    expect(getInvalidWorkspacePermissions()).toEqual([]);
    expect(getInvalidWorkspacePermissions({})).toEqual([]);
  });

  it('should accept a valid read only collaborator (library_read + read)', () => {
    expect(
      getInvalidWorkspacePermissions({
        library_read: { groups: ['obs-users'] },
        read: { groups: ['obs-users'] },
      })
    ).toEqual([]);
  });

  it('should accept a valid read and write collaborator (library_write + read)', () => {
    expect(
      getInvalidWorkspacePermissions({
        library_write: { users: ['user-1'] },
        read: { users: ['user-1'] },
      })
    ).toEqual([]);
  });

  it('should accept a valid admin collaborator (library_write + write)', () => {
    expect(
      getInvalidWorkspacePermissions({
        library_write: { groups: ['obs-admins'] },
        write: { groups: ['obs-admins'] },
      })
    ).toEqual([]);
  });

  it('should reject a group granted only "read" (missing library_read)', () => {
    expect(
      getInvalidWorkspacePermissions({
        read: { groups: ['obs-users'] },
      })
    ).toEqual([{ type: 'group', name: 'obs-users', modes: ['read'] }]);
  });

  it('should reject a group granted only "library_write" (missing read/write)', () => {
    expect(
      getInvalidWorkspacePermissions({
        library_write: { groups: ['obs-admins'] },
      })
    ).toEqual([{ type: 'group', name: 'obs-admins', modes: ['library_write'] }]);
  });

  it('should reproduce issue #11996: only the incomplete read-only group is rejected', () => {
    // payload that "creates nothing" in the bug report
    const invalid = getInvalidWorkspacePermissions({
      library_write: { groups: ['obs-admins'] },
      read: { groups: ['obs-users'] },
    });
    expect(invalid).toEqual(
      expect.arrayContaining([
        { type: 'group', name: 'obs-admins', modes: ['library_write'] },
        { type: 'group', name: 'obs-users', modes: ['read'] },
      ])
    );
    expect(invalid).toHaveLength(2);
  });

  it('should validate users and groups independently across modes', () => {
    expect(
      getInvalidWorkspacePermissions({
        library_read: { users: ['valid-user'], groups: ['invalid-group'] },
        read: { users: ['valid-user'] },
      })
    ).toEqual([{ type: 'group', name: 'invalid-group', modes: ['library_read'] }]);
  });
});

describe('getInvalidWorkspacePermissionsError', () => {
  it('should return undefined for valid permissions', () => {
    expect(
      getInvalidWorkspacePermissionsError({
        library_read: { groups: ['obs-users'] },
        read: { groups: ['obs-users'] },
      })
    ).toBeUndefined();
  });

  it('should return undefined when permissions are undefined', () => {
    expect(getInvalidWorkspacePermissionsError()).toBeUndefined();
  });

  it('should return a message naming each invalid principal with guidance', () => {
    const error = getInvalidWorkspacePermissionsError({
      library_write: { groups: ['obs-admins'] },
      read: { groups: ['obs-users'] },
    });
    expect(typeof error).toBe('string');
    expect(error).toContain('obs-admins');
    expect(error).toContain('obs-users');
    expect(error).toContain('Invalid workspace permissions');
    expect(error).toContain('["library_write", "write"] for admin');
  });
});

describe('normalizeWorkspacePermissions', () => {
  it('should return permissions unchanged when undefined', () => {
    expect(normalizeWorkspacePermissions()).toBeUndefined();
  });

  it('should leave a canonical read only collaborator unchanged', () => {
    expect(
      normalizeWorkspacePermissions({
        library_read: { groups: ['obs-users'] },
        read: { groups: ['obs-users'] },
      })
    ).toEqual({
      library_read: { groups: ['obs-users'] },
      read: { groups: ['obs-users'] },
    });
  });

  it('should collapse a principal granted all four modes to admin (library_write + write)', () => {
    expect(
      normalizeWorkspacePermissions({
        library_write: { users: ['admin'] },
        write: { users: ['admin'] },
        library_read: { users: ['admin'] },
        read: { users: ['admin'] },
      })
    ).toEqual({
      library_write: { users: ['admin'] },
      write: { users: ['admin'] },
    });
  });

  it('should collapse library_write + write + read to admin', () => {
    expect(
      normalizeWorkspacePermissions({
        library_write: { groups: ['obs-admins'] },
        write: { groups: ['obs-admins'] },
        read: { groups: ['obs-admins'] },
      })
    ).toEqual({
      library_write: { groups: ['obs-admins'] },
      write: { groups: ['obs-admins'] },
    });
  });

  it('should normalize each principal to its own highest access level', () => {
    expect(
      normalizeWorkspacePermissions({
        library_write: { users: ['admin'], groups: ['obs-rw'] },
        write: { users: ['admin'] },
        read: { users: ['admin'], groups: ['obs-rw'] },
        library_read: { groups: ['obs-ro'] },
      })
    ).toEqual({
      // admin -> admin
      write: { users: ['admin'] },
      library_write: { users: ['admin'], groups: ['obs-rw'] },
      // obs-rw -> read and write
      read: { groups: ['obs-rw'] },
      // obs-ro only has library_read -> no access level matches, preserved as-is
      library_read: { groups: ['obs-ro'] },
    });
  });
});
