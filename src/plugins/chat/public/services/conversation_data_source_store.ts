/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The data-source UI state tracked for a single conversation.
 */
export interface ConversationDataSourceState {
  // Data source ids that have appeared in the conversation.
  sessionDataSourceList: string[];
  // The user-confirmed conversation-level data source override.
  confirmedDataSourceId?: string;
}

/**
 * localStorage threadId-key-value store for per-conversation data source state.
 * It stores: the session data source list + confirmed data source
 *
 * since agentic memory provider's saveConversation is a no-op. use this to store and restore runtime state
 */
export class ConversationDataSourceStore {
  private readonly storageKey = 'chat.conversationDataSourceState';
  private readonly maxEntries = 50;

  private load(): Record<string, ConversationDataSourceState> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load conversation data source state from localStorage:', error);
      return {};
    }
  }

  private save(map: Record<string, ConversationDataSourceState>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(map));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save conversation data source state to localStorage:', error);
    }
  }

  public get(threadId: string): ConversationDataSourceState | undefined {
    if (!threadId) return undefined;
    return this.load()[threadId];
  }

  public set(threadId: string, state: ConversationDataSourceState): void {
    if (!threadId) return;
    const map = this.load();

    delete map[threadId];
    map[threadId] = {
      sessionDataSourceList: [...(state.sessionDataSourceList ?? [])],
      confirmedDataSourceId: state.confirmedDataSourceId,
    };

    const threadIds = Object.keys(map);
    if (threadIds.length > this.maxEntries) {
      for (const removed of threadIds.slice(0, threadIds.length - this.maxEntries)) {
        delete map[removed];
      }
    }

    this.save(map);
  }

  public delete(threadId: string): void {
    if (!threadId) return;
    const map = this.load();
    if (threadId in map) {
      delete map[threadId];
      this.save(map);
    }
  }
}
