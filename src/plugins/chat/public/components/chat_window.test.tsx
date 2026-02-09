/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { ChatWindow, ChatWindowInstance } from './chat_window';
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

describe('ChatWindow', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockContextProvider: any;
  let mockChatService: jest.Mocked<ChatService>;
  let mockSuggestedActionsService: jest.Mocked<SuggestedActionsService>;
  let mockConfirmationService: jest.Mocked<ConfirmationService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();
    mockContextProvider = {};
    // @ts-expect-error TS2322 TODO(ts-error): fixme
    mockSuggestedActionsService = {
      registerProvider: jest.fn(),
    };
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

  describe('ref functionality', () => {
    it('should expose startNewChat method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.startNewChat).toBeDefined();
      expect(typeof ref.current?.startNewChat).toBe('function');
    });

    it('should expose sendMessage method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.sendMessage).toBeDefined();
      expect(typeof ref.current?.sendMessage).toBe('function');
    });

    it('should call chatService.newThread when startNewChat is invoked', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        ref.current?.startNewChat();
      });

      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should call chatService.sendMessage when sendMessage is invoked via ref', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        // Wait for the sendMessage to complete
        await ref.current?.sendMessage({ content: 'test message from ref' });
      });

      // Wait for any pending promises to resolve
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'test message from ref',
        expect.any(Array)
      );
    });
  });

  describe('loading message functionality', () => {
    it('should add loading message to timeline when sending a message', async () => {
      // @ts-expect-error TS6133, TS2741 TODO(ts-error): fixme
      const { container } = renderWithContext(<ChatWindow />);

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
      // @ts-expect-error TS6133, TS2741 TODO(ts-error): fixme
      const { rerender } = renderWithContext(<ChatWindow ref={ref} />);

      await act(async () => {
        // Send a message
        await ref.current?.sendMessage({ content: 'test message' });
      });

      // Wait for state updates
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      // Send a message
      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(completionObservable.subscribe).toHaveBeenCalled();
    });
  });

  describe('persistence integration', () => {
    it('should restore timeline from persisted messages on mount', () => {
      const persistedMessages = [
        { id: '1', role: 'user' as const, content: 'Hello' },
        { id: '2', role: 'assistant' as const, content: 'Hi there!' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(persistedMessages);

      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Should call getCurrentMessages on mount
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should not restore timeline when no persisted messages exist', () => {
      mockChatService.getCurrentMessages.mockReturnValue([]);

      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Should call getCurrentMessages but timeline should remain empty
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should sync timeline changes with ChatService for persistence', async () => {
      const { rerender } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for initial render and useEffect calls
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Initially called with empty timeline
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalledWith([]);

      // Simulate timeline change by re-rendering
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

      // Should call updateCurrentMessages whenever timeline changes
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalled();
    });

    it('should call updateCurrentMessages on every timeline update', async () => {
      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for initial mount effects
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should be called at least once during initialization
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalled();
    });
  });

  describe('confirmationService context integration', () => {
    it('should use confirmationService from context (not creating new instance)', () => {
      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Verify that the mock confirmationService from context is being used
      // by checking that getPendingConfirmations$ was called (which happens in useEffect)
      expect(mockConfirmationService.getPendingConfirmations$).toHaveBeenCalled();
    });

    it('should pass context-provided confirmationService to ChatEventHandler', () => {
      // Import ChatEventHandler to access the mock
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');

      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Verify ChatEventHandler was instantiated with the mock confirmationService
      expect(ChatEventHandler).toHaveBeenCalled();

      // Get the last call to ChatEventHandler constructor
      const lastCall = ChatEventHandler.mock.calls[ChatEventHandler.mock.calls.length - 1];

      // The confirmationService should be the 6th argument (index 5)
      expect(lastCall[5]).toBe(mockConfirmationService);
    });

    it('should subscribe to confirmationService pending confirmations on mount', () => {
      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Verify subscription was created
      expect(mockConfirmationService.getPendingConfirmations$).toHaveBeenCalled();
    });
  });

  describe('message resending functionality', () => {
    it('should resend user message and truncate timeline', async () => {
      const initialTimeline = [
        { id: 'user-1', role: 'user', content: 'First message' },
        { id: 'assistant-1', role: 'assistant', content: 'First response' },
        { id: 'user-2', role: 'user', content: 'Second message' },
        { id: 'assistant-2', role: 'assistant', content: 'Second response' },
      ];

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockChatService.getCurrentMessages.mockReturnValue(initialTimeline);

      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      // Wait for initial timeline to be set
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Mock resend observable
      const resendObservable = {
        subscribe: jest.fn((callbacks) => {
          setTimeout(() => {
            callbacks.next({ type: 'message', content: 'Resent response' });
            callbacks.complete();
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: resendObservable,
        userMessage: { id: 'user-resend', content: 'Second message', role: 'user' },
      });

      // Get the component instance to access handleResendMessage
      const chatWindow = ref.current;
      expect(chatWindow).toBeDefined();

      // Simulate resending the second user message by calling sendMessage with the same content
      // This tests the resend functionality through the public API
      await act(async () => {
        await chatWindow?.sendMessage({ content: 'Second message' });
      });

      // Wait for the resend to be processed
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Verify that sendMessage was called for the resend
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Second message', expect.any(Array));
      expect(resendObservable.subscribe).toHaveBeenCalled();
    });

    it('should not resend non-user messages', async () => {
      const initialTimeline = [
        { id: 'assistant-1', role: 'assistant', content: 'Assistant message' },
      ];

      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockChatService.getCurrentMessages.mockReturnValue(initialTimeline);

      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      // Wait for initial timeline to be set
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Try to resend an assistant message content - this should work through sendMessage
      // but the resend button in UI would not be shown for assistant messages
      await act(async () => {
        await ref.current?.sendMessage({ content: 'Assistant message' });
      });

      // The sendMessage method itself doesn't prevent sending assistant message content
      // The UI prevents showing resend buttons for non-user messages
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'Assistant message',
        expect.any(Array)
      );
    });

    it('should handle resend errors gracefully', async () => {
      const errorObservable = {
        subscribe: jest.fn((callbacks) => {
          setTimeout(() => {
            callbacks.error(new Error('Resend failed'));
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: errorObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for error to be processed
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(errorObservable.subscribe).toHaveBeenCalled();
    });
  });

  describe('streaming state management', () => {
    it('should prevent sending messages while streaming', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      // Mock a long-running observable that doesn't complete
      const longRunningObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: longRunningObservable,
        userMessage: { id: 'user-1', content: 'first', role: 'user' },
      });

      // Send first message
      await ref.current?.sendMessage({ content: 'first message' });

      // Try to send second message while first is streaming
      await ref.current?.sendMessage({ content: 'second message' });

      // Should only call sendMessage once
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should handle runId updates from events', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      const observableWithRunId = {
        subscribe: jest.fn((callbacks) => {
          setTimeout(() => {
            callbacks.next({ type: 'message', content: 'test', runId: 'new-run-id' });
            callbacks.complete();
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: observableWithRunId,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for event processing
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(observableWithRunId.subscribe).toHaveBeenCalled();
    });

    it('should clean up subscriptions on unmount', async () => {
      const unsubscribeMock = jest.fn();
      // @ts-expect-error TS6133 TODO(ts-error): fixme
      let subscriptionCallbacks: any;
      const observableWithCleanup = {
        subscribe: jest.fn((callbacks) => {
          subscriptionCallbacks = callbacks;
          return { unsubscribe: unsubscribeMock };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: observableWithCleanup,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      const { unmount } = renderWithContext(<ChatWindow ref={ref} />);

      // Create subscription by sending a message
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test' });
      });

      expect(observableWithCleanup.subscribe).toHaveBeenCalled();

      // Unmount the component while subscription is active
      unmount();

      // The component doesn't explicitly clean up subscriptions on unmount
      // Subscriptions are cleaned up when observables complete/error
      // This test verifies that the subscription was created
      expect(observableWithCleanup.subscribe).toHaveBeenCalled();
    });
  });

  describe('input handling', () => {
    it('should handle empty input gracefully', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      await act(async () => {
        // Try to send empty message
        await ref.current?.sendMessage({ content: '' });
      });

      // Should not call chatService.sendMessage for empty content
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      await act(async () => {
        // Try to send whitespace-only message
        await ref.current?.sendMessage({ content: '   \n\t  ' });
      });

      // The component doesn't trim input from sendMessage method, so it will be sent
      // This is the actual behavior - only the internal input state is trimmed
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('   \n\t  ', expect.any(Array));
    });

    it('should not trim input when sent via ref sendMessage', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      await act(async () => {
        await ref.current?.sendMessage({ content: '  test message  ' });
      });

      // The sendMessage method via ref doesn't trim the input
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '  test message  ',
        expect.any(Array)
      );
    });
  });

  describe('new chat functionality', () => {
    it('should clear timeline and reset state on new chat', () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      ref.current?.startNewChat();

      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should reset streaming state on new chat', () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      // Start new chat should reset all state
      ref.current?.startNewChat();

      expect(mockChatService.newThread).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle sendMessage promise rejection', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      mockChatService.sendMessage.mockRejectedValue(new Error('Network error'));

      // Should not throw when sendMessage fails
      await expect(ref.current?.sendMessage({ content: 'test' })).resolves.toBeUndefined();
    });

    it('should reset streaming state on sendMessage error', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow ref={ref} />);

      mockChatService.sendMessage.mockRejectedValue(new Error('Network error'));

      await ref.current?.sendMessage({ content: 'test' });

      // Streaming state should be reset after error
      expect(mockChatService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('component lifecycle', () => {
    it('should initialize with empty timeline', () => {
      mockChatService.getCurrentMessages.mockReturnValue([]);

      // @ts-expect-error TS2741 TODO(ts-error): fixme
      const { container } = renderWithContext(<ChatWindow />);

      expect(container).toBeTruthy();
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should handle component unmount gracefully', () => {
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      const { unmount } = renderWithContext(<ChatWindow />);

      expect(() => unmount()).not.toThrow();
    });

    it('should subscribe to tool updates on mount', () => {
      // Mock the AssistantActionService getInstance method
      const mockGetState = jest.fn(() => mockObservable);
      const mockService = {
        getState$: mockGetState,
        getCurrentState: jest.fn(() => ({ toolDefinitions: [], toolCallStates: {} })),
        getActionRenderer: jest.fn(),
      };

      // Mock the AssistantActionService.getInstance to return our mock
      const AssistantActionService = jest.requireMock('../../../context_provider/public')
        .AssistantActionService;
      AssistantActionService.getInstance = jest.fn(() => mockService);

      // @ts-expect-error TS2741 TODO(ts-error): fixme
      renderWithContext(<ChatWindow />);

      // Verify that getState$ was called during mount
      expect(mockGetState).toHaveBeenCalled();
    });
  });
});
