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
