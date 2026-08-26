/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalStorageMemoryProvider } from './local_storage_memory_provider';
import { SavedConversation } from './types';
import { EventType } from './events';

describe('LocalStorageMemoryProvider', () => {
  let provider: LocalStorageMemoryProvider;
  const STORAGE_KEY = 'chat.conversationHistory';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    provider = new LocalStorageMemoryProvider();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveConversation', () => {
    it('should save a conversation to localStorage', async () => {
      const conversation: SavedConversation = {
        id: 'conv-1',
        threadId: 'thread-1',
        name: 'Test Conversation',
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello' },
          { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await provider.saveConversation(conversation);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(conversation);
    });

    it('should update an existing conversation', async () => {
      const conversation: SavedConversation = {
        id: 'conv-1',
        threadId: 'thread-1',
        name: 'Test Conversation',
        messages: [{ id: 'msg-1', role: 'user', content: 'Hello' }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await provider.saveConversation(conversation);

      const updatedConversation: SavedConversation = {
        ...conversation,
        name: 'Updated Conversation',
        messages: [
          { id: 'msg-1', role: 'user', content: 'Hello' },
          { id: 'msg-2', role: 'assistant', content: 'Hi!' },
        ],
        updatedAt: Date.now() + 1000,
      };

      await provider.saveConversation(updatedConversation);

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('Updated Conversation');
      expect(parsed[0].messages).toHaveLength(2);
    });

    it('should store multiple conversations', async () => {
      const conv1: SavedConversation = {
        id: 'conv-1',
        threadId: 'thread-1',
        name: 'Conversation 1',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const conv2: SavedConversation = {
        id: 'conv-2',
        threadId: 'thread-2',
        name: 'Conversation 2',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await provider.saveConversation(conv1);
      await provider.saveConversation(conv2);

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('getConversations', () => {
    beforeEach(async () => {
      // Setup test data
      const conversations: SavedConversation[] = [];
      for (let i = 0; i < 25; i++) {
        conversations.push({
          id: `conv-${i}`,
          threadId: `thread-${i}`,
          name: `Conversation ${i}`,
          messages: [],
          createdAt: Date.now() - i * 1000,
          updatedAt: Date.now() - i * 1000,
        });
      }

      // Save all conversations
      for (const conv of conversations) {
        await provider.saveConversation(conv);
      }
    });

    it('should return paginated conversations sorted by updatedAt DESC', async () => {
      const result = await provider.getConversations({ page: 0, pageSize: 10 });

      expect(result.conversations).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      // Conversations are stored with most recent first (via unshift)
      // So the order is reversed: 24, 23, 22, ... 0
      expect(result.conversations[0].name).toBe('Conversation 24');
      expect(result.conversations[9].name).toBe('Conversation 15');
    });

    it('should return second page correctly', async () => {
      const result = await provider.getConversations({ page: 1, pageSize: 10 });

      expect(result.conversations).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.conversations[0].name).toBe('Conversation 14');
    });

    it('should set hasMore to false on last page', async () => {
      const result = await provider.getConversations({ page: 2, pageSize: 10 });

      expect(result.conversations).toHaveLength(5);
      expect(result.hasMore).toBe(false);
    });

    it('should return empty array when page exceeds total', async () => {
      const result = await provider.getConversations({ page: 10, pageSize: 10 });

      expect(result.conversations).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });

    it('should handle empty storage', async () => {
      localStorage.clear();
      const emptyProvider = new LocalStorageMemoryProvider();
      const result = await emptyProvider.getConversations({ page: 0, pageSize: 10 });

      expect(result.conversations).toHaveLength(0);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getConversation', () => {
    const testConversation: SavedConversation = {
      id: 'conv-1',
      threadId: 'thread-1',
      name: 'Test Conversation',
      messages: [
        { id: 'msg-1', role: 'user', content: 'Hello' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!' },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    beforeEach(async () => {
      await provider.saveConversation(testConversation);
    });

    it('should return AG-UI event sequence for existing conversation', async () => {
      const events = await provider.getConversation('thread-1');

      expect(events).not.toBeNull();
      expect(events).toHaveLength(3);

      // Check RUN_STARTED event
      expect(events![0].type).toBe(EventType.RUN_STARTED);
      expect(events![0]).toHaveProperty('threadId', 'thread-1');
      expect(events![0]).toHaveProperty('runId');
      expect(events![0]).toHaveProperty('timestamp');

      // Check MESSAGES_SNAPSHOT event
      expect(events![1].type).toBe(EventType.MESSAGES_SNAPSHOT);
      expect(events![1]).toHaveProperty('messages');
      expect((events![1] as any).messages).toEqual(testConversation.messages);

      // Check RUN_FINISHED event
      expect(events![2].type).toBe(EventType.RUN_FINISHED);
      expect(events![2]).toHaveProperty('threadId', 'thread-1');
      expect(events![2]).toHaveProperty('runId');
    });

    it('should return null for non-existent conversation', async () => {
      const events = await provider.getConversation('non-existent');

      expect(events).toBeNull();
    });

    it('should generate unique runId for each retrieval', async () => {
      const events1 = await provider.getConversation('thread-1');

      // Add small delay to ensure Date.now() returns different value
      await new Promise((resolve) => setTimeout(resolve, 10));

      const events2 = await provider.getConversation('thread-1');

      expect(events1).not.toBeNull();
      expect(events2).not.toBeNull();
      expect((events1![0] as any).runId).not.toBe((events2![0] as any).runId);
    });
  });

  describe('includeFullHistory property', () => {
    it('should have includeFullHistory property defaulting to true', () => {
      expect(provider.includeFullHistory).toBe(true);
    });

    it('should allow setting includeFullHistory property', () => {
      provider.includeFullHistory = false;
      expect(provider.includeFullHistory).toBe(false);

      provider.includeFullHistory = true;
      expect(provider.includeFullHistory).toBe(true);
    });

    it('should always return all messages from getConversation regardless of includeFullHistory flag', async () => {
      const testConversation: SavedConversation = {
        id: 'conv-multi',
        threadId: 'thread-multi',
        name: 'Multi Message Conversation',
        messages: [
          { id: 'msg-1', role: 'user', content: 'First question' },
          { id: 'msg-2', role: 'assistant', content: 'First answer' },
          { id: 'msg-3', role: 'user', content: 'Second question' },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await provider.saveConversation(testConversation);

      // Test with includeFullHistory = true
      provider.includeFullHistory = true;
      const events1 = await provider.getConversation('thread-multi');
      expect(events1).not.toBeNull();
      expect((events1![1] as any).messages).toEqual(testConversation.messages);

      // Test with includeFullHistory = false
      provider.includeFullHistory = false;
      const events2 = await provider.getConversation('thread-multi');
      expect(events2).not.toBeNull();
      expect((events2![1] as any).messages).toEqual(testConversation.messages);
    });
  });

  describe('deleteConversation', () => {
    beforeEach(async () => {
      const conv1: SavedConversation = {
        id: 'conv-1',
        threadId: 'thread-1',
        name: 'Conversation 1',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const conv2: SavedConversation = {
        id: 'conv-2',
        threadId: 'thread-2',
        name: 'Conversation 2',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await provider.saveConversation(conv1);
      await provider.saveConversation(conv2);
    });

    it('should delete a conversation by threadId', async () => {
      await provider.deleteConversation('thread-1');

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].threadId).toBe('thread-2');
    });

    it('should do nothing when deleting non-existent conversation', async () => {
      await provider.deleteConversation('non-existent');

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(2);
    });
  });

  describe('localStorage error handling', () => {
    it('should log warning when localStorage quota exceeded', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      const conversation: SavedConversation = {
        id: 'conv-1',
        threadId: 'thread-1',
        name: 'Test',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Should not throw, but should log warning
      await provider.saveConversation(conversation);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save conversation history to localStorage:',
        expect.any(Error)
      );

      Storage.prototype.setItem = originalSetItem;
      consoleWarnSpy.mockRestore();
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      localStorage.setItem(STORAGE_KEY, 'invalid json{');

      const result = await provider.getConversations({ page: 0, pageSize: 10 });

      expect(result.conversations).toHaveLength(0);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
