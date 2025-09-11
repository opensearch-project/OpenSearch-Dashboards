/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * OpenSearch Memory Service for Production
 * Uses OpenSearch indices for persistent memory storage
 */

import { CoreStart } from '../../../../core/public';
import { MemoryItem, MemorySession } from './simple_memory_service';

export class OpenSearchMemoryService {
  private currentSessionId: string;
  private currentChatHistory: MemoryItem[] = [];
  private readonly MEMORY_INDEX = 'ai_assistant_memories';
  private core: CoreStart;

  constructor(core: CoreStart) {
    this.core = core;
    this.currentSessionId = this.generateRandomSessionId();
    this.initializeIndex();
  }

  private generateRandomSessionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `session_${timestamp}_${random}`;
  }

  // Initialize OpenSearch index for memory storage
  private async initializeIndex(): Promise<void> {
    try {
      // Check if index exists
      const indexExists = await this.core.http.get(`/api/opensearch/${this.MEMORY_INDEX}/_exists`);

      if (!indexExists) {
        // Create index with proper mapping
        await this.core.http.put(`/api/opensearch/${this.MEMORY_INDEX}`, {
          body: {
            mappings: {
              properties: {
                sessionId: { type: 'keyword' },
                sessionName: { type: 'text' },
                memoryId: { type: 'keyword' },
                content: { type: 'text' },
                contentVector: { type: 'dense_vector', dims: 1536 }, // For future embedding search
                timestamp: { type: 'date' },
                context: { type: 'object' },
                type: { type: 'keyword' },
                createdAt: { type: 'date' },
              },
            },
          },
        });
        console.log(`💾 Created OpenSearch index: ${this.MEMORY_INDEX}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize OpenSearch memory index:', error);
    }
  }

  // Add to chat history (temporary, current session only)
  addToChatHistory(userQuery: string, assistantResponse: string, context: any): void {
    const timestamp = new Date().toISOString();

    this.currentChatHistory.push({
      id: `chat_${Date.now()}_user`,
      content: userQuery,
      timestamp,
      context,
      type: 'user_query',
    });

    this.currentChatHistory.push({
      id: `chat_${Date.now()}_assistant`,
      content: assistantResponse,
      timestamp,
      context,
      type: 'assistant_response',
    });

    console.log(`💬 Added to chat history (not saved to OpenSearch)`);
  }

  // Save current chat history to OpenSearch (only when user clicks save)
  async saveCurrentChatToMemory(): Promise<void> {
    if (this.currentChatHistory.length === 0) {
      console.log('💾 No chat history to save');
      return;
    }

    try {
      const bulkBody: any[] = [];

      this.currentChatHistory.forEach((item) => {
        // Index operation
        bulkBody.push({
          index: {
            _index: this.MEMORY_INDEX,
            _id: `${this.currentSessionId}_${item.id}`,
          },
        });

        // Document data
        bulkBody.push({
          sessionId: this.currentSessionId,
          memoryId: item.id,
          content: item.content,
          timestamp: item.timestamp,
          context: item.context,
          type: item.type,
          createdAt: new Date().toISOString(),
        });
      });

      // Bulk index to OpenSearch
      await this.core.http.post(`/api/opensearch/_bulk`, {
        body: bulkBody,
      });

      console.log(
        `💾 Saved ${this.currentChatHistory.length} chat items to OpenSearch index: ${this.MEMORY_INDEX}`
      );
    } catch (error) {
      console.error('❌ Failed to save memories to OpenSearch:', error);
      throw error;
    }
  }

  // List all memory sessions from OpenSearch
  async listAllMemories(): Promise<MemorySession[]> {
    try {
      const response = await this.core.http.post(`/api/opensearch/${this.MEMORY_INDEX}/_search`, {
        body: {
          size: 0,
          aggs: {
            sessions: {
              terms: {
                field: 'sessionId',
                size: 100,
              },
              aggs: {
                session_name: {
                  top_hits: {
                    size: 1,
                    _source: ['sessionName', 'createdAt'],
                  },
                },
                memory_count: {
                  value_count: {
                    field: 'memoryId',
                  },
                },
              },
            },
          },
        },
      });

      const sessions: MemorySession[] = [];

      response.aggregations?.sessions?.buckets?.forEach((bucket: any) => {
        const sessionData = bucket.session_name.hits.hits[0]._source;
        sessions.push({
          sessionId: bucket.key,
          name: sessionData.sessionName,
          memories: [], // Will be loaded separately when needed
          createdAt: sessionData.createdAt,
        });
      });

      return sessions;
    } catch (error) {
      console.error('❌ Failed to list memories from OpenSearch:', error);
      return [];
    }
  }

  // Search memories using OpenSearch full-text search
  async searchMemories(query: string, limit: number = 5): Promise<MemoryItem[]> {
    try {
      const searchBody = query.trim()
        ? {
            query: {
              multi_match: {
                query,
                fields: ['content^2', 'context'],
                type: 'best_fields',
              },
            },
            sort: [{ timestamp: { order: 'desc' } }],
            size: limit,
          }
        : {
            query: { match_all: {} },
            sort: [{ timestamp: { order: 'desc' } }],
            size: limit,
          };

      const response = await this.core.http.post(`/api/opensearch/${this.MEMORY_INDEX}/_search`, {
        body: searchBody,
      });

      const memories: MemoryItem[] =
        response.hits?.hits?.map((hit: any) => ({
          id: hit._source.memoryId,
          content: hit._source.content,
          timestamp: hit._source.timestamp,
          context: hit._source.context,
          type: hit._source.type,
        })) || [];

      console.log(`🔍 Found ${memories.length} memories for query: "${query}"`);
      return memories;
    } catch (error) {
      console.error('❌ Failed to search memories in OpenSearch:', error);
      return [];
    }
  }

  // Get current chat history (temporary, not saved)
  getCurrentChatHistory(): MemoryItem[] {
    return this.currentChatHistory;
  }

  // Get saved memories for current session from OpenSearch
  async getCurrentSessionMemories(): Promise<MemoryItem[]> {
    try {
      const response = await this.core.http.post(`/api/opensearch/${this.MEMORY_INDEX}/_search`, {
        body: {
          query: {
            term: { sessionId: this.currentSessionId },
          },
          sort: [{ timestamp: { order: 'asc' } }],
          size: 1000,
        },
      });

      return (
        response.hits?.hits?.map((hit: any) => ({
          id: hit._source.memoryId,
          content: hit._source.content,
          timestamp: hit._source.timestamp,
          context: hit._source.context,
          type: hit._source.type,
        })) || []
      );
    } catch (error) {
      console.error('❌ Failed to get session memories from OpenSearch:', error);
      return [];
    }
  }

  // Switch to different session
  async switchToSession(sessionId: string): Promise<boolean> {
    try {
      // Check if session exists
      const response = await this.core.http.post(`/api/opensearch/${this.MEMORY_INDEX}/_search`, {
        body: {
          query: { term: { sessionId } },
          size: 1,
        },
      });

      if (response.hits?.total?.value > 0) {
        this.currentChatHistory = [];
        this.currentSessionId = sessionId;
        console.log(`🔄 Switched to memory session: ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to switch session in OpenSearch:', error);
      return false;
    }
  }

  // Delete session from OpenSearch
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.core.http.post(`/api/opensearch/${this.MEMORY_INDEX}/_delete_by_query`, {
        body: {
          query: {
            term: { sessionId },
          },
        },
      });

      if (sessionId === this.currentSessionId) {
        this.currentSessionId = this.generateRandomSessionId();
      }

      console.log(`🗑️ Deleted session from OpenSearch: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete session from OpenSearch:', error);
      return false;
    }
  }

  // Rename session in OpenSearch
  async renameSession(sessionId: string, newName: string): Promise<boolean> {
    try {
      await this.core.http.post(`/api/opensearch/${this.MEMORY_INDEX}/_update_by_query`, {
        body: {
          query: {
            term: { sessionId },
          },
          script: {
            source: 'ctx._source.sessionName = params.newName',
            params: { newName },
          },
        },
      });

      console.log(`✏️ Renamed session ${sessionId} to: ${newName}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to rename session in OpenSearch:', error);
      return false;
    }
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  async getSessionSummary(): Promise<string> {
    try {
      const savedMemories = await this.getCurrentSessionMemories();
      const savedUserQueries = savedMemories.filter((m) => m.type === 'user_query').length;
      const chatUserQueries = this.currentChatHistory.filter((m) => m.type === 'user_query').length;

      return `Session: ${this.currentSessionId} | ${savedUserQueries} saved conversations | ${savedMemories.length} saved memories | ${chatUserQueries} current chat`;
    } catch (error) {
      return `Session: ${this.currentSessionId} | Error loading summary`;
    }
  }
}
