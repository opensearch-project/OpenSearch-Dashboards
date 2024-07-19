/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PersistedLog } from '../../../core/public';
import { RECENT_WORKSPACES_KEY } from '../common/constants';

export interface WorkspaceEntry {
  id: string;
  timestamp: number;
}

export class RecentWorkspaceManager {
  private static instance: RecentWorkspaceManager;
  private recentWorkspaceLog: PersistedLog<WorkspaceEntry>;

  private constructor() {
    const customIsEqual = (oldItem: WorkspaceEntry, newItem: WorkspaceEntry) => {
      return oldItem.id === newItem.id;
    };
    this.recentWorkspaceLog = new PersistedLog<WorkspaceEntry>(RECENT_WORKSPACES_KEY, {
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

  public getRecentWorkspaces(): WorkspaceEntry[] {
    return this.recentWorkspaceLog.get();
  }

  public addRecentWorkspace(newWorkspace: string): WorkspaceEntry[] {
    const newEntry: WorkspaceEntry = {
      id: newWorkspace,
      timestamp: Date.now(),
    };
    this.recentWorkspaceLog.add(newEntry);
    return this.getRecentWorkspaces();
  }
}

// Export the singleton instance
export const recentWorkspaceManager = RecentWorkspaceManager.getInstance();
