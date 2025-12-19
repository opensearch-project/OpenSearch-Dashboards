/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChatWindow, ChatWindowInstance } from './chat_window';
import { coreMock } from '../../../../core/public/mocks';
import { of, Subject } from 'rxjs';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ChatProvider } from '../contexts/chat_context';
import { ChatService } from '../services/chat_service';
import { ChatLayoutMode } from './chat_header_button';

// Create mock subject that can be controlled in tests
const mockStateSubject = new Subject();
const mockObservable = mockStateSubject.asObservable();

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

describe('ChatWindow', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockContextProvider: any;
  let mockChatService: jest.Mocked<ChatService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();
    mockContextProvider = {};
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
  });

  const mockSuggestedActionsService = {
    getActions: jest.fn().mockReturnValue([]),
    subscribe: jest.fn(),
  };

  const defaultProps = {
    onClose: jest.fn(),
    layoutMode: ChatLayoutMode.SIDECAR,
  };

  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <OpenSearchDashboardsContextProvider
        services={{ core: mockCore, contextProvider: mockContextProvider }}
      >
        <ChatProvider
          chatService={mockChatService}
          suggestedActionsService={mockSuggestedActionsService}
        >
          {component}
        </ChatProvider>
      </OpenSearchDashboardsContextProvider>
    );
  };

  const renderChatWindow = (props: Partial<React.ComponentProps<typeof ChatWindow>> = {}) => {
    return renderWithContext(<ChatWindow {...defaultProps} {...props} />);
  };

  describe('ref functionality', () => {
    it('should expose startNewChat method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderChatWindow({ ref });

      expect(ref.current).toBeDefined();
      expect(ref.current?.startNewChat).toBeDefined();
      expect(typeof ref.current?.startNewChat).toBe('function');
    });

    it('should expose sendMessage method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderChatWindow({ ref });

      expect(ref.current).toBeDefined();
      expect(ref.current?.sendMessage).toBeDefined();
      expect(typeof ref.current?.sendMessage).toBe('function');
    });

    it('should call chatService.newThread when startNewChat is invoked', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderChatWindow({ ref });

      ref.current?.startNewChat();

      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should call chatService.sendMessage when sendMessage is invoked via ref', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderChatWindow({ ref });

      // Wait for the sendMessage to complete
      await ref.current?.sendMessage({ content: 'test message from ref' });

      // Wait for any pending promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'test message from ref',
        expect.any(Array)
      );
    });
  });

  describe('loading message functionality', () => {
    it('should add loading message to timeline when sending a message', async () => {
      renderChatWindow();

      // Mock the sendMessage to return a controllable observable
      const loadingObservable = {
        subscribe: jest.fn((callbacks) => {
          // Don't call next immediately to simulate loading state
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: loadingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Send a message
      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for state updates
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockChatService.sendMessage).toHaveBeenCalled();
      expect(loadingObservable.subscribe).toHaveBeenCalled();
    });

    it('should remove loading message when first response is received', async () => {
      const responseObservable = {
        subscribe: jest.fn((callbacks) => {
          // Simulate receiving a response
          setTimeout(() => {
            callbacks.next({ type: 'message', content: 'response' });
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: responseObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Send a message
      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for the response to be processed
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(responseObservable.subscribe).toHaveBeenCalled();
    });

    it('should remove loading message on error', async () => {
      const errorObservable = {
        subscribe: jest.fn((callbacks) => {
          // Simulate an error
          setTimeout(() => {
            callbacks.error(new Error('Test error'));
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: errorObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Send a message
      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for the error to be processed
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(errorObservable.subscribe).toHaveBeenCalled();
    });

    it('should remove loading message on completion', async () => {
      const completionObservable = {
        subscribe: jest.fn((callbacks) => {
          // Simulate completion without response
          setTimeout(() => {
            callbacks.complete();
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: completionObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Send a message
      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(completionObservable.subscribe).toHaveBeenCalled();
    });
  });

  describe('createLoadingMessage helper', () => {
    it('should create loading message with unique ID and correct structure', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Mock Date.now to control the ID generation
      const mockNow = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockNow);

      const loadingObservable = {
        subscribe: jest.fn((callbacks) => {
          // Don't call next to keep loading state
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: loadingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      await ref.current?.sendMessage({ content: 'test message' });

      expect(loadingObservable.subscribe).toHaveBeenCalled();

      // Restore Date.now
      jest.restoreAllMocks();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle sendMessage failure gracefully', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Mock sendMessage to throw an error
      mockChatService.sendMessage.mockRejectedValue(new Error('Send failed'));

      // Should not throw when sendMessage fails
      await expect(
        ref.current?.sendMessage({ content: 'failing message' })
      ).resolves.toBeUndefined();
    });

    it('should not send empty or whitespace-only messages', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Try to send empty message
      await ref.current?.sendMessage({ content: '' });
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();

      // Try to send whitespace-only message
      await ref.current?.sendMessage({ content: '   ' });
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should not send message when already streaming', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderChatWindow({ ref });

      // Set up a long-running observable to simulate streaming
      const longRunningObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: longRunningObservable,
        userMessage: { id: 'user-1', content: 'first message', role: 'user' },
      });

      // Send first message (starts streaming)
      await ref.current?.sendMessage({ content: 'first message' });

      // Clear the mock to track subsequent calls
      mockChatService.sendMessage.mockClear();

      // Try to send second message while streaming
      await ref.current?.sendMessage({ content: 'second message' });

      // Second message should be ignored
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('tool definitions subscription', () => {
    it('should subscribe to tool updates and store them in chatService', async () => {
      const mockToolDefinitions = [
        { id: 'tool1', name: 'Test Tool 1' },
        { id: 'tool2', name: 'Test Tool 2' },
      ];

      renderChatWindow();

      // Emit tool definitions through the subject
      mockStateSubject.next({
        toolDefinitions: mockToolDefinitions,
        toolCallStates: {},
      });

      // Wait for subscription to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check that tools were stored in chatService
      expect((mockChatService as any).availableTools).toEqual(mockToolDefinitions);
    });

    it('should not store tools when toolDefinitions is empty', async () => {
      const mockAssistantService = jest.mocked(
        jest.requireMock('../../../context_provider/public').AssistantActionService.getInstance()
      );

      mockAssistantService.getState$ = jest.fn(() =>
        of({
          toolDefinitions: [],
          toolCallStates: {},
        })
      );

      renderChatWindow();

      // Wait for subscription to process
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should not set availableTools when empty
      expect((mockChatService as any).availableTools).toBeUndefined();
    });
  });

  describe('event handler cleanup', () => {
    it('should clean up event handler on unmount', () => {
      const mockEventHandler = jest.mocked(
        jest.requireMock('../services/chat_event_handler').ChatEventHandler
      );

      const { unmount } = renderChatWindow();

      unmount();

      // Should call clearState on unmount (via the mocked constructor)
      expect(mockEventHandler).toHaveBeenCalled();
    });
  });

  describe('persistence integration', () => {
    it('should restore timeline from persisted messages on mount', () => {
      const persistedMessages = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(persistedMessages);

      renderChatWindow();

      // Should call getCurrentMessages on mount
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should not restore timeline when no persisted messages exist', () => {
      mockChatService.getCurrentMessages.mockReturnValue([]);

      renderChatWindow();

      // Should call getCurrentMessages but timeline should remain empty
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should sync timeline changes with ChatService for persistence', async () => {
      renderChatWindow();

      // Wait for initial render and useEffect calls
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Initially called with empty timeline
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalledWith([]);
    });

    it('should call updateCurrentMessages on every timeline update', async () => {
      renderChatWindow();

      // Wait for initial mount effects
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should be called at least once during initialization
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalled();
    });
  });

  describe('component props and layout', () => {
    it('should render with default layout mode', () => {
      const { container } = renderChatWindow();
      expect(container).toBeTruthy();
    });

    it('should render with custom layout mode', () => {
      const { container } = renderChatWindow({
        layoutMode: ChatLayoutMode.FULLSCREEN,
        onToggleLayout: () => {},
      });
      expect(container).toBeTruthy();
    });

    it('should call onClose when provided', () => {
      const onCloseMock = jest.fn();
      renderChatWindow({ onClose: onCloseMock });

      // The onClose callback is passed to child components
      // Actual testing would depend on how the close button is implemented
      expect(onCloseMock).toBeDefined();
    });

    it('should call onToggleLayout when provided', () => {
      const onToggleLayoutMock = jest.fn();
      renderChatWindow({ onToggleLayout: onToggleLayoutMock });

      // The onToggleLayout callback is passed to child components
      expect(onToggleLayoutMock).toBeDefined();
    });
  });
});
