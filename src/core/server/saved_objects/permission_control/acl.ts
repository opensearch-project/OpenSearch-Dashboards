/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrincipalType } from '../../../utils/constants';

export interface Principals {
  users?: string[];
  groups?: string[];
}

export type Permissions = Record<string, Principals>;

export interface TransformedPermission {
  type: string;
  name: string;
  permissions: string[];
}

const addToPrincipals = (principals?: Principals, users?: string[], groups?: string[]) => {
  if (!principals) {
    principals = {};
  }
  if (!!users) {
    if (!principals.users) {
      principals.users = [];
    }
    principals.users = Array.from(new Set([...principals.users, ...users]));
  }
  if (!!groups) {
    if (!principals.groups) {
      principals.groups = [];
    }
    principals.groups = Array.from(new Set([...principals.groups, ...groups]));
  }
  return principals;
};

const deleteFromPrincipals = (principals?: Principals, users?: string[], groups?: string[]) => {
  if (!principals) {
    return principals;
  }
  if (!!users && !!principals.users) {
    principals.users = principals.users.filter((item) => !users.includes(item));
  }
  if (!!groups && !!principals.groups) {
    principals.groups = principals.groups.filter((item) => !groups.includes(item));
  }
  return principals;
};

const checkPermission = (currentPrincipals: Principals | undefined, principals: Principals) => {
  return (
    (currentPrincipals?.users &&
      principals?.users &&
      checkPermissionForSinglePrincipalType(currentPrincipals.users, principals.users)) ||
    (currentPrincipals?.groups &&
      principals.groups &&
      checkPermissionForSinglePrincipalType(currentPrincipals.groups, principals.groups))
  );
};

const checkPermissionForSinglePrincipalType = (
  currentPrincipalArray: string[],
  principalArray: string[]
) => {
  return (
    currentPrincipalArray &&
    principalArray &&
    (currentPrincipalArray.includes('*') ||
      principalArray.some((item) => currentPrincipalArray.includes(item)))
  );
};

export class ACL {
  private permissions?: Permissions;
  constructor(initialPermissions?: Permissions) {
    this.permissions = initialPermissions || {};
  }

  // parse the permissions object to check whether the specific principal has the specific permission types or not
  public hasPermission(permissionTypes: string[], principals: Principals) {
    if (!permissionTypes || permissionTypes.length === 0 || !this.permissions || !principals) {
      return false;
    }

    const currentPermissions = this.permissions;
    return permissionTypes.some((permissionType) =>
      checkPermission(currentPermissions[permissionType], principals)
    );
  }

  // permissions object build function, add principal with specific permission to the object
  public addPermission(permissionTypes: string[], principals: Principals) {
    if (!permissionTypes || !principals) {
      return this;
    }
    if (!this.permissions) {
      this.permissions = {};
    }

    for (const permissionType of permissionTypes) {
      this.permissions[permissionType] = addToPrincipals(
        this.permissions[permissionType],
        principals.users,
        principals.groups
      );
    }

    return this;
  }

  // permissions object build function, remove specific permission of specific principal from the object
  public removePermission(permissionTypes: string[], principals: Principals) {
    if (!permissionTypes || !principals) {
      return this;
    }
    if (!this.permissions) {
      this.permissions = {};
    }

    for (const permissionType of permissionTypes) {
      const result = deleteFromPrincipals(
        this.permissions![permissionType],
        principals.users,
        principals.groups
      );
      if (result) {
        this.permissions[permissionType] = result;
      }
    }

    return this;
  }

  /**
   * transform permissions format
   * original permissions:   {
   *     read: {
   *         users:['user1']
   *     },
   *     write:{
   *         groups:['group1']
   *     }
   * }
   *
   * transformed permissions: [
   *     {type:'users',name:'user1',permissions:['read']},
   *     {type:'groups',name:'group1',permissions:['write']},
   * ]
   */
  public toFlatList(): TransformedPermission[] {
    const result: TransformedPermission[] = [];
    if (!this.permissions) {
      return result;
    }

    for (const permissionType in this.permissions) {
      if (Object.prototype.hasOwnProperty.call(this.permissions, permissionType)) {
        const { users = [], groups = [] } = this.permissions[permissionType] ?? {};
        users.forEach((user) => {
          const found = result.find((r) => r.type === PrincipalType.Users && r.name === user);
          if (found) {
            found.permissions.push(permissionType);
          } else {
            result.push({ type: PrincipalType.Users, name: user, permissions: [permissionType] });
          }
        });
        groups.forEach((group) => {
          const found = result.find((r) => r.type === PrincipalType.Groups && r.name === group);
          if (found) {
            found.permissions.push(permissionType);
          } else {
            result.push({ type: PrincipalType.Groups, name: group, permissions: [permissionType] });
          }
        });
      }
    }

    return result;
  }

  public resetPermissions() {
    // reset permissions
    this.permissions = {};
  }

  // return the permissions object
  public getPermissions() {
    return this.permissions;
  }

  /**
   * generate query DSL by the specific conditions, used for fetching saved objects from the saved objects index
   */
  public static genereateGetPermittedSavedObjectsQueryDSL(
    permissionTypes: string[],
    principals: Principals,
    savedObjectType?: string | string[]
  ) {
    if (!principals || !permissionTypes) {
      return {
        query: {
          match_none: {},
        },
      };
    }

    const bool: any = {
      filter: [],
    };
    const subBool: any = {
      should: [],
    };

    permissionTypes.forEach((permissionType) => {
      Object.entries(principals).forEach(([principalType, principalsInCurrentType]) => {
        subBool.should.push({
          terms: {
            ['permissions.' + permissionType + `.${principalType}`]: principalsInCurrentType,
          },
        });
        subBool.should.push({
          term: {
            ['permissions.' + permissionType + `.${principalType}`]: '*',
          },
        });
      });
    });

    bool.filter.push({
      bool: subBool,
    });

    if (!!savedObjectType) {
      bool.filter.push({
        terms: {
          type: Array.isArray(savedObjectType) ? savedObjectType : [savedObjectType],
        },
      });
    }

    return { query: { bool } };
  }
}
