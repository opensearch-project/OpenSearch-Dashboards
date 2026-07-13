/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceObject } from 'opensearch-dashboards/public';
import moment from 'moment';
import { recentWorkspaceManager } from '../../recent_workspace_manager';

export interface UpdatedWorkspaceObject extends WorkspaceObject {
  accessTimeStamp?: number;
  visitedMessage?: string;
}

export const getWorkspacesWithRecentMessage = (
  workspaces: WorkspaceObject[]
): UpdatedWorkspaceObject[] => {
  const recentWorkspaces = recentWorkspaceManager.getRecentWorkspaces();
  return workspaces.map((workspace) => {
    const recentWorkspace = recentWorkspaces.find((recent) => recent.id === workspace.id);

    return {
      ...workspace,
      accessTimeStamp: recentWorkspace?.timestamp,
      visitedMessage: recentWorkspace
        ? `Viewed ${moment(recentWorkspace.timestamp).fromNow()}`
        : `Not visited recently`,
    };
  });
};

export type WorkspaceRole = 'owner' | 'readwrite' | 'readonly';
export type WorkspaceRecency = 'all' | 'today' | 'week' | 'month';

export interface WorkspaceFilterCriteria {
  searchQuery: string;
  roles: WorkspaceRole[];
  recency: WorkspaceRecency;
}

export type WorkspaceRoleFilter = 'all' | WorkspaceRole;

export const buildWorkspaceFilterCriteria = ({
  searchQuery,
  roleFilter,
  recency,
}: {
  searchQuery: string;
  roleFilter: WorkspaceRoleFilter;
  recency: WorkspaceRecency;
}): WorkspaceFilterCriteria => ({
  searchQuery,
  roles: roleFilter === 'all' ? [] : [roleFilter],
  recency,
});

export const getWorkspaceRole = (workspace: WorkspaceObject): WorkspaceRole => {
  if (workspace.owner) {
    return 'owner';
  }
  if (workspace.readonly) {
    return 'readonly';
  }
  return 'readwrite';
};

export const getRecencyCutoff = (recency: WorkspaceRecency): number | null => {
  switch (recency) {
    case 'today':
      return moment().startOf('day').valueOf();
    case 'week':
      return moment().startOf('week').valueOf();
    case 'month':
      return moment().startOf('month').valueOf();
    default:
      return null;
  }
};

export const isWorkspaceFilterActive = ({
  searchQuery,
  roles,
  recency,
}: WorkspaceFilterCriteria): boolean =>
  !!searchQuery.trim() || roles.length > 0 || recency !== 'all';

export const filterWorkspaces = (
  workspaces: UpdatedWorkspaceObject[],
  { searchQuery, roles, recency }: WorkspaceFilterCriteria
): UpdatedWorkspaceObject[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const recencyCutoff = getRecencyCutoff(recency);
  return workspaces.filter((workspace) => {
    if (normalizedQuery && !workspace.name.toLowerCase().includes(normalizedQuery)) {
      return false;
    }
    if (roles.length > 0 && !roles.includes(getWorkspaceRole(workspace))) {
      return false;
    }
    if (
      recencyCutoff !== null &&
      (!workspace.accessTimeStamp || workspace.accessTimeStamp < recencyCutoff)
    ) {
      return false;
    }
    return true;
  });
};

export const sortByRecentVisitedAndAlphabetical = (
  ws1: UpdatedWorkspaceObject,
  ws2: UpdatedWorkspaceObject
) => {
  // First, sort by accessTimeStamp in descending order (if both have timestamps)
  if (ws1?.accessTimeStamp && ws2?.accessTimeStamp) {
    return ws2.accessTimeStamp - ws1.accessTimeStamp;
  }
  // If one has a timestamp and the other does not, prioritize the one with the timestamp
  if (ws1.accessTimeStamp) return -1;
  if (ws2.accessTimeStamp) return 1;
  // If neither has a timestamp, sort alphabetically by name
  return ws1.name.localeCompare(ws2.name);
};
