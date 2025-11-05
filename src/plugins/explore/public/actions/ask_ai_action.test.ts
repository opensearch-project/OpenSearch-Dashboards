/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAskAiAction } from './ask_ai_action';
import { ChatService } from '../../../chat/public';

// Mock the AskAIActionItem component
jest.mock('../components/ask_ai_action_item', () => ({
  AskAIActionItem: jest.fn(() => null),
}));

describe('createAskAiAction', () => {
  let mockChatService: jest.Mocked<ChatService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a minimal mock of ChatService
    mockChatService = {
      sendMessage: jest.fn(),
      sendMessageWithWindow: jest.fn(),
      newThread: jest.fn(),
      abort: jest.fn(),
      resetConnection: jest.fn(),
      availableTools: [],
    } as any;
  });

  describe('action configuration', () => {
    it('should create action with correct properties', () => {
      const action = createAskAiAction(mockChatService);

      expect(action.id).toBe('ask_ai');
      expect(action.displayName).toBe('Ask AI');
      expect(action.iconType).toBe('generate');
      expect(action.order).toBe(1);
      expect(typeof action.isCompatible).toBe('function');
      expect(typeof action.component).toBe('function');
    });
  });

  describe('isCompatible', () => {
    const mockContext = {
      document: { message: 'test log' },
      query: 'test query',
    };

    it('should return true when chatService is provided', () => {
      const action = createAskAiAction(mockChatService);
      expect(action.isCompatible(mockContext)).toBe(true);
    });

    it('should return false when chatService is undefined', () => {
      const action = createAskAiAction(undefined);
      expect(action.isCompatible(mockContext)).toBe(false);
    });

    it('should return false when chatService is null', () => {
      const action = createAskAiAction(null as any);
      expect(action.isCompatible(mockContext)).toBe(false);
    });
  });

  describe('chatService availability', () => {
    it('should create valid action with chatService', () => {
      const action = createAskAiAction(mockChatService);
      const mockContext = { document: {} };

      expect(action.isCompatible(mockContext)).toBe(true);
      expect(action).toMatchObject({
        id: 'ask_ai',
        displayName: 'Ask AI',
        iconType: 'generate',
        order: 1,
      });
    });

    it('should create action that is incompatible when chatService is undefined', () => {
      const action = createAskAiAction(undefined);
      const mockContext = { document: {} };

      expect(action.isCompatible(mockContext)).toBe(false);
      expect(action.id).toBe('ask_ai');
    });
  });
});
