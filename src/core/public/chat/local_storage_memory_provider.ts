/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedConversation,
  ConversationMemoryProvider,
  ConversationPaginationParams,
  PaginatedConversations,
} from './types';
import { Event, EventType } from './events';

/**
 * LocalStorage-based conversation memory provider
 * Stores conversations in browser localStorage
 */
export class LocalStorageMemoryProvider implements ConversationMemoryProvider {
  private readonly STORAGE_KEY = 'chat.conversationHistory';
  private readonly MAX_CONVERSATIONS = 50;

  /**
   * If true, sends all messages to agent. If false, sends only the latest user message.
   * Set to false when messages are already in agent memory and only the latest user input is needed.
   */
  public includeFullHistory: boolean = true;

  /**
   * Load all conversations from localStorage
   */
  private loadConversations(): SavedConversation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load conversation history from localStorage:', error);
      return [];
    }
  }

  /**
   * Save all conversations to localStorage
   *
   * Silently fails with console warning if storage quota exceeded or unavailable.
   * This is intentional - conversation history is a "nice to have" feature, and we
   * don't want to disrupt the user experience if localStorage fails.
   *
   * @param conversations - Array of conversations to store
   */
  private storeConversations(conversations: SavedConversation[]): void {
    try {
      // Keep only the most recent MAX_CONVERSATIONS
      const trimmed = conversations.slice(0, this.MAX_CONVERSATIONS);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save conversation history to localStorage:', error);
    }
  }

  public async saveConversation(conversation: SavedConversation): Promise<void> {
    const conversations = this.loadConversations();
    const existingIndex = conversations.findIndex(
      (conv) => conv.threadId === conversation.threadId
    );

    if (existingIndex >= 0) {
      // Update existing conversation
      conversations[existingIndex] = conversation;
    } else {
      // Add new conversation at the beginning
      conversations.unshift(conversation);
    }

    this.storeConversations(conversations);
  }

  public async getConversations(
    params: ConversationPaginationParams
  ): Promise<PaginatedConversations> {
    const allConversations = this.loadConversations();
    const { page, pageSize } = params;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;

    const conversations = allConversations.slice(startIndex, endIndex);
    const hasMore = endIndex < allConversations.length;
    const total = allConversations.length;

    return {
      conversations,
      hasMore,
      total,
    };
  }

  public async getConversation(threadId: string): Promise<Event[] | null> {
    const conversations = this.loadConversations();
    const conversation = conversations.find((conv) => conv.threadId === threadId);

    if (!conversation) {
      return null;
    }

    // Return AG-UI event sequence for proper state restoration
    // Follows standard AG-UI protocol: RUN_STARTED -> MESSAGES_SNAPSHOT -> RUN_FINISHED
    const runId = `restore-${Date.now()}`;
    const timestamp = Date.now();

    return [
      {
        type: EventType.RUN_STARTED,
        threadId,
        runId,
        timestamp,
      },
      {
        type: EventType.MESSAGES_SNAPSHOT,
        messages: conversation.messages,
        timestamp,
      },
      {
        type: EventType.RUN_FINISHED,
        threadId,
        runId,
        timestamp,
      },
    ];
  }

  public async deleteConversation(threadId: string): Promise<void> {
    const conversations = this.loadConversations();
    const filtered = conversations.filter((conv) => conv.threadId !== threadId);
    this.storeConversations(filtered);
  }
}
