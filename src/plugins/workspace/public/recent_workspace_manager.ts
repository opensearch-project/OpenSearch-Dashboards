/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersistedLog } from '../../../core/public';

const RECENT_WORKSPACES_KEY = 'recentWorkspaces';

class RecentWorkspaceManager {
  private static instance: RecentWorkspaceManager;
  private recentWorkspaceLog: PersistedLog<string>;

  private constructor() {
    const customIsEqual = (oldItem: string, newItem: string) => {
      return oldItem === newItem;
    };
    this.recentWorkspaceLog = new PersistedLog<string>(RECENT_WORKSPACES_KEY, {
      maxLength: 10,
      isEqual: customIsEqual,
    });
  }

  // Singleton pattern to ensure only one instance is used
  public static getInstance(): RecentWorkspaceManager {
    if (!RecentWorkspaceManager.instance) {
      RecentWorkspaceManager.instance = new RecentWorkspaceManager();
    }
    return RecentWorkspaceManager.instance;
  }

  public getRecentWorkspaces(): string[] {
    return this.recentWorkspaceLog.get();
  }

  public addRecentWorkspace(newWorkspace: string): string[] {
    this.recentWorkspaceLog.add(newWorkspace);
    return this.getRecentWorkspaces();
  }
}

// Export the singleton instance
export const recentWorkspaceManager = RecentWorkspaceManager.getInstance();
