/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SavedObjectPermissions } from '../../../core/types';
import { WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES } from './constants';

// Reference https://github.com/opensearch-project/oui/blob/main/src/services/color/is_valid_hex.ts
export const validateWorkspaceColor = (color?: string) =>
  !!color && /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color);

export const validateIsWorkspaceDataSourceAndConnectionObjectType = (type: string) =>
  WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES.includes(type);

export const WORKSPACE_ACCESS_LEVEL_MODES: string[][] = [
  ['library_write', 'write'],
  ['library_write', 'read'],
  ['library_read', 'read'],
];

export interface InvalidWorkspacePermissionPrincipal {
  type: 'user' | 'group';
  name: string;
  modes: string[];
}

/**
 * Flatten a workspace `permissions` object (keyed by permission mode) into the
 * set of permission modes granted to each principal, keyed by principal. Users
 * and groups are tracked separately because a user and a group can share a name.
 */
const collectPrincipalModes = (permissions: SavedObjectPermissions) => {
  const userModes: { [user: string]: Set<string> } = {};
  const groupModes: { [group: string]: Set<string> } = {};

  Object.keys(permissions).forEach((mode) => {
    const principals = permissions[mode];
    principals?.users?.forEach((user) => {
      (userModes[user] = userModes[user] ?? new Set<string>()).add(mode);
    });
    principals?.groups?.forEach((group) => {
      (groupModes[group] = groupModes[group] ?? new Set<string>()).add(mode);
    });
  });

  return { userModes, groupModes };
};

/**
 * Validate that every principal in a workspace `permissions` object forms a
 * recognized collaborator access level.
 */
export const getInvalidWorkspacePermissions = (
  permissions?: SavedObjectPermissions
): InvalidWorkspacePermissionPrincipal[] => {
  if (!permissions) {
    return [];
  }

  const { userModes, groupModes } = collectPrincipalModes(permissions);

  const isValidCombination = (modes: Set<string>) =>
    WORKSPACE_ACCESS_LEVEL_MODES.some((requiredModes) =>
      requiredModes.every((requiredMode) => modes.has(requiredMode))
    );

  const invalidPrincipals: InvalidWorkspacePermissionPrincipal[] = [];

  Object.keys(userModes).forEach((user) => {
    if (!isValidCombination(userModes[user])) {
      invalidPrincipals.push({ type: 'user', name: user, modes: [...userModes[user]] });
    }
  });
  Object.keys(groupModes).forEach((group) => {
    if (!isValidCombination(groupModes[group])) {
      invalidPrincipals.push({ type: 'group', name: group, modes: [...groupModes[group]] });
    }
  });

  return invalidPrincipals;
};

/**
 * Build a single human-readable error message for any principal whose granted
 * permission modes do not form a recognized collaborator access level.
 */
export const getInvalidWorkspacePermissionsError = (
  permissions?: SavedObjectPermissions
): string | undefined => {
  const invalidPrincipals = getInvalidWorkspacePermissions(permissions);
  if (invalidPrincipals.length === 0) {
    return undefined;
  }
  const details = invalidPrincipals
    .map(({ type, name, modes }) => `${type} "${name}" ([${modes.join(', ')}])`)
    .join('; ');
  return (
    `Invalid workspace permissions for: ${details}. Each user or group must be granted one of ` +
    `the following permission mode combinations: ["library_read", "read"] for read only, ` +
    `["library_write", "read"] for read and write, or ["library_write", "write"] for admin.`
  );
};

/**
 * Normalize a workspace `permissions` object so that every principal is collapsed
 * to the single highest access level it qualifies.
 */
export const normalizeWorkspacePermissions = (
  permissions?: SavedObjectPermissions
): SavedObjectPermissions | undefined => {
  if (!permissions) {
    return permissions;
  }

  const { userModes, groupModes } = collectPrincipalModes(permissions);

  const resolveModes = (modes: Set<string>): string[] => {
    const matched = WORKSPACE_ACCESS_LEVEL_MODES.find((requiredModes) =>
      requiredModes.every((requiredMode) => modes.has(requiredMode))
    );
    return matched ?? [...modes];
  };

  const normalized: SavedObjectPermissions = {};
  const addPrincipal = (mode: string, key: 'users' | 'groups', name: string) => {
    const principals = normalized[mode] ?? (normalized[mode] = {});
    const list = principals[key] ?? (principals[key] = []);
    if (!list.includes(name)) {
      list.push(name);
    }
  };

  Object.keys(userModes).forEach((user) => {
    resolveModes(userModes[user]).forEach((mode) => addPrincipal(mode, 'users', user));
  });
  Object.keys(groupModes).forEach((group) => {
    resolveModes(groupModes[group]).forEach((mode) => addPrincipal(mode, 'groups', group));
  });

  return normalized;
};
