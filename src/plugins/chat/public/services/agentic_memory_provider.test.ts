/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgenticMemoryProvider } from './agentic_memory_provider';
import { HttpSetup } from '../../../../core/public';
import { EventType } from '../../../../core/public';

describe('AgenticMemoryProvider', () => {
  let provider: AgenticMemoryProvider;
  let mockHttp: jest.Mocked<HttpSetup>;

  beforeEach(() => {
    // Create mock HTTP setup
    mockHttp = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
      head: jest.fn(),
      options: jest.fn(),
    } as any;

    provider = new AgenticMemoryProvider(mockHttp);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize correctly with includeFullHistory set to false', () => {
      expect(provider.includeFullHistory).toBe(false);
      expect((provider as any).http).toBe(mockHttp);
    });
  });

  describe('saveConversation', () => {
    it('should be a no-op for interface compatibility', async () => {
      const conversation = {
        id: 'test-id',
        threadId: 'test-thread',
        name: 'Test Conversation',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await provider.saveConversation(conversation);

      expect(result).toBeUndefined();
      expect(mockHttp.post).not.toHaveBeenCalled();
      expect(mockHttp.put).not.toHaveBeenCalled();
    });
  });

  describe('getConversations', () => {
    it('should fetch conversations with correct pagination and format', async () => {
      const mockResponse = {
        hits: {
          total: { value: 100 },
          hits: [
            {
              _id: 'conv-1',
              _source: {
                summary: 'Test Conversation 1',
                created_time: 1640000000000,
                last_updated_time: 1640001000000,
                memory_container_id: 'container-1',
              },
            },
            {
              _id: 'conv-2',
              _source: {
                summary: '',
                created_time: 1640002000000,
                last_updated_time: 1640003000000,
                memory_container_id: 'container-2',
              },
            },
          ],
        },
      };

      mockHttp.post.mockResolvedValue(mockResponse);

      const result = await provider.getConversations({ page: 2, pageSize: 20 });

      expect(mockHttp.post).toHaveBeenCalledWith('/api/chat/memory/sessions/search', {
        body: JSON.stringify({
          query: {
            match_all: {},
          },
          from: 40, // page 2 * pageSize 20
          size: 20,
          sort: [{ last_updated_time: { order: 'desc' } }],
        }),
      });

      expect(result.conversations).toHaveLength(2);
      expect(result.conversations[0].name).toBe('Test Conversation 1');
      expect(result.conversations[1].name).toBe('Untitled Conversation'); // empty summary
      expect(result.hasMore).toBe(true); // 60 < 100
      expect(result.total).toBe(100);
    });

    it('should return empty result on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockHttp.post.mockRejectedValue(new Error('Network error'));

      const result = await provider.getConversations({ page: 0, pageSize: 10 });

      expect(result).toEqual({
        conversations: [],
        hasMore: false,
        total: 0,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getConversation', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    const createMockStreamingResponse = (content: string) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(content);

      let readCalled = false;

      return {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: async () => {
              if (readCalled) {
                return { done: true, value: undefined };
              }
              readCalled = true;
              return { done: false, value: bytes };
            },
            releaseLock: () => {},
          }),
        },
      } as Response;
    };

    it('should load and parse streaming response with messages', async () => {
      const streamingResponse = `data: {"type":"RUN_STARTED","threadId":"thread-123","runId":"run-456","timestamp":1640000000000}
data: {"type":"MESSAGES_SNAPSHOT","messages":[{"id":"msg-1","role":"user","content":"Hello"},{"role":"assistant","content":"Hi there!"}]}
data: {"type":"RUN_FINISHED","threadId":"thread-123","runId":"run-456","timestamp":1640001000000}
`;

      global.fetch = jest.fn().mockResolvedValue(createMockStreamingResponse(streamingResponse));

      const result = await provider.getConversation('thread-123');

      expect(global.fetch).toHaveBeenCalledWith('/api/chat/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'osd-xsrf': 'true',
        },
        body: expect.stringContaining('"threadId":"thread-123"'),
      });

      // Verify the body contains all required fields
      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);
      expect(bodyData).toMatchObject({
        threadId: 'thread-123',
        runId: expect.stringMatching(/^restore-\d+$/),
        messages: [],
        tools: [],
        context: [],
        state: {},
        forwardedProps: {},
      });

      expect(result).toHaveLength(3);
      expect(result![0].type).toBe(EventType.RUN_STARTED);
      expect(result![1].type).toBe(EventType.MESSAGES_SNAPSHOT);
      expect((result![1] as any).messages[0].id).toBe('msg-1');
      expect((result![1] as any).messages[1].id).toMatch(/^msg_\d+_[a-z0-9]+$/); // auto-generated ID
      expect(result![2].type).toBe(EventType.RUN_FINISHED);
    });

    it('should return null on error or empty response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Test empty response
      global.fetch = jest.fn().mockResolvedValue(createMockStreamingResponse(''));
      let result = await provider.getConversation('thread-123');
      expect(result).toBeNull();

      // Test network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      result = await provider.getConversation('thread-456');
      expect(result).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    it('should handle HTTP errors properly', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await provider.getConversation('thread-789');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle missing response body reader', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: null,
      } as Response);

      const result = await provider.getConversation('thread-999');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteConversation', () => {
    it('should throw error as deletion is not supported', async () => {
      await expect(provider.deleteConversation('thread-123')).rejects.toThrow(
        'Conversation deletion is not supported for agentic memory'
      );
    });
  });

  describe('parseStreamingResponse', () => {
    it('should parse complete event sequence correctly', () => {
      const response = `data: {"type":"RUN_STARTED","threadId":"thread-123","runId":"run-456","timestamp":1640000000000}
data: {"type":"MESSAGES_SNAPSHOT","messages":[{"id":"msg-1","role":"user","content":"Hello"}]}
data: {"type":"RUN_FINISHED","threadId":"thread-123","runId":"run-456","timestamp":1640001000000}
`;

      const events = (provider as any).parseStreamingResponse(response);

      expect(events.length).toBe(3);
      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events[1].type).toBe(EventType.MESSAGES_SNAPSHOT);
      expect(events[2].type).toBe(EventType.RUN_FINISHED);
    });

    it('should create run events when only MESSAGES_SNAPSHOT exists', () => {
      const response = `data: {"type":"MESSAGES_SNAPSHOT","messages":[{"id":"msg-1","role":"user","content":"Hello"}]}
`;

      const events = (provider as any).parseStreamingResponse(response);

      expect(events.length).toBe(3);
      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events[0].threadId).toBe('restored');
      expect(events[1].type).toBe(EventType.MESSAGES_SNAPSHOT);
      expect(events[2].type).toBe(EventType.RUN_FINISHED);
    });

    it('should generate IDs for messages without them and aggregate snapshots', () => {
      const response = `data: {"type":"RUN_STARTED","threadId":"t1","runId":"r1","timestamp":1}
data: {"type":"MESSAGES_SNAPSHOT","messages":[{"role":"user","content":"Test1"},{"id":"existing","role":"user","content":"Test2"}]}
data: {"type":"MESSAGES_SNAPSHOT","messages":[{"id":"msg-3","role":"assistant","content":"Test3"}]}
`;

      const events = (provider as any).parseStreamingResponse(response);

      const messagesSnapshot = events.find(
        (e: any) => e.type === EventType.MESSAGES_SNAPSHOT
      ) as any;
      expect(messagesSnapshot.messages).toHaveLength(3);
      expect(messagesSnapshot.messages[0].id).toMatch(/^msg_\d+_[a-z0-9]+$/); // auto-generated
      expect(messagesSnapshot.messages[1].id).toBe('existing'); // preserved
      expect(messagesSnapshot.messages[2].id).toBe('msg-3'); // preserved
    });

    it('should handle malformed JSON and invalid lines gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const response = `invalid line
data: {"type":"RUN_STARTED","incomplete
data: {"type":"RUN_FINISHED","threadId":"t1","runId":"r1","timestamp":1}
`;

      const events = (provider as any).parseStreamingResponse(response);

      expect(events.length).toBe(1);
      expect(events[0].type).toBe(EventType.RUN_FINISHED);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    const createMockStreamingResponse = (content: string) => {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(content);

      let readCalled = false;

      return {
        ok: true,
        status: 200,
        body: {
          getReader: () => ({
            read: async () => {
              if (readCalled) {
                return { done: true, value: undefined };
              }
              readCalled = true;
              return { done: false, value: bytes };
            },
            releaseLock: () => {},
          }),
        },
      } as Response;
    };

    it('should handle complete conversation workflow', async () => {
      const streamingResponse = `data: {"type":"RUN_STARTED","threadId":"conv-123","runId":"run-789","timestamp":1640000000000}
data: {"type":"MESSAGES_SNAPSHOT","messages":[{"id":"msg-1","role":"user","content":"What is OpenSearch?"},{"id":"msg-2","role":"assistant","content":"OpenSearch is an open-source search and analytics suite."}]}
data: {"type":"RUN_FINISHED","threadId":"conv-123","runId":"run-789","timestamp":1640002000000}
`;

      global.fetch = jest.fn().mockResolvedValue(createMockStreamingResponse(streamingResponse));

      const events = await provider.getConversation('conv-123');

      expect(events).toBeDefined();
      expect(events!.length).toBe(3);
      expect((events![1] as any).messages.length).toBe(2);
      expect((events![1] as any).messages[0].content).toBe('What is OpenSearch?');
    });

    it('should handle pagination across multiple pages', async () => {
      const mockResponses = [
        {
          hits: {
            total: { value: 25 },
            hits: Array.from({ length: 10 }, (_, i) => ({
              _id: `conv-${i}`,
              _source: {
                summary: `Conversation ${i}`,
                created_time: 1640000000000,
                last_updated_time: 1640001000000,
                memory_container_id: 'container',
              },
            })),
          },
        },
        {
          hits: {
            total: { value: 25 },
            hits: Array.from({ length: 5 }, (_, i) => ({
              _id: `conv-${i + 20}`,
              _source: {
                summary: `Conversation ${i + 20}`,
                created_time: 1640000000000,
                last_updated_time: 1640001000000,
                memory_container_id: 'container',
              },
            })),
          },
        },
      ];

      mockHttp.post.mockResolvedValueOnce(mockResponses[0]);
      const result1 = await provider.getConversations({ page: 0, pageSize: 10 });
      expect(result1.conversations.length).toBe(10);
      expect(result1.hasMore).toBe(true);

      mockHttp.post.mockResolvedValueOnce(mockResponses[1]);
      const result2 = await provider.getConversations({ page: 2, pageSize: 10 });
      expect(result2.conversations.length).toBe(5);
      expect(result2.hasMore).toBe(false);
    });
  });
});
