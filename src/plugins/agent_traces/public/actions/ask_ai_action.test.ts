/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAskAiAction } from './ask_ai_action';
// @ts-expect-error TS2307 TODO(ts-error): fixme
import { ChatServiceStart } from '../../../../../core/public';

// Mock the AskAIActionItem component
jest.mock('../components/ask_ai_action_item', () => ({
  AskAIActionItem: jest.fn(() => null),
}));

describe('createAskAiAction', () => {
  let mockChatService: jest.Mocked<ChatServiceStart>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a minimal mock of ChatServiceStart
    mockChatService = {
      isAvailable: jest.fn().mockReturnValue(true),
      isWindowOpen: jest.fn().mockReturnValue(false),
      sendMessageWithWindow: jest.fn().mockResolvedValue(undefined),
      getThreadId$: jest.fn(),
      getThreadId: jest.fn(),
      openWindow: jest.fn(),
      closeWindow: jest.fn(),
      sendMessage: jest.fn(),
      getWindowState$: jest.fn(),
      onWindowOpen: jest.fn(),
      onWindowClose: jest.fn(),
      suggestedActionsService: undefined,
    };
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

    it('should return true when chatService is available', () => {
      const action = createAskAiAction(mockChatService);
      expect(action.isCompatible(mockContext)).toBe(true);
    });

    it('should return false when chatService is not available', () => {
      const unavailableChatService = {
        ...mockChatService,
        isAvailable: jest.fn().mockReturnValue(false),
      };
      const action = createAskAiAction(unavailableChatService);
      expect(action.isCompatible(mockContext)).toBe(false);
    });
  });

  describe('chatService availability', () => {
    it('should create valid action with available chatService', () => {
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

    it('should create action that is incompatible when chatService is not available', () => {
      const unavailableChatService = {
        ...mockChatService,
        isAvailable: jest.fn().mockReturnValue(false),
      };
      const action = createAskAiAction(unavailableChatService);
      const mockContext = { document: {} };

      expect(action.isCompatible(mockContext)).toBe(false);
      expect(action.id).toBe('ask_ai');
    });
  });
});
