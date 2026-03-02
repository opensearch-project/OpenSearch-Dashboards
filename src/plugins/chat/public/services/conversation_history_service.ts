/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { Message } from '../../common/types';
import {
  SavedConversation,
  ChatServiceStart,
  ConversationPaginationParams,
  PaginatedConversations,
  Event,
} from '../../../../core/public';

export type { SavedConversation } from '../../../../core/public';

/**
 * Service for managing conversation history
 * Uses the memory provider from core chat service
 */
export class ConversationHistoryService {
  private coreChatService: ChatServiceStart;

  constructor(coreChatService: ChatServiceStart) {
    this.coreChatService = coreChatService;
  }

  /**
   * Get the conversation name from the first user message
   */
  private getConversationName(messages: Message[]): string {
    // Find first user message that has text content
    for (const msg of messages) {
      if (msg.role !== 'user') continue;

      // Handle string content
      if (typeof msg.content === 'string' && msg.content.trim()) {
        // Truncate to first 50 characters
        return msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
      }

      // Handle array content - look for text content
      if (Array.isArray(msg.content)) {
        const textContent = msg.content.find((item) => item.type === 'text');
        if (textContent?.text && textContent.text.trim()) {
          const text = textContent.text;
          return text.length > 50 ? text.substring(0, 50) + '...' : text;
        }
      }
    }

    return i18n.translate('chat.conversationHistory.newConversationLabel', {
      defaultMessage: 'New conversation',
    });
  }

  /**
   * Get the memory provider from core chat service
   */
  public getMemoryProvider() {
    return this.coreChatService.getMemoryProvider();
  }

  /**
   * Save or update a conversation
   */
  public async saveConversation(threadId: string, messages: Message[]): Promise<void> {
    if (messages.length === 0) {
      // Don't save empty conversations
      return;
    }

    if (!this.getMemoryProvider().includeFullHistory) {
      // Don't need to manual save conversations
      return;
    }

    const provider = this.getMemoryProvider();
    // Get existing conversation events to preserve createdAt timestamp
    const existingEvents = await provider.getConversation(threadId);

    // Extract createdAt from first event's timestamp (RUN_STARTED event)
    // This preserves the original conversation creation time
    const existingCreatedAt = existingEvents?.[0]?.timestamp ?? null;

    const conversation: SavedConversation = {
      id: threadId,
      threadId,
      name: this.getConversationName(messages),
      messages,
      createdAt: existingCreatedAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    await provider.saveConversation(conversation);
  }

  /**
   * Get conversations with pagination
   */
  public async getConversations(
    params: ConversationPaginationParams
  ): Promise<PaginatedConversations> {
    const provider = this.getMemoryProvider();
    return await provider.getConversations(params);
  }

  /**
   * Get a specific conversation by thread ID
   * Returns AG-UI event array for proper state restoration
   */
  public async getConversation(threadId: string): Promise<Event[] | null> {
    const provider = this.getMemoryProvider();
    return await provider.getConversation(threadId);
  }

  /**
   * Delete a conversation by thread ID
   */
  public async deleteConversation(threadId: string): Promise<void> {
    const provider = this.getMemoryProvider();
    await provider.deleteConversation(threadId);
  }
}
