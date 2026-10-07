/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISavedObjectsRepository } from '../service/lib/repository';
import { describeWorkspaceAclConformance } from './workspace_acl_conformance';

/**
 * A minimal in-memory repository that implements the workspace/ACL contract
 * correctly, used to demonstrate that the conformance suite is satisfiable and to
 * document the contract in executable form.
 *
 * Only `create`, `bulkCreate` and `find` are implemented -- the suite calls nothing
 * else. This is a test fixture, not a usable repository.
 */
interface Row {
  type: string;
  id: string;
  attributes: unknown;
  workspaces?: string[];
  permissions?: Record<string, Record<string, string[]>>;
}

const createReferenceRepository = (): ISavedObjectsRepository => {
  const rows: Row[] = [];

  /** True when the ACL grants any of `principals` any of `modes`, honouring '*'. */
  const aclGrants = (
    permissions: Row['permissions'],
    modes: string[],
    principals: Record<string, string[]>
  ) => {
    if (!permissions) return false;
    return modes.some((mode) =>
      Object.entries(principals).some(([principalType, ids]) => {
        const granted = permissions[mode]?.[principalType];
        if (!granted) return false;
        return granted.includes('*') || ids.some((id) => granted.includes(id));
      })
    );
  };

  const repo = {
    create: async (type: string, attributes: unknown, options: any = {}) => {
      const row: Row = {
        type,
        id: options.id,
        attributes,
        workspaces: options.workspaces,
        permissions: options.permissions,
      };
      rows.push(row);
      return { ...row, references: [] } as any;
    },

    bulkCreate: async (objects: any[], options: any = {}) => {
      for (const obj of objects) {
        const existing = rows.find((r) => r.type === obj.type && r.id === obj.id);
        if (existing && options.overwrite) {
          // Content is replaced; authorization state is not taken from the payload.
          existing.attributes = obj.attributes;
        } else if (!existing) {
          rows.push({
            type: obj.type,
            id: obj.id,
            attributes: obj.attributes,
            // Authorization input comes from the request, never from the object.
            workspaces: options.workspaces,
            permissions: options.permissions,
          });
        }
      }
      return { saved_objects: [] } as any;
    },

    find: async (options: any) => {
      const types = Array.isArray(options.type) ? options.type : [options.type];
      let candidates = rows.filter((r) => types.includes(r.type));

      const acl = options.ACLSearchParams;
      const aclActive = !!(acl?.permissionModes?.length && acl?.principals);
      const hasWorkspaces = options.workspaces !== undefined && options.workspaces !== null;

      if (aclActive || hasWorkspaces) {
        const matchesAcl = (r: Row) =>
          aclActive && aclGrants(r.permissions, acl.permissionModes, acl.principals);
        // An empty workspace list matches nothing -- never "no filter".
        const matchesWorkspace = (r: Row) =>
          hasWorkspaces && (r.workspaces ?? []).some((w) => options.workspaces.includes(w));

        if (options.workspacesSearchOperator === 'OR') {
          // Union: the workspace clause joins the ACL `should` array.
          candidates = candidates.filter((r) => matchesAcl(r) || matchesWorkspace(r));
        } else {
          // Intersection: each active clause is a separate filter.
          candidates = candidates.filter(
            (r) => (!aclActive || matchesAcl(r)) && (!hasWorkspaces || matchesWorkspace(r))
          );
        }
      }

      return {
        saved_objects: candidates.map((r) => ({ ...r, references: [], score: 0 })),
        total: candidates.length,
        page: 1,
        per_page: options.perPage ?? 20,
      } as any;
    },
  };

  return repo as unknown as ISavedObjectsRepository;
};

describeWorkspaceAclConformance({
  name: 'reference in-memory implementation',
  createRepository: createReferenceRepository,
});
