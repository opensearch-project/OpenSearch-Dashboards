/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChatWindow } from './chat_window';
import { coreMock } from '../../../../core/public/mocks';
import { of } from 'rxjs';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ChatProvider } from '../contexts/chat_context';
import { ChatService } from '../services/chat_service';
import { SuggestedActionsService } from '../services/suggested_action';
import { ConfirmationService } from '../services/confirmation_service';

// Create mock observable before using it in mocks
const mockObservable = of({ toolDefinitions: [], toolCallStates: {} });

// Mock dependencies
jest.mock('../../../context_provider/public', () => {
  const assistantActionsInstance = {
    getState$: jest.fn(() => mockObservable),
    getCurrentState: jest.fn(() => ({ toolDefinitions: [], toolCallStates: {} })),
    getActionRenderer: jest.fn(),
  };
  return {
    AssistantActionService: {
      getInstance: jest.fn(() => assistantActionsInstance),
    },
  };
});

jest.mock('../services/chat_event_handler', () => ({
  ChatEventHandler: jest.fn().mockImplementation(() => ({
    handleEvent: jest.fn(),
    clearState: jest.fn(),
  })),
}));

jest.mock('../actions/graph_timeseries_data_action', () => ({
  useGraphTimeseriesDataAction: jest.fn(),
}));

describe('ChatWindow - Conversation Name', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockContextProvider: any;
  let mockChatService: jest.Mocked<ChatService>;
  let mockSuggestedActionsService: jest.Mocked<SuggestedActionsService>;
  let mockConfirmationService: jest.Mocked<ConfirmationService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView which is not implemented in JSDOM
    Element.prototype.scrollIntoView = jest.fn();

    mockCore = coreMock.createStart();
    mockContextProvider = {};

    // Mock scrollIntoView which is not available in jsdom
    Element.prototype.scrollIntoView = jest.fn();

    mockChatService = {
      sendMessage: jest.fn().mockResolvedValue({
        observable: of({ type: 'message', content: 'test' }),
        userMessage: { id: '1', content: 'test', role: 'user' },
      }),
      newThread: jest.fn(),
      restoreLatestConversation: jest.fn().mockResolvedValue(null),
      saveConversation: jest.fn(),
      getThreadId: jest.fn().mockReturnValue('mock-thread-id'),
      setChatWindowInstance: jest.fn(),
      clearChatWindowInstance: jest.fn(),
      conversationHistoryService: {
        getMemoryProvider: jest.fn().mockReturnValue({
          includeFullHistory: true,
        }),
      },
      loadConversation: jest.fn(),
      abort: jest.fn(),
    } as any;
    mockSuggestedActionsService = {} as any;
    mockConfirmationService = {
      getPendingConfirmations$: jest.fn().mockReturnValue(of([])),
      requestConfirmation: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      cancel: jest.fn(),
    } as any;
  });

  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <OpenSearchDashboardsContextProvider
        services={{ core: mockCore, contextProvider: mockContextProvider }}
      >
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
          confirmationService={mockConfirmationService}
        >
          {component}
        </ChatProvider>
      </OpenSearchDashboardsContextProvider>
    );
  };

  describe('conversation name extraction', () => {
    it('should not display conversation name when timeline is empty', async () => {
      mockChatService.restoreLatestConversation.mockResolvedValue(null);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // ChatHeader should not have the title text when there's no message
      const header = container.querySelector('.chatHeader');
      expect(header).toBeInTheDocument();

      // Title should not be rendered when conversationName is empty
      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should extract conversation name from first user message with string content', async () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'How can I find the largest index?' },
        { id: '2', role: 'assistant' as const, content: 'You can use...' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('How can I find the largest index?');
    });

    it('should extract conversation name from first user message with array content', async () => {
      const messages = [
        {
          id: '1',
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: 'What is the weather today?' },
            { type: 'binary' as const, mimeType: 'image/png', url: 'example.com/image.png' },
          ],
        },
        { id: '2', role: 'assistant' as const, content: 'The weather is...' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('What is the weather today?');
    });

    it('should find first user message with text when earlier messages have no text', async () => {
      const messages = [
        {
          id: '1',
          role: 'user' as const,
          content: [
            { type: 'binary' as const, mimeType: 'image/png', url: 'example.com/image.png' },
          ],
        },
        { id: '2', role: 'assistant' as const, content: 'I see an image...' },
        { id: '3', role: 'user' as const, content: 'Can you describe this image?' },
        { id: '4', role: 'assistant' as const, content: 'Sure...' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should use the first user message with text content
      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('Can you describe this image?');
    });

    it('should return empty string when no user message has text content', async () => {
      const messages = [
        {
          id: '1',
          role: 'user' as const,
          content: [
            { type: 'binary' as const, mimeType: 'image/png', url: 'example.com/image.png' },
          ],
        },
        { id: '2', role: 'assistant' as const, content: 'I see an image...' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Title should not be rendered when conversationName is empty
      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should skip assistant messages and find first user message', async () => {
      const messages = [
        { id: '1', role: 'assistant' as const, content: 'Hello! How can I help?' },
        { id: '2', role: 'user' as const, content: 'Tell me about TypeScript' },
        { id: '3', role: 'assistant' as const, content: 'TypeScript is...' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('Tell me about TypeScript');
    });

    it('should skip whitespace-only messages and find first message with text', async () => {
      const messages = [
        { id: '1', role: 'user' as const, content: '   ' },
        { id: '2', role: 'assistant' as const, content: 'I need more information' },
        { id: '3', role: 'user' as const, content: 'How do I debug my code?' },
        { id: '4', role: 'assistant' as const, content: 'You can use...' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('How do I debug my code?');
    });

    it('should handle long conversation name with CSS truncation', async () => {
      const longMessage =
        'This is a very long message that should be truncated by CSS ellipsis when it exceeds the available width in the header';
      const messages = [
        { id: '1', role: 'user' as const, content: longMessage },
        { id: '2', role: 'assistant' as const, content: 'Response' },
      ];
      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      // Full text should be present (CSS handles truncation)
      expect(titleElement?.textContent).toBe(longMessage);

      // Verify the title has the class that applies CSS truncation styles
      expect(titleElement).toHaveClass('chatHeader__title');
    });

    it('should update conversation name when new messages are added', async () => {
      // Start with a conversation that has messages
      const initialMessages = [
        { id: '1', role: 'user' as const, content: 'Initial message' },
        { id: '2', role: 'assistant' as const, content: 'Initial response' },
      ];

      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'test-thread-id',
        messages: initialMessages,
      });

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for initial restoration
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should have initial title
      let titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('Initial message');

      // Now test with a different conversation
      const newMessages = [{ id: '3', role: 'user' as const, content: 'New conversation started' }];

      mockChatService.restoreLatestConversation.mockResolvedValue({
        threadId: 'new-thread-id',
        messages: newMessages,
      });

      // Unmount and remount to simulate loading a different conversation
      const { container: newContainer } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for restoration to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Now title should be updated
      titleElement = newContainer.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('New conversation started');
    });
  });
});
