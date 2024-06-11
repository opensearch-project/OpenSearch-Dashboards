/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Principals, Permissions, ACL } from './acl';

describe('acl', () => {
  it('test has permission', () => {
    const principals: Principals = {
      users: ['user1'],
      groups: [],
    };
    const permissions: Permissions = {
      read: principals,
    };
    const acl = new ACL(permissions);
    expect(
      acl.hasPermission(['read'], {
        users: ['user1'],
        groups: [],
      })
    ).toEqual(true);

    expect(
      acl.hasPermission(['read'], {
        users: ['user2'],
        groups: [],
      })
    ).toEqual(false);

    expect(
      acl.hasPermission([], {
        users: ['user2'],
        groups: [],
      })
    ).toEqual(false);

    const nullValue: unknown = undefined;
    expect(acl.hasPermission(['read'], nullValue as Principals)).toEqual(false);
    expect(acl.hasPermission(['read'], {})).toEqual(false);

    acl.resetPermissions();
    expect(acl.hasPermission(['read'], nullValue as Principals)).toEqual(false);
    expect(acl.hasPermission(['read'], {})).toEqual(false);
    expect(acl.hasPermission(['read'], principals)).toEqual(false);
  });

  it('test add permission', () => {
    const acl = new ACL();
    let result = acl
      .addPermission(['read'], {
        users: ['user1'],
        groups: [],
      })
      .getPermissions();
    expect(result?.read?.users).toEqual(['user1']);

    acl.resetPermissions();
    result = acl
      .addPermission(['write', 'library_write'], {
        users: ['user2'],
        groups: ['group1', 'group2'],
      })
      .getPermissions();
    expect(result?.write?.users).toEqual(['user2']);
    expect(result?.library_write?.groups).toEqual(['group1', 'group2']);

    acl.resetPermissions();
    result = acl
      .addPermission(['write', 'library_write'], {
        users: ['user2'],
      })
      .addPermission(['write', 'library_write'], {
        groups: ['group1'],
      })
      .getPermissions();
    expect(result?.write?.users).toEqual(['user2']);
    expect(result?.write?.groups).toEqual(['group1']);
    expect(result?.library_write?.users).toEqual(['user2']);
    expect(result?.library_write?.groups).toEqual(['group1']);

    acl.resetPermissions();
    const nullValue: unknown = undefined;
    result = acl.addPermission([], nullValue as Principals).getPermissions();
    expect(result).toEqual({});

    acl.resetPermissions();
    result = acl.addPermission(nullValue as string[], {} as Principals).getPermissions();
    expect(result).toEqual({});
  });

  it('test remove permission', () => {
    let principals: Principals = {
      users: ['user1'],
      groups: ['group1', 'group2'],
    };
    let permissions = {
      read: principals,
      write: principals,
    };
    let acl = new ACL(permissions);
    let result = acl
      .removePermission(['read'], {
        users: ['user1'],
      })
      .removePermission(['write'], {
        groups: ['group2'],
      })
      .removePermission(['write'], {
        users: ['user3'],
        groups: ['group3'],
      })
      .removePermission(['library_write'], {
        users: ['user1'],
        groups: ['group1'],
      })
      .getPermissions();
    expect(result?.read?.users).toEqual([]);
    expect(result?.write?.groups).toEqual(['group1']);

    principals = {
      users: ['*'],
      groups: ['*'],
    };
    permissions = {
      read: principals,
      write: principals,
    };
    acl = new ACL(permissions);
    result = acl
      .removePermission(['read', 'write'], {
        users: ['user1'],
        groups: ['group1'],
      })
      .getPermissions();
    expect(result?.read?.users).toEqual(['*']);
    expect(result?.write?.groups).toEqual(['*']);

    acl.resetPermissions();
    const nullValue: unknown = undefined;
    result = acl.removePermission([], nullValue as Principals).getPermissions();
    expect(result).toEqual({});

    acl.resetPermissions();
    result = acl.removePermission(nullValue as string[], principals).getPermissions();
    expect(result).toEqual({});
  });

  it('test toFlatList', () => {
    let principals: Principals = {
      users: ['user1'],
      groups: ['group1', 'group2'],
    };
    let permissions = {
      read: principals,
      write: principals,
    };
    let acl = new ACL(permissions);
    let result = acl.toFlatList();
    expect(result).toHaveLength(3);
    expect(result).toEqual(
      expect.arrayContaining([{ type: 'users', name: 'user1', permissions: ['read', 'write'] }])
    );
    expect(result).toEqual(
      expect.arrayContaining([{ type: 'groups', name: 'group1', permissions: ['read', 'write'] }])
    );
    expect(result).toEqual(
      expect.arrayContaining([{ type: 'groups', name: 'group2', permissions: ['read', 'write'] }])
    );

    acl.resetPermissions();
    principals = {
      users: ['user1'],
    };
    permissions = {
      read: principals,
      write: principals,
    };
    acl = new ACL(permissions);
    result = acl.toFlatList();
    expect(result).toHaveLength(1);
    expect(result).toEqual(
      expect.arrayContaining([{ type: 'users', name: 'user1', permissions: ['read', 'write'] }])
    );

    acl.resetPermissions();
    principals = {
      groups: ['group1', 'group2'],
    };
    permissions = {
      read: principals,
      write: principals,
    };
    acl = new ACL(permissions);
    result = acl.toFlatList();
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([{ type: 'groups', name: 'group1', permissions: ['read', 'write'] }])
    );
    expect(result).toEqual(
      expect.arrayContaining([{ type: 'groups', name: 'group2', permissions: ['read', 'write'] }])
    );
  });

  it('test generate query DSL', () => {
    const nullValue: unknown = undefined;
    let result = ACL.generateGetPermittedSavedObjectsQueryDSL(['read'], nullValue as Principals);
    expect(result).toEqual({
      query: {
        match_none: {},
      },
    });

    const principals = {
      users: ['user1'],
      groups: ['group1'],
    };

    result = ACL.generateGetPermittedSavedObjectsQueryDSL(nullValue as string[], principals);
    expect(result).toEqual({
      query: {
        match_none: {},
      },
    });

    result = ACL.generateGetPermittedSavedObjectsQueryDSL(['read'], principals, 'workspace');
    expect(result).toEqual({
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  {
                    terms: {
                      'permissions.read.users': ['user1'],
                    },
                  },
                  {
                    term: {
                      'permissions.read.users': '*',
                    },
                  },
                  {
                    terms: {
                      'permissions.read.groups': ['group1'],
                    },
                  },
                  {
                    term: {
                      'permissions.read.groups': '*',
                    },
                  },
                ],
              },
            },
            {
              terms: {
                type: ['workspace'],
              },
            },
          ],
        },
      },
    });

    result = ACL.generateGetPermittedSavedObjectsQueryDSL(['read'], principals, [
      'workspace',
      'index-pattern',
    ]);
    expect(result).toEqual({
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  {
                    terms: {
                      'permissions.read.users': ['user1'],
                    },
                  },
                  {
                    term: {
                      'permissions.read.users': '*',
                    },
                  },
                  {
                    terms: {
                      'permissions.read.groups': ['group1'],
                    },
                  },
                  {
                    term: {
                      'permissions.read.groups': '*',
                    },
                  },
                ],
              },
            },
            {
              terms: {
                type: ['workspace', 'index-pattern'],
              },
            },
          ],
        },
      },
    });

    result = ACL.generateGetPermittedSavedObjectsQueryDSL(['read'], principals);
    expect(result).toEqual({
      query: {
        bool: {
          filter: [
            {
              bool: {
                should: [
                  {
                    terms: {
                      'permissions.read.users': ['user1'],
                    },
                  },
                  {
                    term: {
                      'permissions.read.users': '*',
                    },
                  },
                  {
                    terms: {
                      'permissions.read.groups': ['group1'],
                    },
                  },
                  {
                    term: {
                      'permissions.read.groups': '*',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
  });
});
