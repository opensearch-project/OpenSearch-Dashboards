/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedConversation,
  ConversationMemoryProvider,
  ConversationPaginationParams,
  PaginatedConversations,
  HttpSetup,
  Event,
} from '../../../../core/public';
import { AgUiAgent } from './ag_ui_agent';

/**
 * Agentic Memory Provider
 * Stores conversations using ML Commons Agent Memory APIs
 * Configuration (agentId and memoryContainerId) is managed server-side
 */
export class AgenticMemoryProvider implements ConversationMemoryProvider {
  /**
   * If true, sends all messages to agent. If false, sends only the latest user message.
   * Set to false since messages are already stored in agent memory.
   */
  public includeFullHistory: boolean = false;

  private readonly http: HttpSetup;

  constructor(http: HttpSetup) {
    this.http = http;
  }

  /**
   * Save conversation to agent memory
   * Note: For agentic memory, conversations are automatically saved by the agent,
   * so this method is a no-op. We keep it for interface compatibility.
   */
  public async saveConversation(conversation: SavedConversation): Promise<void> {
    // Agent automatically saves conversation state
    // This method is kept for interface compatibility but doesn't need to do anything
    return Promise.resolve();
  }

  /**
   * Get list of conversations from agent memory
   */
  public async getConversations(
    params: ConversationPaginationParams
  ): Promise<PaginatedConversations> {
    try {
      const { page, pageSize } = params;

      const response = await this.http.post<{
        hits: {
          total: { value: number };
          hits: Array<{
            _id: string;
            _source: {
              summary: string;
              created_time: number;
              last_updated_time: number;
              memory_container_id: string;
            };
          }>;
        };
      }>('/api/chat/memory/sessions/search', {
        body: JSON.stringify({
          query: {
            match_all: {},
          },
          from: page * pageSize,
          size: pageSize,
          sort: [{ last_updated_time: { order: 'desc' } }],
        }),
      });

      const total = response.hits.total.value;
      const conversations: SavedConversation[] = response.hits.hits.map(
        (hit: {
          _id: string;
          _source: {
            summary: string;
            created_time: number;
            last_updated_time: number;
            memory_container_id: string;
          };
        }) => ({
          id: hit._id,
          threadId: hit._id,
          name: hit._source.summary || 'Untitled Conversation',
          messages: [], // Messages will be loaded separately when needed
          createdAt: hit._source.created_time,
          updatedAt: hit._source.last_updated_time,
        })
      );

      return {
        conversations,
        hasMore: (page + 1) * pageSize < total,
        total,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load conversations from agent memory:', error);
      return {
        conversations: [],
        hasMore: false,
        total: 0,
      };
    }
  }

  /**
   * Get conversation messages from agent memory
   * Returns AG-UI event sequence for proper state restoration
   */
  public async getConversation(threadId: string) {
    try {
      // Use AgUiAgent to handle SSE streaming consistently
      const agent = new AgUiAgent();
      const collectedEvents: Event[] = [];

      // Collect all events from the agent run
      await new Promise<void>((resolve, reject) => {
        agent
          .runAgent({
            threadId,
            runId: `restore-${Date.now()}`,
            messages: [],
            tools: [],
            context: [],
            state: {},
            forwardedProps: {},
          })
          .subscribe({
            next: (event) => {
              // Collect all events as they arrive
              collectedEvents.push(event as Event);
            },
            complete: () => resolve(),
            error: (error) => reject(error),
          });
      });

      if (collectedEvents.length === 0) {
        return null;
      }

      return collectedEvents;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load conversation from agent memory:', error);
      return null;
    }
  }

  /**
   * Delete conversation from agent memory
   * Note: Currently not supported for agentic memory
   */
  public async deleteConversation(threadId: string): Promise<void> {
    // Deletion is not supported for agentic memory at this time
    // The agent manages its own memory lifecycle
    throw new Error('Conversation deletion is not supported for agentic memory');
  }
}
