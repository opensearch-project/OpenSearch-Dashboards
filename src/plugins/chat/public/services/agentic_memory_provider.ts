/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedConversation,
  ConversationMemoryProvider,
  ConversationPaginationParams,
  PaginatedConversations,
  Message,
  Event,
  EventType,
  HttpSetup,
} from '../../../../core/public';

/**
 * Generate a unique message ID
 * Used when messages from agent memory don't have IDs
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

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
      // Call the agent with empty messages to retrieve conversation history via /api/chat/proxy
      // Use native fetch like AgUiAgent does for proper streaming support
      const response = await fetch('/api/chat/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'osd-xsrf': 'true',
        },
        body: JSON.stringify({
          threadId,
          runId: `restore-${Date.now()}`,
          messages: [],
          tools: [],
          context: [],
          state: {},
          forwardedProps: {},
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let sseBuffer = '';
      let responseText = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Parse Server-Sent Events with proper buffering (same as AgUiAgent)
          const chunk = new TextDecoder().decode(value);
          const allData = sseBuffer + chunk;
          const lines = allData.split('\n');

          // Keep the last incomplete line in buffer
          sseBuffer = lines[lines.length - 1];
          const completeLines = lines.slice(0, -1);

          // Accumulate all complete lines for parsing
          responseText += completeLines.join('\n') + '\n';
        }
      } finally {
        reader.releaseLock();
      }

      // Parse the streaming response to extract messages
      const events = this.parseStreamingResponse(responseText);

      if (events.length === 0) {
        return null;
      }

      return events;
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

  /**
   * Parse streaming SSE response into AG-UI events
   */
  private parseStreamingResponse(responseText: string): Event[] {
    const lines = responseText.split('\n');
    const events: Event[] = [];
    const messages: Message[] = [];

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }

      try {
        const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix

        if (data.type === 'RUN_STARTED') {
          events.push({
            type: EventType.RUN_STARTED,
            threadId: data.threadId,
            runId: data.runId,
            timestamp: data.timestamp,
          });
        } else if (data.type === 'MESSAGES_SNAPSHOT') {
          // Store messages for later use, ensuring each has an ID
          const messagesWithIds = data.messages.map((msg: Message) => ({
            ...msg,
            id: msg.id || generateMessageId(),
          }));
          messages.push(...messagesWithIds);
        } else if (data.type === 'RUN_FINISHED') {
          events.push({
            type: EventType.RUN_FINISHED,
            threadId: data.threadId,
            runId: data.runId,
            timestamp: data.timestamp,
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse event line:', line, error);
      }
    }

    // If we collected messages, add a MESSAGES_SNAPSHOT event
    if (messages.length > 0) {
      // Insert MESSAGES_SNAPSHOT between RUN_STARTED and RUN_FINISHED
      const runStartedIndex = events.findIndex((e) => e.type === EventType.RUN_STARTED);
      if (runStartedIndex >= 0) {
        events.splice(runStartedIndex + 1, 0, {
          type: EventType.MESSAGES_SNAPSHOT,
          messages,
          timestamp: Date.now(),
        });
      } else {
        // If no RUN_STARTED, add all required events
        const runId = `restore-${Date.now()}`;
        const timestamp = Date.now();
        events.unshift(
          {
            type: EventType.RUN_STARTED,
            threadId: 'restored',
            runId,
            timestamp,
          },
          {
            type: EventType.MESSAGES_SNAPSHOT,
            messages,
            timestamp,
          },
          {
            type: EventType.RUN_FINISHED,
            threadId: 'restored',
            runId,
            timestamp,
          }
        );
      }
    }

    return events;
  }
}
