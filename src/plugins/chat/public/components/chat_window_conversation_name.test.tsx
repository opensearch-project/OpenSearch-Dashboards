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
jest.mock('../../../context_provider/public', () => ({
  AssistantActionService: {
    getInstance: jest.fn(() => ({
      getState$: jest.fn(() => mockObservable),
      getCurrentState: jest.fn(() => ({ toolDefinitions: [], toolCallStates: {} })),
      getActionRenderer: jest.fn(),
    })),
  },
}));

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
      getCurrentMessages: jest.fn().mockReturnValue([]),
      updateCurrentMessages: jest.fn(),
      getThreadId: jest.fn().mockReturnValue('mock-thread-id'),
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
    it('should not display conversation name when timeline is empty', () => {
      mockChatService.getCurrentMessages.mockReturnValue([]);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // ChatHeader should not have the title text when there's no message
      const header = container.querySelector('.chatHeader');
      expect(header).toBeInTheDocument();

      // Title should not be rendered when conversationName is empty
      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should extract conversation name from first user message with string content', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: 'How can I find the largest index?' },
        { id: '2', role: 'assistant' as const, content: 'You can use...' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('How can I find the largest index?');
    });

    it('should extract conversation name from first user message with array content', () => {
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
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('What is the weather today?');
    });

    it('should find first user message with text when earlier messages have no text', () => {
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
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Should use the first user message with text content
      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('Can you describe this image?');
    });

    it('should return empty string when no user message has text content', () => {
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
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Title should not be rendered when conversationName is empty
      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).not.toBeInTheDocument();
    });

    it('should skip assistant messages and find first user message', () => {
      const messages = [
        { id: '1', role: 'assistant' as const, content: 'Hello! How can I help?' },
        { id: '2', role: 'user' as const, content: 'Tell me about TypeScript' },
        { id: '3', role: 'assistant' as const, content: 'TypeScript is...' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('Tell me about TypeScript');
    });

    it('should skip whitespace-only messages and find first message with text', () => {
      const messages = [
        { id: '1', role: 'user' as const, content: '   ' },
        { id: '2', role: 'assistant' as const, content: 'I need more information' },
        { id: '3', role: 'user' as const, content: 'How do I debug my code?' },
        { id: '4', role: 'assistant' as const, content: 'You can use...' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('How do I debug my code?');
    });

    it('should handle long conversation name with CSS truncation', () => {
      const longMessage =
        'This is a very long message that should be truncated by CSS ellipsis when it exceeds the available width in the header';
      const messages = [
        { id: '1', role: 'user' as const, content: longMessage },
        { id: '2', role: 'assistant' as const, content: 'Response' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(messages);

      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      const titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      // Full text should be present (CSS handles truncation)
      expect(titleElement?.textContent).toBe(longMessage);

      // Verify the title has the class that applies CSS truncation styles
      expect(titleElement).toHaveClass('chatHeader__title');
    });

    it('should update conversation name when new messages are added', () => {
      // Start with empty timeline
      mockChatService.getCurrentMessages.mockReturnValue([]);

      const { container, rerender } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Initially no title
      let titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).not.toBeInTheDocument();

      // Simulate adding a message
      const messagesWithUser = [
        { id: '1', role: 'user' as const, content: 'New conversation started' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(messagesWithUser);

      rerender(
        <OpenSearchDashboardsContextProvider
          services={{ core: mockCore, contextProvider: mockContextProvider }}
        >
          <ChatProvider
            chatService={mockChatService}
            suggestedActionsService={mockSuggestedActionsService}
            confirmationService={mockConfirmationService}
          >
            <ChatWindow onClose={jest.fn()} />
          </ChatProvider>
        </OpenSearchDashboardsContextProvider>
      );

      // Now title should be present
      titleElement = container.querySelector('.chatHeader__title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('New conversation started');
    });
  });
});
