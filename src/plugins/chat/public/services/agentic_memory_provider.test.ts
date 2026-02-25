/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgenticMemoryProvider } from './agentic_memory_provider';
import { HttpSetup } from '../../../../core/public';
import { EventType } from '../../../../core/public';
import { AgUiAgent } from './ag_ui_agent';
import { of, throwError } from 'rxjs';

// Mock AgUiAgent
jest.mock('./ag_ui_agent');

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
    it('should use AgUiAgent to load and parse streaming response with messages', async () => {
      const mockEvents = [
        {
          type: 'RUN_STARTED',
          threadId: 'thread-123',
          runId: 'run-456',
          timestamp: 1640000000000,
        },
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [
            { id: 'msg-1', role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        },
        {
          type: 'RUN_FINISHED',
          threadId: 'thread-123',
          runId: 'run-456',
          timestamp: 1640001000000,
        },
      ];

      const mockRunAgent = jest.fn().mockReturnValue(of(...mockEvents));
      (AgUiAgent as jest.Mock).mockImplementation(() => ({
        runAgent: mockRunAgent,
      }));

      const result = await provider.getConversation('thread-123');

      expect(AgUiAgent).toHaveBeenCalledWith();
      expect(mockRunAgent).toHaveBeenCalledWith({
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

    it('should return null on empty events', async () => {
      const mockRunAgent = jest.fn().mockReturnValue(of());
      (AgUiAgent as jest.Mock).mockImplementation(() => ({
        runAgent: mockRunAgent,
      }));

      const result = await provider.getConversation('thread-123');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mockRunAgent = jest.fn().mockReturnValue(throwError(() => new Error('Network error')));
      (AgUiAgent as jest.Mock).mockImplementation(() => ({
        runAgent: mockRunAgent,
      }));

      const result = await provider.getConversation('thread-456');
      expect(result).toBeNull();

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

  describe('convertEventsToAgUiFormat', () => {
    it('should convert complete event sequence correctly', () => {
      const collectedEvents = [
        { type: 'RUN_STARTED', threadId: 'thread-123', runId: 'run-456', timestamp: 1640000000000 },
        { type: 'MESSAGES_SNAPSHOT', messages: [{ id: 'msg-1', role: 'user', content: 'Hello' }] },
        {
          type: 'RUN_FINISHED',
          threadId: 'thread-123',
          runId: 'run-456',
          timestamp: 1640001000000,
        },
      ];

      const events = (provider as any).convertEventsToAgUiFormat(collectedEvents);

      expect(events.length).toBe(3);
      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events[1].type).toBe(EventType.MESSAGES_SNAPSHOT);
      expect(events[2].type).toBe(EventType.RUN_FINISHED);
    });

    it('should create run events when only MESSAGES_SNAPSHOT exists', () => {
      const collectedEvents = [
        { type: 'MESSAGES_SNAPSHOT', messages: [{ id: 'msg-1', role: 'user', content: 'Hello' }] },
      ];

      const events = (provider as any).convertEventsToAgUiFormat(collectedEvents);

      expect(events.length).toBe(3);
      expect(events[0].type).toBe(EventType.RUN_STARTED);
      expect(events[0].threadId).toBe('restored');
      expect(events[1].type).toBe(EventType.MESSAGES_SNAPSHOT);
      expect(events[2].type).toBe(EventType.RUN_FINISHED);
    });

    it('should generate IDs for messages without them and aggregate snapshots', () => {
      const collectedEvents = [
        { type: 'RUN_STARTED', threadId: 't1', runId: 'r1', timestamp: 1 },
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [
            { role: 'user', content: 'Test1' },
            { id: 'existing', role: 'user', content: 'Test2' },
          ],
        },
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'msg-3', role: 'assistant', content: 'Test3' }],
        },
      ];

      const events = (provider as any).convertEventsToAgUiFormat(collectedEvents);

      const messagesSnapshot = events.find(
        (e: any) => e.type === EventType.MESSAGES_SNAPSHOT
      ) as any;
      expect(messagesSnapshot.messages).toHaveLength(3);
      expect(messagesSnapshot.messages[0].id).toMatch(/^msg_\d+_[a-z0-9]+$/); // auto-generated
      expect(messagesSnapshot.messages[1].id).toBe('existing'); // preserved
      expect(messagesSnapshot.messages[2].id).toBe('msg-3'); // preserved
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete conversation workflow', async () => {
      const mockEvents = [
        {
          type: 'RUN_STARTED',
          threadId: 'conv-123',
          runId: 'run-789',
          timestamp: 1640000000000,
        },
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [
            { id: 'msg-1', role: 'user', content: 'What is OpenSearch?' },
            {
              id: 'msg-2',
              role: 'assistant',
              content: 'OpenSearch is an open-source search and analytics suite.',
            },
          ],
        },
        {
          type: 'RUN_FINISHED',
          threadId: 'conv-123',
          runId: 'run-789',
          timestamp: 1640002000000,
        },
      ];

      const mockRunAgent = jest.fn().mockReturnValue(of(...mockEvents));
      (AgUiAgent as jest.Mock).mockImplementation(() => ({
        runAgent: mockRunAgent,
      }));

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
