/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { recentWorkspaceManager } from '../../recent_workspace_manager';
import { getWorkspacesWithRecentMessage, sortByRecentVisitedAndAlphabetical } from './utils';

describe('getWorkspacesWithRecentMessage', () => {
  const workspaces = [
    { id: 'workspace1', name: 'Workspace 1' },
    { id: 'workspace2', name: 'Workspace 2' },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add visited message and timestamp for recent workspaces', () => {
    const recentWorkspaces = [{ id: 'workspace1', timestamp: Date.now() }];

    jest.spyOn(recentWorkspaceManager, 'getRecentWorkspaces').mockReturnValue(recentWorkspaces);

    const result = getWorkspacesWithRecentMessage(workspaces);
    expect(result).toEqual([
      {
        id: 'workspace1',
        name: 'Workspace 1',
        accessTimeStamp: recentWorkspaces[0].timestamp,
        visitedMessage: `Viewed a few seconds ago`,
      },
      {
        id: 'workspace2',
        name: 'Workspace 2',
        accessTimeStamp: undefined,
        visitedMessage: 'Not visited recently',
      },
    ]);
  });

  it('should add "Not visited recently" message for workspaces without recent activity', () => {
    // No recent workspaces in the mock return
    jest.spyOn(recentWorkspaceManager, 'getRecentWorkspaces').mockReturnValue([]);

    const result = getWorkspacesWithRecentMessage(workspaces);
    expect(result).toEqual([
      {
        id: 'workspace1',
        name: 'Workspace 1',
        accessTimeStamp: undefined,
        visitedMessage: 'Not visited recently',
      },
      {
        id: 'workspace2',
        name: 'Workspace 2',
        accessTimeStamp: undefined,
        visitedMessage: 'Not visited recently',
      },
    ]);
  });
});

describe('sortByRecentVisitedAndAlphabetical', () => {
  const recentTimestamp = moment().subtract(1, 'days').toDate().getTime();
  const olderTimestamp = moment().subtract(5, 'days').toDate().getTime();

  const workspace1 = { id: 'workspace1', name: 'Workspace 1', accessTimeStamp: recentTimestamp };
  const workspace2 = { id: 'workspace2', name: 'Workspace 2', accessTimeStamp: olderTimestamp };
  const workspace3 = { id: 'workspace3', name: 'Workspace 3', accessTimeStamp: undefined };
  const workspace4 = { id: 'workspace4', name: 'Workspace 4', accessTimeStamp: undefined };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort by accessTimeStamp in descending order', () => {
    const sorted = [workspace1, workspace2].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace1, workspace2]); // workspace1 has a more recent timestamp
  });

  it('should prioritize the workspace with accessTimeStamp over the one without', () => {
    let sorted = [workspace2, workspace3].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace2, workspace3]); // workspace2 has a timestamp, workspace3 does not

    sorted = [workspace3, workspace2].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace2, workspace3]); // workspace2 has a timestamp, workspace3 does not
  });

  it('should sort alphabetically by name if neither workspace has a timestamp', () => {
    const sorted = [workspace4, workspace3].sort(sortByRecentVisitedAndAlphabetical);
    expect(sorted).toEqual([workspace3, workspace4]); // Sorted alphabetically by name
  });
});
