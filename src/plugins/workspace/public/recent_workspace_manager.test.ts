/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RecentWorkspaceManager } from './recent_workspace_manager';

describe('RecentWorkspaceManager', () => {
  let recentWorkspaceManager: RecentWorkspaceManager;

  beforeEach(() => {
    recentWorkspaceManager = RecentWorkspaceManager.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be a singleton', () => {
    const anotherInstance = RecentWorkspaceManager.getInstance();
    expect(recentWorkspaceManager).toBe(anotherInstance);
  });

  it('should add and get recent workspaces', () => {
    recentWorkspaceManager.addRecentWorkspace('workspace1');
    recentWorkspaceManager.addRecentWorkspace('workspace2');

    const recentWorkspaces = recentWorkspaceManager.getRecentWorkspaces();
    expect(recentWorkspaces.length).toEqual(2);
    expect(recentWorkspaces[0].id).toEqual('workspace2');
    expect(recentWorkspaces[1].id).toEqual('workspace1');
  });
});
