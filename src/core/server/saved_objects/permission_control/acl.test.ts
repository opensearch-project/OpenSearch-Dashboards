/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PermissionMode } from '../../../../core/utils/constants';
import { Principals, Permissions, ACL } from './acl';

describe('SavedObjectTypeRegistry', () => {
  let acl: ACL;

  it('test has permission', () => {
    const principals: Principals = {
      users: ['user1'],
      groups: [],
    };
    const permissions: Permissions = {
      read: principals,
    };
    acl = new ACL(permissions);
    expect(
      acl.hasPermission([PermissionMode.Read], {
        users: ['user1'],
        groups: [],
      })
    ).toEqual(true);
    expect(
      acl.hasPermission([PermissionMode.Read], {
        users: ['user2'],
        groups: [],
      })
    ).toEqual(false);
  });

  it('test add permission', () => {
    acl = new ACL();
    const result1 = acl
      .addPermission([PermissionMode.Read], {
        users: ['user1'],
        groups: [],
      })
      .getPermissions();
    expect(result1?.read?.users).toEqual(['user1']);

    acl.resetPermissions();
    const result2 = acl
      .addPermission([PermissionMode.Write, PermissionMode.Management], {
        users: ['user2'],
        groups: ['group1', 'group2'],
      })
      .getPermissions();
    expect(result2?.write?.users).toEqual(['user2']);
    expect(result2?.management?.groups).toEqual(['group1', 'group2']);
  });

  it('test remove permission', () => {
    const principals1: Principals = {
      users: ['user1'],
      groups: ['group1', 'group2'],
    };
    const permissions1 = {
      read: principals1,
      write: principals1,
    };
    acl = new ACL(permissions1);
    const result1 = acl
      .removePermission([PermissionMode.Read], {
        users: ['user1'],
        groups: [],
      })
      .removePermission([PermissionMode.Write], {
        users: [],
        groups: ['group2'],
      })
      .getPermissions();
    expect(result1?.read?.users).toEqual([]);
    expect(result1?.write?.groups).toEqual(['group1']);

    const principals2: Principals = {
      users: ['*'],
      groups: ['*'],
    };

    const permissions2 = {
      read: principals2,
      write: principals2,
    };

    acl = new ACL(permissions2);
    const result2 = acl
      .removePermission([PermissionMode.Read, PermissionMode.Write], {
        users: ['user1'],
        groups: ['group1'],
      })
      .getPermissions();
    expect(result2?.read?.users).toEqual(['*']);
    expect(result2?.write?.groups).toEqual(['*']);
  });

  it('test transform permission', () => {
    const principals: Principals = {
      users: ['user1'],
      groups: ['group1', 'group2'],
    };
    const permissions = {
      read: principals,
      write: principals,
    };
    acl = new ACL(permissions);
    const result = acl.transformPermissions();
    expect(result?.length).toEqual(3);
  });

  it('test genereate query DSL', () => {
    const principals = {
      users: ['user1'],
      groups: ['group1'],
    };
    const result = ACL.genereateGetPermittedSavedObjectsQueryDSL(
      PermissionMode.Read,
      principals,
      'workspace'
    );
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
  });
});
