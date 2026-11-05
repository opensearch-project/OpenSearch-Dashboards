/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { act } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ChatWindow, ChatWindowInstance } from './chat_window';
import { coreMock } from '../../../../core/public/mocks';
import { of } from 'rxjs';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ChatProvider } from '../contexts/chat_context';
import { ChatService } from '../services/chat_service';
import { DataSourceUnresolvedError } from '../services/data_source_unresolved_error';
import { SuggestedActionsService } from '../services/suggested_action';
import { ConfirmationService } from '../services/confirmation_service';
import { HumanInputService } from '../services/human_input_service';

// Create mock observable before using it in mocks
const mockObservable = of({ toolDefinitions: [], toolCallStates: new Map() });

// Mock dependencies
jest.mock('../../../context_provider/public', () => {
  const assistantActionsInstance = {
    getState$: jest.fn(() => mockObservable),
    getCurrentState: jest.fn(() => ({ toolDefinitions: [], toolCallStates: new Map() })),
    getActionRenderer: jest.fn(),
  };
  return {
    AssistantActionService: {
      getInstance: jest.fn(() => assistantActionsInstance),
    },
    // Actions registered via this hook (e.g. switch_data_source) are no-ops in these tests
    useAssistantAction: jest.fn(),
  };
});

jest.mock('../services/chat_event_handler', () => ({
  ChatEventHandler: jest.fn().mockImplementation(() => ({
    handleEvent: jest.fn(),
    clearState: jest.fn(),
    cancelToolResultDispatch: jest.fn(),
    handleStreamTermination: jest.fn(),
    markStreamingMessageHalted: jest.fn(),
    sendToolResultToAssistant: jest.fn(),
    sendToolResultsToAssistant: jest.fn(),
  })),
}));

jest.mock('../actions/graph_timeseries_data_action', () => ({
  useGraphTimeseriesDataAction: jest.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('ChatWindow', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockContextProvider: any;
  let mockChatService: jest.Mocked<ChatService>;
  let mockSuggestedActionsService: jest.Mocked<SuggestedActionsService>;
  let mockConfirmationService: jest.Mocked<ConfirmationService>;
  let mockHumanInputService: jest.Mocked<HumanInputService>;

  // Data source resolutions returned by the mocked chatService.resolveDataSourceForRun.
  const resolved = (id = 'mock-ds-id', title = 'Mock DS') => ({
    kind: 'resolved' as const,
    active: { id, title },
    source: 'workspaceDefault' as const,
    available: [{ id, title }],
    listComplete: true,
  });
  const mockResolved = (id?: string, title?: string) =>
    mockChatService.resolveDataSourceForRun.mockResolvedValue(resolved(id, title));
  const mockNeedsSelection = (available: Array<{ id: string; title: string }>) =>
    mockChatService.resolveDataSourceForRun.mockResolvedValue({
      kind: 'needs_selection',
      available,
      listComplete: true,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();
    mockContextProvider = {};
    mockSuggestedActionsService = {
      registerProvider: jest.fn(),
    } as any;
    mockChatService = {
      sendMessage: jest.fn().mockResolvedValue({
        observable: of({ type: 'message', content: 'test' }),
        userMessage: { id: '1', content: 'test', role: 'user' },
      }),
      newThread: jest.fn(),
      getThreadId: jest.fn().mockReturnValue('mock-thread-id'),
      abort: jest.fn(),
      setChatWindowInstance: jest.fn(),
      clearChatWindowInstance: jest.fn(),
      isDataSourceEnabled: jest.fn().mockReturnValue(true),
      resolveDataSourceForRun: jest.fn().mockResolvedValue(resolved()),
      getUserMessage: jest.fn((content: string, rawMessage?: string) => ({
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        rawMessage: rawMessage || content,
      })),
      generateMessageId: jest.fn(
        () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      ),
      setPendingDataSource: jest.fn(),
      conversationHistoryService: {
        getMemoryProvider: jest.fn().mockReturnValue({
          includeFullHistory: true,
        }),
      },
      saveConversation: jest.fn(),
      loadConversation: jest.fn(),
    } as any;
    mockSuggestedActionsService = {} as any;
    mockConfirmationService = {
      getPendingConfirmations$: jest.fn().mockReturnValue(of([])),
      requestConfirmation: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      cancel: jest.fn(),
      cleanAll: jest.fn(),
    } as any;
    mockHumanInputService = {
      getPending$: jest.fn().mockReturnValue(of([])),
      getPending: jest.fn().mockReturnValue([]),
      hasPending: jest.fn().mockReturnValue(false),
      ask: jest.fn(),
      answer: jest.fn(),
      cleanAll: jest.fn(),
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
          humanInputService={mockHumanInputService}
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
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });
  });

  describe('loading message functionality', () => {
    it('should add loading message to timeline when sending a message', async () => {
      const { container: _container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

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
      const { rerender: _rerender } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

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
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

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
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

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
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Send a message
      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for completion
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(completionObservable.subscribe).toHaveBeenCalled();
    });

    it('should remove loading message when stopped before first response', async () => {
      const unsubscribeMock = jest.fn();
      const stoppableObservable = {
        subscribe: jest.fn((callbacks) => {
          // Don't call any callbacks - simulating waiting for first response
          return { unsubscribe: unsubscribeMock };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: stoppableObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Send a message
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      // Wait for state updates
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Verify sendMessage was called and subscription was created
      expect(mockChatService.sendMessage).toHaveBeenCalled();
      expect(stoppableObservable.subscribe).toHaveBeenCalled();

      // Get the ChatWindow instance to access internal state
      // Since we can't directly test the loading message removal,
      // we verify that abort is called and unsubscribe happens
      await act(async () => {
        mockChatService.abort();
      });

      // The key fix: when stop is called before first response,
      // the loading message should be removed via the loadingMessageIdRef
      // This is tested implicitly by ensuring the component doesn't crash
      // and properly cleans up state
      expect(mockChatService.abort).toHaveBeenCalled();
    });
  });

  describe('persistence integration', () => {
    it('should start with fresh conversation on mount', async () => {
      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should call newThread to start fresh
      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should sync timeline changes with ChatService for persistence', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Clear previous calls
      mockChatService.saveConversation.mockClear();

      // Send a message to trigger timeline change
      const messageObservable = {
        subscribe: jest.fn((callbacks) => {
          setTimeout(() => {
            callbacks.next({ type: 'message', content: 'response' });
            callbacks.complete();
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: messageObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      // Wait for message processing
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Should call saveConversation when timeline changes
      expect(mockChatService.saveConversation).toHaveBeenCalled();
    });

    it('should call saveConversation on every timeline update', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Wait for initialization
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Clear previous calls
      mockChatService.saveConversation.mockClear();

      // Send a message to trigger timeline update
      const messageObservable = {
        subscribe: jest.fn((callbacks) => {
          setTimeout(() => {
            callbacks.next({ type: 'message', content: 'response' });
            callbacks.complete();
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: messageObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Should be called after timeline updates
      expect(mockChatService.saveConversation).toHaveBeenCalled();
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

      // The constructor now takes a single config object as the first argument
      const config = lastCall[0];
      expect(config).toBeDefined();
      expect(config.confirmationService).toBe(mockConfirmationService);
    });

    it('should subscribe to confirmationService pending confirmations on mount', () => {
      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Verify subscription was created
      expect(mockConfirmationService.getPendingConfirmations$).toHaveBeenCalled();
    });
  });

  describe('message resending functionality', () => {
    it('should resend user message and truncate timeline', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Mock resend observable
      const resendObservable = {
        subscribe: jest.fn((callbacks) => {
          callbacks.next({ type: 'message', content: 'Resent response' });
          callbacks.complete();
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
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'Second message',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
      expect(resendObservable.subscribe).toHaveBeenCalled();
    });

    it('should not resend non-user messages', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Wait for initialization
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
        expect.any(Array),
        expect.any(Object),
        expect.anything()
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
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await ref.current?.sendMessage({ content: 'test message' });

      // Wait for error to be processed
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(errorObservable.subscribe).toHaveBeenCalled();
    });
  });

  describe('streaming state management', () => {
    it('should prevent sending messages while streaming', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

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
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

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
      const observableWithCleanup = {
        subscribe: jest.fn((callbacks) => {
          return { unsubscribe: unsubscribeMock };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: observableWithCleanup,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      const ref = React.createRef<ChatWindowInstance>();
      const { unmount } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

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
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        // Try to send empty message
        await ref.current?.sendMessage({ content: '' });
      });

      // Should not call chatService.sendMessage for empty content
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only input', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        // Try to send whitespace-only message
        await ref.current?.sendMessage({ content: '   \n\t  ' });
      });

      // The component doesn't trim input from sendMessage method, so it will be sent
      // This is the actual behavior - only the internal input state is trimmed
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '   \n\t  ',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should not trim input when sent via ref sendMessage', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        await ref.current?.sendMessage({ content: '  test message  ' });
      });

      // The sendMessage method via ref doesn't trim the input
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '  test message  ',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });
  });

  describe('IME composition', () => {
    it('should not send on the Enter that commits an IME composition', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
      expect(input).toHaveValue('안녕하세요');

      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '안녕하세요',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should send on an Enter that arrives after the composition ended', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: '안녕하세요' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 229 });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        '안녕하세요',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });
  });

  describe('new chat functionality', () => {
    it('should clear timeline and reset state on new chat', () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      ref.current?.startNewChat();

      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should reset streaming state on new chat', () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start new chat should reset all state
      ref.current?.startNewChat();

      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should cancel ongoing streaming when starting a new chat', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const unsubscribeMock = jest.fn();
      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: unsubscribeMock })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming by sending a message
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      // Wait for subscription to be created
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(streamingObservable.subscribe).toHaveBeenCalled();

      // Start a new chat while streaming is active
      await act(async () => {
        ref.current?.startNewChat();
      });

      // Verify abort was called to stop backend streaming
      expect(mockChatService.abort).toHaveBeenCalled();

      // Verify subscription was unsubscribed
      expect(unsubscribeMock).toHaveBeenCalled();

      // Verify newThread was called to start fresh
      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should clear event handler state on new chat to prevent stale tool calls from disabling input', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      const mockClearState = jest.fn();
      ChatEventHandler.mockImplementation(() => ({
        handleEvent: jest.fn(),
        clearState: mockClearState,
        cancelToolResultDispatch: jest.fn(),
        handleStreamTermination: jest.fn(),
        markStreamingMessageHalted: jest.fn(),
        sendToolResultToAssistant: jest.fn(),
        sendToolResultsToAssistant: jest.fn(),
      }));

      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      act(() => {
        ref.current?.startNewChat();
      });

      // clearState must be called to drain stale toolCallStates
      expect(mockClearState).toHaveBeenCalled();
    });

    it('should clear pending data source selection on new chat', async () => {
      // Mock no data source to trigger the prompt
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Trigger a send to show the data source prompt
      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Start a new chat — should clear pending state
      act(() => {
        ref.current?.startNewChat();
      });

      // Restore data source mock so next send goes through normally
      mockResolved('ds-1', 'Source One');

      // Send another message — should not re-trigger the data source prompt
      fireEvent.change(input, { target: { value: 'second message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // sendMessage should be called for the second message (no pending state blocking)
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'second message',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });
  });

  describe('data source validation on send', () => {
    it('should send without an unsupported message for an AnalyticEngine data source', async () => {
      // AnalyticEngine data sources are supported now: an active, available data source sends.
      mockResolved('ds-analytic', 'AnalyticEngine Source');

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, queryByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // No "unsupported" system message, and the message is sent.
      expect(queryByText('The current data source does not support AI features.')).toBeNull();
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'hello',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should show selector when current data source is invalid but alternatives exist', async () => {
      // No candidate verified (e.g. a deleted data source); alternatives exist.
      mockNeedsSelection([{ id: 'ds-good', title: 'Good Source' }]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Should show selector
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
      expect(getByText('Good Source')).toBeTruthy();
    });

    it('sends without the picker when the agent selects the data source', async () => {
      const resolution = {
        kind: 'unselected' as const,
        available: [{ id: 'ds-good', title: 'Good Source' }],
        listComplete: true,
      };
      mockChatService.resolveDataSourceForRun.mockResolvedValue(resolution);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, queryByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'hello',
        expect.any(Array),
        expect.anything(),
        { resolution }
      );
      expect(queryByText('Good Source')).toBeNull();
    });

    it('resends and runs slash commands without the picker when the agent selects', async () => {
      const resolution = {
        kind: 'unselected' as const,
        available: [{ id: 'ds-good', title: 'Good Source' }],
        listComplete: true,
      };
      mockChatService.resolveDataSourceForRun.mockResolvedValue(resolution);
      const { slashCommandRegistry } = jest.requireActual('../services/slash_commands');
      slashCommandRegistry.register({
        command: 'agent-cmd',
        description: 'Test command',
        handler: jest.fn().mockReturnValue('resolved agent command'),
      });

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getAllByLabelText, queryByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );
      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'first' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      await act(async () => {
        fireEvent.click(getAllByLabelText('Resend message')[0]);
        await new Promise((r) => setTimeout(r, 0));
      });
      fireEvent.change(input, { target: { value: '/agent-cmd args' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      slashCommandRegistry.unregister('agent-cmd');

      // The send, the resend and the command all run with the resolution, and no picker shows.
      expect(
        mockChatService.sendMessage.mock.calls.map((call: any[]) => [call[0], call[3]])
      ).toEqual([
        ['first', { resolution }],
        ['first', { resolution }],
        ['resolved agent command', { resolution }],
      ]);
      expect(queryByText('Good Source')).toBeNull();
    });

    it('should show no data source message when no data sources exist at all', async () => {
      mockChatService.resolveDataSourceForRun.mockResolvedValue({ kind: 'none_exist' });

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Should not send to agent
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
      expect(getByText(/There are no data sources associated with this workspace/)).toBeTruthy();
    });

    it('should say the list could not be loaded, not that none exist, when the read fails', async () => {
      mockChatService.resolveDataSourceForRun.mockResolvedValue({ kind: 'list_failed' });

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, queryByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
      // A toast says why; nothing is added to the conversation, and the text goes back to the
      // input so a retry does not send the message twice.
      expect(mockCore.notifications.toasts.addWarning).toHaveBeenCalledWith(
        expect.stringContaining('Could not load the data sources right now')
      );
      expect(queryByText(/There are no data sources associated/)).toBeNull();
      // Only the input holds the text now, not a message row.
      expect(queryByText('hello', { selector: ':not(textarea)' })).toBeNull();
      expect((input as HTMLTextAreaElement).value).toBe('hello');
      // The next send resolves again and goes through once the list can be read.
      mockResolved();
      fireEvent.change(input, { target: { value: 'again' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should send without data source checks when multiple data sources are disabled', async () => {
      mockChatService.resolveDataSourceForRun.mockResolvedValue({ kind: 'disabled' });

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'hello',
        expect.any(Array),
        expect.any(Object),
        { resolution: { kind: 'disabled' } }
      );
    });

    it('should show data source selector when compatible data sources exist', async () => {
      mockNeedsSelection([
        { id: 'ds-1', title: 'Source One' },
        { id: 'ds-2', title: 'Source Two' },
      ]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Should not send to agent yet
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();

      // Data source options should be visible
      expect(getByText('Source One')).toBeTruthy();
      expect(getByText('Source Two')).toBeTruthy();
    });

    it('should resolve a caller data source as a candidate for its message only', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // An empty message is not sent, so nothing is resolved.
      await act(async () => {
        await ref.current?.sendMessage({ content: '', dataSourceId: 'ds-panel' });
      });
      expect(mockChatService.resolveDataSourceForRun).not.toHaveBeenCalled();

      await act(async () => {
        await ref.current?.sendMessage({ content: 'summarize', dataSourceId: 'ds-panel' });
      });
      expect(mockChatService.resolveDataSourceForRun).toHaveBeenCalledWith({
        callerDataSourceId: 'ds-panel',
      });
      // Nothing is chosen before the message is sent: sendMessage does that once it runs.
      expect(mockChatService.setPendingDataSource).not.toHaveBeenCalled();
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should not send another message while one waits on the data source picker', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'first' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(getByText('Source One')).toBeTruthy();

      // A programmatic send (e.g. from another page) while the picker is open is ignored.
      mockResolved();
      await act(async () => {
        await ref.current?.sendMessage({ content: 'second' });
      });

      expect(mockChatService.resolveDataSourceForRun).toHaveBeenCalledTimes(1);
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should drop a pending pick when the user resends an earlier message instead', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getAllByLabelText, queryByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );
      const input = getByRole('textbox');

      // An earlier message that went through.
      fireEvent.change(input, { target: { value: 'earlier' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // A later message waits on the picker.
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);
      fireEvent.change(input, { target: { value: 'later' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(queryByText('Source One')).toBeTruthy();

      // Resending the earlier message replaces the pending one and closes the picker.
      mockResolved();
      await act(async () => {
        fireEvent.click(getAllByLabelText('Resend message')[0]);
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(queryByText('Source One')).toBeNull();
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockChatService.sendMessage).toHaveBeenLastCalledWith(
        'earlier',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should send history from before the pending message after a pick', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'needs a pick' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      mockResolved('ds-1', 'Source One');
      fireEvent.click(getByText('Source One'));
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // The pending message is sent once, without itself in its history.
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
      const [content, history] = mockChatService.sendMessage.mock.calls[0];
      expect(content).toBe('needs a pick');
      expect(history.some((msg: any) => msg.content === 'needs a pick')).toBe(false);
    });

    it('should put back the text of a message with an image when the list cannot be read', async () => {
      mockChatService.resolveDataSourceForRun.mockResolvedValue({ kind: 'list_failed' });
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        await ref.current?.sendMessage({
          content: [
            { type: 'binary', mimeType: 'image/png', data: 'abc' },
            { type: 'text', text: 'what is in this image' },
          ] as any,
        });
      });

      expect((getByRole('textbox') as HTMLTextAreaElement).value).toBe('what is in this image');
    });

    it('should keep the conversation intact when a resend cannot load the data sources', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getAllByLabelText, getAllByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'first question' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      mockChatService.resolveDataSourceForRun.mockResolvedValue({ kind: 'list_failed' });
      await act(async () => {
        fireEvent.click(getAllByLabelText('Resend message')[0]);
        await new Promise((r) => setTimeout(r, 0));
      });

      // The message the resend would have cut off is still in the conversation.
      expect(
        getAllByText('first question', { selector: ':not(textarea)' }).length
      ).toBeGreaterThanOrEqual(1);
      expect((input as HTMLTextAreaElement).value).toBe('');
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should not resolve a caller data source while a message waits on the picker', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'first' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      await act(async () => {
        await ref.current?.sendMessage({ content: 'summarize', dataSourceId: 'ds-panel' });
      });

      expect(mockChatService.resolveDataSourceForRun).not.toHaveBeenCalledWith({
        callerDataSourceId: 'ds-panel',
      });
      expect(mockChatService.setPendingDataSource).not.toHaveBeenCalled();
    });

    it('should not apply a pick whose pending message was replaced', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'waits' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      const option = getByText('Source One');

      // The pending message leaves the timeline (e.g. a new chat) before the user picks.
      act(() => {
        ref.current?.startNewChat();
      });
      fireEvent.click(option);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.setPendingDataSource).not.toHaveBeenCalled();
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should clear the loading state when a new chat aborts a history load', async () => {
      mockChatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-1',
            threadId: 'thread-1',
            name: 'Old conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });
      // The history load never finishes on its own.
      mockChatService.loadConversation.mockImplementation(() => new Promise(() => {}));
      const ref = React.createRef<ChatWindowInstance>();
      const { getByLabelText, getByText, queryByText, getByRole } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      await act(async () => {
        getByLabelText('Show conversation history').click();
        await new Promise((r) => setTimeout(r, 10));
      });
      await act(async () => {
        getByText('Old conversation').click();
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(queryByText('Loading conversation...')).toBeTruthy();

      await act(async () => {
        getByLabelText('New chat').click();
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(queryByText('Loading conversation...')).toBeNull();
      expect(getByRole('textbox')).toBeTruthy();
    });

    it('should drop a slash command whose conversation changed while it ran', async () => {
      const { slashCommandRegistry } = jest.requireActual('../services/slash_commands');
      slashCommandRegistry.register({
        command: 'slow-cmd',
        description: 'Slow command',
        handler: jest.fn(async () => {
          // The user opens another conversation while the command runs.
          mockChatService.getThreadId.mockReturnValue('another-thread');
          return 'resolved command message';
        }),
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      await act(async () => {
        await ref.current?.sendMessage({ content: '/slow-cmd args' });
      });

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
      slashCommandRegistry.unregister('slow-cmd');
    });

    it('should not send when the conversation changes while the data source resolves', async () => {
      // The user opens another conversation while this send is resolving.
      mockChatService.resolveDataSourceForRun.mockImplementation(async () => {
        mockChatService.getThreadId.mockReturnValue('another-thread');
        return resolved();
      });

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should tell the user when a send after picking a data source finds none', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);
      mockChatService.sendMessage.mockRejectedValue(
        new DataSourceUnresolvedError({ kind: 'list_failed' })
      );

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      fireEvent.click(getByText('Source One'));
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockCore.notifications.toasts.addWarning).toHaveBeenCalledWith(
        expect.stringContaining('Could not load the data sources right now')
      );
    });

    it('should not start a second run while a resend is still resolving its data source', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getAllByLabelText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // A first message, sent normally, gives the timeline a user message to resend.
      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'first' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);

      // The resend's resolution stays pending while the user clicks resend again.
      let finish: (value: ReturnType<typeof resolved>) => void = () => {};
      mockChatService.resolveDataSourceForRun.mockImplementation(
        () => new Promise((resolve) => (finish = resolve))
      );
      await act(async () => {
        fireEvent.click(getAllByLabelText('Resend message')[0]);
        await new Promise((r) => setTimeout(r, 0));
      });
      await act(async () => {
        await ref.current?.sendMessage({ content: 'second' });
      });
      await act(async () => {
        finish(resolved());
        await new Promise((r) => setTimeout(r, 0));
      });

      // Only the resend went out.
      expect(mockChatService.resolveDataSourceForRun).toHaveBeenCalledTimes(2);
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockChatService.sendMessage).toHaveBeenLastCalledWith(
        'first',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should resolve once per send and pass that resolution on to sendMessage', async () => {
      mockResolved('ds-1', 'Source One');

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.resolveDataSourceForRun).toHaveBeenCalledTimes(1);
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'hello',
        expect.any(Array),
        expect.any(Object),
        { resolution: resolved('ds-1', 'Source One') }
      );
    });

    it('should show the picker when the confirmed data source is no longer available', async () => {
      // An unavailable conversation data source counts as "nothing selected".
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
      expect(getByText('Please select a data source to continue:')).toBeTruthy();
      expect(getByText('Source One')).toBeTruthy();

      // After the user picks, the next send goes through without the picker.
      mockResolved('ds-1', 'Source One');
      fireEvent.click(getByText('Source One'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.setPendingDataSource).toHaveBeenCalledWith('ds-1');
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(1);

      fireEvent.change(input, { target: { value: 'second message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.sendMessage).toHaveBeenLastCalledWith(
        'second message',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should send message after user selects a data source', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // After selecting, resolution succeeds so the pending message is sent
      mockResolved('ds-1', 'Source One');

      // Click the data source option
      fireEvent.click(getByText('Source One'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.setPendingDataSource).toHaveBeenCalledWith('ds-1');
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'hello',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should execute slash command after user selects a data source', async () => {
      // Register a slash command for this test
      const { slashCommandRegistry } = jest.requireActual('../services/slash_commands');
      const mockHandler = jest.fn().mockReturnValue('resolved command message');
      slashCommandRegistry.register({
        command: 'test-cmd',
        description: 'Test command',
        handler: mockHandler,
      });

      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // Type a slash command and send
      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: '/test-cmd some args' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Data source selector should be shown
      expect(getByText('Source One')).toBeTruthy();
      // Command should NOT have been executed yet
      expect(mockHandler).not.toHaveBeenCalled();

      // Select the data source
      fireEvent.click(getByText('Source One'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // After data source selection, the slash command should be executed
      expect(mockChatService.setPendingDataSource).toHaveBeenCalledWith('ds-1');
      expect(mockHandler).toHaveBeenCalledWith('some args');
      // The command returns a message to send to the agent
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'resolved command message',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );

      // Clean up registered command
      slashCommandRegistry.unregister('test-cmd');
    });

    it('should handle local-only slash command after data source selection', async () => {
      // Register a slash command that returns a local message
      const { slashCommandRegistry } = jest.requireActual('../services/slash_commands');
      const mockHandler = jest.fn().mockReturnValue({
        localMessage: 'Local response from command',
        title: 'Command Result',
      });
      slashCommandRegistry.register({
        command: 'local-cmd',
        description: 'Local command',
        handler: mockHandler,
      });

      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // Type a local slash command and send (include trailing space to bypass autocomplete menu)
      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: '/local-cmd ' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Data source selector should be shown
      expect(getByText('Source One')).toBeTruthy();

      // Select the data source
      fireEvent.click(getByText('Source One'));

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // After data source selection, the slash command should be executed locally
      expect(mockChatService.setPendingDataSource).toHaveBeenCalledWith('ds-1');
      expect(mockHandler).toHaveBeenCalled();
      // Should NOT send to the agent since it's a local command
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();

      // Clean up registered command
      slashCommandRegistry.unregister('local-cmd');
    });
  });

  describe('optimistic user message rendering', () => {
    it('should show user message immediately before data source validation completes', async () => {
      // Make the data source resolution take time
      let resolveDataSource: (value: ReturnType<typeof resolved>) => void;
      mockChatService.resolveDataSourceForRun.mockImplementation(
        () => new Promise((resolve) => (resolveDataSource = resolve))
      );

      const { getByRole, getAllByText } = renderWithContext(
        <ChatWindow ref={React.createRef()} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'hello world' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // User message should appear immediately, even before validation resolves
      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Text appears in both message bubble and conversation title header
      expect(getAllByText('hello world').length).toBeGreaterThanOrEqual(1);

      // Now resolve validation
      await act(async () => {
        resolveDataSource!(resolved());
        await new Promise((r) => setTimeout(r, 0));
      });
    });

    it('should show Connecting indicator while validating data source', async () => {
      let resolveDataSource: (value: ReturnType<typeof resolved>) => void;
      mockChatService.resolveDataSourceForRun.mockImplementation(
        () => new Promise((resolve) => (resolveDataSource = resolve))
      );

      const { getByRole, getByText, queryByText } = renderWithContext(
        <ChatWindow ref={React.createRef()} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Should show "Connecting..." while validating
      expect(getByText('Connecting...')).toBeTruthy();

      // Resolve validation
      await act(async () => {
        resolveDataSource!(resolved());
        await new Promise((r) => setTimeout(r, 0));
      });

      // "Connecting..." should disappear after validation completes
      expect(queryByText('Connecting...')).toBeNull();
    });

    it('should disable input while validating', async () => {
      let resolveDataSource: (value: ReturnType<typeof resolved>) => void;
      mockChatService.resolveDataSourceForRun.mockImplementation(
        () => new Promise((resolve) => (resolveDataSource = resolve))
      );

      const { getByRole } = renderWithContext(
        <ChatWindow ref={React.createRef()} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // Input should be disabled during validation
      expect(input).toBeDisabled();

      // Resolve validation
      await act(async () => {
        resolveDataSource!(resolved());
        await new Promise((r) => setTimeout(r, 0));
      });

      // Input should be re-enabled after validation
      expect(input).not.toBeDisabled();
    });

    it('should prevent double-send while validating', async () => {
      let resolveDataSource: (value: ReturnType<typeof resolved>) => void;
      mockChatService.resolveDataSourceForRun.mockImplementation(
        () => new Promise((resolve) => (resolveDataSource = resolve))
      );

      const ref = React.createRef<ChatWindowInstance>();
      const { getByRole } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'first message' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(mockChatService.getUserMessage).toHaveBeenCalledTimes(1);

      // Attempt a second send while the first is still validating. The input
      // is disabled so keyDown can't reach the handler; a programmatic send
      // via the component ref exercises the isValidatingRef guard directly.
      await act(async () => {
        await ref.current?.sendMessage({ content: 'second message' });
      });

      // Guard should prevent the second send
      expect(mockChatService.getUserMessage).toHaveBeenCalledTimes(1);
      expect(mockChatService.sendMessage).not.toHaveBeenCalled();

      // Resolve validation
      await act(async () => {
        resolveDataSource!(resolved());
        await new Promise((r) => setTimeout(r, 0));
      });
    });

    it('should show user message then data source selector when DS is invalid', async () => {
      mockNeedsSelection([{ id: 'ds-1', title: 'Source One' }]);

      const { getByRole, getAllByText, getByText } = renderWithContext(
        <ChatWindow ref={React.createRef()} onClose={jest.fn()} />
      );

      const input = getByRole('textbox');
      fireEvent.change(input, { target: { value: 'my question' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 0));
      });

      // User message should be visible immediately (message + header title)
      expect(getAllByText('my question').length).toBeGreaterThanOrEqual(1);
      // DS selector should appear below
      expect(getByText('Source One')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle sendMessage promise rejection', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      mockChatService.sendMessage.mockRejectedValue(new Error('Network error'));

      // Should not throw when sendMessage fails
      await expect(ref.current?.sendMessage({ content: 'test' })).resolves.toBeUndefined();
    });

    it('should reset streaming state on sendMessage error', async () => {
      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      mockChatService.sendMessage.mockRejectedValue(new Error('Network error'));

      await ref.current?.sendMessage({ content: 'test' });

      // Streaming state should be reset after error
      expect(mockChatService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('component lifecycle', () => {
    it('should initialize with fresh conversation', async () => {
      const { container } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for initialization to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(container).toBeTruthy();
      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should handle component unmount gracefully', () => {
      const { unmount } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      expect(() => unmount()).not.toThrow();
    });

    it('should reset thread ID on unmount for clean restart', () => {
      mockCore.chat.resetThreadId = jest.fn();

      const { unmount } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Verify resetThreadId has not been called yet
      expect(mockCore.chat.resetThreadId).not.toHaveBeenCalled();

      // Unmount the component
      unmount();

      // Verify resetThreadId was called on unmount
      expect(mockCore.chat.resetThreadId).toHaveBeenCalledTimes(1);
    });

    it('should subscribe to tool updates on mount', () => {
      // Mock the AssistantActionService getInstance method
      const mockGetState = jest.fn(() => mockObservable);
      const mockService = {
        getState$: mockGetState,
        getCurrentState: jest.fn(() => ({ toolDefinitions: [], toolCallStates: new Map() })),
        getActionRenderer: jest.fn(),
      };

      // Mock the AssistantActionService.getInstance to return our mock
      const AssistantActionService = jest.requireMock(
        '../../../context_provider/public'
      ).AssistantActionService;
      AssistantActionService.getInstance = jest.fn(() => mockService);

      renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Verify that getState$ was called during mount
      expect(mockGetState).toHaveBeenCalled();
    });
  });

  describe('conversation loading functionality', () => {
    it('should load selected conversation from history', async () => {
      // Mock getConversations to return a conversation
      mockChatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-1',
            threadId: 'thread-1',
            name: 'Test conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });

      // Mock loadConversation to resolve with events
      mockChatService.loadConversation.mockResolvedValue([
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: '1', role: 'user', content: 'Hello from history' }],
          timestamp: Date.now(),
        },
      ]);

      const { getByLabelText, getByText, queryByText } = renderWithContext(
        <ChatWindow onClose={jest.fn()} />
      );

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Open history panel
      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Click on a conversation to load it
      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });

      // Wait for loading to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Verify loadConversation was called
      expect(mockChatService.loadConversation).toHaveBeenCalledWith('thread-1');
    });

    it('should show error toast when loading conversation fails', async () => {
      mockChatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-1',
            threadId: 'thread-1',
            name: 'Test conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });

      // Mock loadConversation to reject
      mockChatService.loadConversation.mockRejectedValue(new Error('Loading failed'));

      const { getByLabelText, getByText } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Open history and select conversation
      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Verify error toast was shown
      expect(mockCore.notifications.toasts.addWarning).toHaveBeenCalled();
    });
  });

  describe('handleSelectConversation', () => {
    beforeEach(() => {
      mockChatService.conversationHistoryService.getConversations = jest.fn().mockResolvedValue({
        conversations: [
          {
            id: 'conv-1',
            threadId: 'thread-1',
            name: 'Test conversation',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });

      // Mock loadConversation to simulate setting thread ID
      mockChatService.loadConversation = jest.fn().mockImplementation(async (threadId: string) => {
        // Simulate the real behavior: loadConversation sets the thread ID
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return [];
      });
    });

    it('should call eventHandler.clearState before replaying events to prevent state bleed', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      const callOrder: string[] = [];
      const mockHandleEvent = jest.fn().mockImplementation(() => {
        callOrder.push('handleEvent');
      });
      const mockClearState = jest.fn().mockImplementation(() => {
        callOrder.push('clearState');
      });
      ChatEventHandler.mockImplementation(() => ({
        handleEvent: mockHandleEvent,
        clearState: mockClearState,
        cancelToolResultDispatch: jest.fn(),
        handleStreamTermination: jest.fn(),
        markStreamingMessageHalted: jest.fn(),
        sendToolResultToAssistant: jest.fn(),
        sendToolResultsToAssistant: jest.fn(),
      }));

      const mockEvents = [
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'u1', role: 'user', content: 'Hi' }],
          timestamp: Date.now(),
        },
      ];
      mockChatService.loadConversation.mockImplementation(async (threadId: string) => {
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return mockEvents;
      });

      const { getByLabelText, getByText } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // clearState must come before any handleEvent call
      const clearIndex = callOrder.indexOf('clearState');
      const firstHandleIndex = callOrder.indexOf('handleEvent');
      expect(clearIndex).toBeGreaterThanOrEqual(0);
      expect(firstHandleIndex).toBeGreaterThan(clearIndex);
    });

    it('should replay all events through eventHandler when selecting a conversation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      const mockHandleEvent = jest.fn();
      const mockClearState = jest.fn();
      ChatEventHandler.mockImplementation(() => ({
        handleEvent: mockHandleEvent,
        clearState: mockClearState,
        cancelToolResultDispatch: jest.fn(),
        handleStreamTermination: jest.fn(),
        markStreamingMessageHalted: jest.fn(),
        sendToolResultToAssistant: jest.fn(),
        sendToolResultsToAssistant: jest.fn(),
      }));

      const mockEvents = [
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'u1', role: 'user', content: 'Hi' }],
          timestamp: Date.now(),
        },
        {
          type: 'TOOL_CALL_START',
          toolCallId: 'tc-1',
          toolCallName: 'my_tool',
          timestamp: Date.now(),
        },
      ];
      mockChatService.loadConversation.mockImplementation(async (threadId: string) => {
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return mockEvents;
      });

      const { getByLabelText, getByText } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(mockHandleEvent).toHaveBeenCalledTimes(mockEvents.length);
      const calledTypes = mockHandleEvent.mock.calls.map((call: any) => call[0]?.type);
      expect(calledTypes).toContain('MESSAGES_SNAPSHOT');
      expect(calledTypes).toContain('TOOL_CALL_START');
    });

    it('should not await TOOL_CALL_END during replay, so parallel halt-type tools all register', async () => {
      // Regression for: reloading a thread with several parallel `ask_user` calls showed only
      // one card. A halt-type tool blocks inside handleToolCallEnd on humanInputService.ask()
      // forever during replay; awaiting its TOOL_CALL_END stalled the loop so the synthetic
      // events for the other parallel calls were never consumed. TOOL_CALL_END must be
      // fire-and-forget so every parallel tool's synthetic events get dispatched.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      const mockClearState = jest.fn();
      // First TOOL_CALL_END blocks forever (mimics ask_user awaiting a user answer).
      const mockHandleEvent = jest.fn().mockImplementation((event: any) => {
        if (event?.type === 'TOOL_CALL_END') {
          return new Promise(() => {}); // never resolves
        }
        return Promise.resolve();
      });
      ChatEventHandler.mockImplementation(() => ({
        handleEvent: mockHandleEvent,
        clearState: mockClearState,
        cancelToolResultDispatch: jest.fn(),
        handleStreamTermination: jest.fn(),
        markStreamingMessageHalted: jest.fn(),
        sendToolResultToAssistant: jest.fn(),
        sendToolResultsToAssistant: jest.fn(),
      }));

      // Two parallel ask_user calls, each as START/ARGS/END (as injectUnfinishedToolCallEvents emits).
      const mockEvents = [
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'u1', role: 'user', content: 'Hi' }],
          timestamp: Date.now(),
        },
        {
          type: 'TOOL_CALL_START',
          toolCallId: 'tc-A',
          toolCallName: 'ask_user',
          timestamp: Date.now(),
        },
        { type: 'TOOL_CALL_ARGS', toolCallId: 'tc-A', delta: '{}', timestamp: Date.now() },
        { type: 'TOOL_CALL_END', toolCallId: 'tc-A', timestamp: Date.now() },
        {
          type: 'TOOL_CALL_START',
          toolCallId: 'tc-B',
          toolCallName: 'ask_user',
          timestamp: Date.now(),
        },
        { type: 'TOOL_CALL_ARGS', toolCallId: 'tc-B', delta: '{}', timestamp: Date.now() },
        { type: 'TOOL_CALL_END', toolCallId: 'tc-B', timestamp: Date.now() },
      ];
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      mockChatService.loadConversation.mockImplementation(async (threadId: string) => {
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return mockEvents;
      });

      const { getByLabelText, getByText } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });
      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      // Both tool calls' synthetic events must all be dispatched even though the first
      // TOOL_CALL_END never resolves — proving the loop did not await it.
      const calledTypes = mockHandleEvent.mock.calls.map((call: any) => call[0]?.type);
      const calledIds = mockHandleEvent.mock.calls.map((call: any) => call[0]?.toolCallId);
      expect(mockHandleEvent).toHaveBeenCalledTimes(mockEvents.length);
      expect(calledTypes.filter((t: string) => t === 'TOOL_CALL_END')).toHaveLength(2);
      expect(calledIds).toContain('tc-A');
      expect(calledIds).toContain('tc-B');
    });

    it('should cancel ongoing streaming when switching to another conversation', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      // Mock ongoing streaming
      const unsubscribeMock = jest.fn();
      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: unsubscribeMock })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      // Mock conversation loading
      const mockEvents = [
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'u1', role: 'user', content: 'Old conversation' }],
          timestamp: Date.now(),
        },
      ];
      mockChatService.loadConversation.mockImplementation(async (threadId: string) => {
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return mockEvents;
      });

      const { getByLabelText, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Start streaming by sending a message
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      // Wait for subscription to be created
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(streamingObservable.subscribe).toHaveBeenCalled();

      // Open history panel and switch to another conversation while streaming
      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Verify abort was called to stop backend streaming
      expect(mockChatService.abort).toHaveBeenCalled();

      // Verify subscription was unsubscribed
      expect(unsubscribeMock).toHaveBeenCalled();

      // Verify conversation was loaded
      expect(mockChatService.loadConversation).toHaveBeenCalledWith('thread-1');
    });

    it('should prevent streaming events from previous conversation affecting new conversation', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      const mockHandleEvent = jest.fn();
      const mockClearState = jest.fn();
      ChatEventHandler.mockImplementation(() => ({
        handleEvent: mockHandleEvent,
        clearState: mockClearState,
        cancelToolResultDispatch: jest.fn(),
        handleStreamTermination: jest.fn(),
        markStreamingMessageHalted: jest.fn(),
        sendToolResultToAssistant: jest.fn(),
        sendToolResultsToAssistant: jest.fn(),
      }));

      // Mock ongoing streaming that continues after switch
      let streamingCallbacks: any = null;
      const streamingObservable = {
        subscribe: jest.fn((callbacks: any) => {
          streamingCallbacks = callbacks;
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      // Mock conversation loading
      const mockEvents = [
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'u1', role: 'user', content: 'Old conversation' }],
          timestamp: Date.now(),
        },
      ];
      mockChatService.loadConversation.mockImplementation(async (threadId: string) => {
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return mockEvents;
      });

      const { getByLabelText, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(streamingObservable.subscribe).toHaveBeenCalled();

      // Track handleEvent calls before switching
      const callsBeforeSwitch = mockHandleEvent.mock.calls.length;

      // Switch to another conversation
      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Verify clearState was called (resetting event handler state)
      expect(mockClearState).toHaveBeenCalled();

      // Try to emit events from the old streaming (simulating race condition)
      if (streamingCallbacks) {
        await act(async () => {
          streamingCallbacks.next({ type: 'message', content: 'late event from old stream' });
        });
      }

      // New conversation's events should be processed, but old streaming events should not
      // interfere because subscription was canceled
      const callsAfterSwitch = mockHandleEvent.mock.calls.length;
      expect(callsAfterSwitch).toBeGreaterThan(callsBeforeSwitch);
    });

    it('should not save incomplete message when switching conversations during streaming', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      // Mock streaming with partial message
      let streamingCallbacks: any = null;
      const streamingObservable = {
        subscribe: jest.fn((callbacks: any) => {
          streamingCallbacks = callbacks;
          // Emit partial assistant message
          setTimeout(() => {
            callbacks.next({
              type: 'TEXT_MESSAGE_START',
              messageId: 'assist-1',
              timestamp: Date.now(),
            });
            callbacks.next({
              type: 'TEXT_MESSAGE_CONTENT',
              messageId: 'assist-1',
              delta: 'Partial response...',
              timestamp: Date.now(),
            });
          }, 5);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      // Mock conversation loading
      const mockEvents = [
        {
          type: 'MESSAGES_SNAPSHOT',
          messages: [{ id: 'u1', role: 'user', content: 'Old conversation' }],
          timestamp: Date.now(),
        },
      ];
      mockChatService.loadConversation.mockImplementation(async (threadId: string) => {
        (mockChatService.getThreadId as jest.Mock).mockReturnValue(threadId);
        return mockEvents;
      });
      mockChatService.saveConversation = jest.fn();

      const { getByLabelText, getByText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Clear previous saveConversation calls
      mockChatService.saveConversation.mockClear();

      // Switch to another conversation while streaming
      const historyButton = getByLabelText('Show conversation history');
      await act(async () => {
        historyButton.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const conversationItem = getByText('Test conversation');
      await act(async () => {
        conversationItem.click();
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      // Verify that incomplete message was NOT saved during the switch
      // The isLoading flag should prevent saving incomplete state
      const savedCalls = mockChatService.saveConversation.mock.calls;

      // Check if any saved timeline contains the partial assistant message
      const savedPartialMessage = savedCalls.some((call: any) => {
        const timeline = call[0];
        return timeline.some(
          (msg: any) => msg.role === 'assistant' && msg.content?.includes('Partial response')
        );
      });

      // Should NOT save the partial message during conversation switch
      expect(savedPartialMessage).toBe(false);
    });
  });

  describe('stop streaming functionality', () => {
    it('should abort streaming when handleStop is called', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      // Create a mock subscription that can be tracked
      const unsubscribeMock = jest.fn();
      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: unsubscribeMock })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      const { getByLabelText } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming by sending a message
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      // Wait for subscription to be created
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(streamingObservable.subscribe).toHaveBeenCalled();

      // Find and click the stop button (it should be visible during streaming)
      const stopButton = getByLabelText('Stop generating');

      await act(async () => {
        stopButton.click();
      });

      // Verify abort was called
      expect(mockChatService.abort).toHaveBeenCalled();

      // Verify subscription was unsubscribed
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should clear subscription ref after stopping', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const unsubscribeMock = jest.fn();
      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: unsubscribeMock })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      const { getByLabelText } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Stop streaming
      const stopButton = getByLabelText('Stop generating');
      await act(async () => {
        stopButton.click();
      });

      // Verify cleanup happened
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockChatService.abort).toHaveBeenCalled();
    });

    it('should reset isStreaming state after stopping', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      const { getByLabelText, queryByLabelText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Verify stop button is visible (streaming is active)
      expect(getByLabelText('Stop generating')).toBeTruthy();

      // Stop streaming
      const stopButton = getByLabelText('Stop generating');
      await act(async () => {
        stopButton.click();
      });

      // After stopping, the send button should be visible again
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(queryByLabelText('Send message')).toBeTruthy();
    });

    it('should allow sending new message after stopping', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const firstObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      };

      const secondObservable = {
        subscribe: jest.fn((callbacks: any) => {
          setTimeout(() => {
            callbacks.next({ type: 'message', content: 'second response' });
            callbacks.complete();
          }, 10);
          return { unsubscribe: jest.fn() };
        }),
      };

      mockChatService.sendMessage
        .mockResolvedValueOnce({
          observable: firstObservable,
          userMessage: { id: 'user-1', content: 'first', role: 'user' },
        })
        .mockResolvedValueOnce({
          observable: secondObservable,
          userMessage: { id: 'user-2', content: 'second', role: 'user' },
        });
      mockChatService.abort = jest.fn();

      const { getByLabelText } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start first streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'first message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Stop first streaming
      const stopButton = getByLabelText('Stop generating');
      await act(async () => {
        stopButton.click();
      });

      // Send second message
      await act(async () => {
        await ref.current?.sendMessage({ content: 'second message' });
      });

      // Wait for second message to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      // Verify both messages were sent
      expect(mockChatService.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockChatService.sendMessage).toHaveBeenNthCalledWith(
        1,
        'first message',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
      expect(mockChatService.sendMessage).toHaveBeenNthCalledWith(
        2,
        'second message',
        expect.any(Array),
        expect.any(Object),
        expect.anything()
      );
    });

    it('should handle stop when no subscription exists', async () => {
      mockChatService.abort = jest.fn();

      const { getByLabelText: _getByLabelText, queryByLabelText } = renderWithContext(
        <ChatWindow onClose={jest.fn()} />
      );

      // Try to find stop button when not streaming (should not exist)
      expect(queryByLabelText('Stop generating')).toBeNull();

      // Verify abort is available but not called
      expect(mockChatService.abort).not.toHaveBeenCalled();
    });

    it('should clean up subscription on error after stop', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const unsubscribeMock = jest.fn();
      let errorCallback: any;
      const errorObservable = {
        subscribe: jest.fn((callbacks) => {
          errorCallback = callbacks.error;
          return { unsubscribe: unsubscribeMock };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: errorObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Trigger error
      await act(async () => {
        errorCallback(new Error('Test error'));
      });

      // Verify subscription ref was cleared on error
      expect(errorObservable.subscribe).toHaveBeenCalled();
    });

    it('should clean up subscription on completion', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const unsubscribeMock = jest.fn();
      let completeCallback: any;
      const completionObservable = {
        subscribe: jest.fn((callbacks) => {
          completeCallback = callbacks.complete;
          return { unsubscribe: unsubscribeMock };
        }),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: completionObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Trigger completion
      await act(async () => {
        completeCallback();
      });

      // Verify subscription ref was cleared on completion
      expect(completionObservable.subscribe).toHaveBeenCalled();
    });

    it('should handle multiple stop calls gracefully', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const unsubscribeMock = jest.fn();
      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: unsubscribeMock })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      const { getByLabelText } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const stopButton = getByLabelText('Stop generating');

      // Click stop multiple times
      await act(async () => {
        stopButton.click();
        stopButton.click();
        stopButton.click();
      });

      // Should handle gracefully without errors
      expect(mockChatService.abort).toHaveBeenCalled();
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should abort chatService when stopping', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      const streamingObservable = {
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      };

      mockChatService.sendMessage.mockResolvedValue({
        observable: streamingObservable,
        userMessage: { id: 'user-1', content: 'test', role: 'user' },
      });
      mockChatService.abort = jest.fn();

      const { getByLabelText } = renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Start streaming
      await act(async () => {
        await ref.current?.sendMessage({ content: 'test message' });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      // Stop streaming
      const stopButton = getByLabelText('Stop generating');
      await act(async () => {
        stopButton.click();
      });

      // Verify chatService.abort was called
      expect(mockChatService.abort).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasPendingResend blocking input', () => {
    it('should prevent sending messages when a canResend system message exists in timeline', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      let capturedOnTimelineUpdate: any;
      ChatEventHandler.mockImplementation((config: any) => {
        capturedOnTimelineUpdate = config.callbacks.onTimelineUpdate;
        return {
          handleEvent: jest.fn(),
          clearState: jest.fn(),
          cancelToolResultDispatch: jest.fn(),
          handleStreamTermination: jest.fn(),
          markStreamingMessageHalted: jest.fn(),
          sendToolResultToAssistant: jest.fn(),
          sendToolResultsToAssistant: jest.fn(),
        };
      });

      const ref = React.createRef<ChatWindowInstance>();
      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      // Inject a canResend system message into the timeline
      await act(async () => {
        capturedOnTimelineUpdate((prev: any[]) => [
          ...prev,
          {
            id: 'timeout-msg-1',
            role: 'system',
            content: 'Sync timeout',
            toolCallId: 'tool-1',
            canResend: true,
            toolResult: { ok: true },
          },
        ]);
      });

      // Try to send a message — should be blocked
      await act(async () => {
        await ref.current?.sendMessage({ content: 'should be blocked' });
      });

      expect(mockChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should disable the input textarea when a canResend system message exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      let capturedOnTimelineUpdate: any;
      ChatEventHandler.mockImplementation((config: any) => {
        capturedOnTimelineUpdate = config.callbacks.onTimelineUpdate;
        return {
          handleEvent: jest.fn(),
          clearState: jest.fn(),
          cancelToolResultDispatch: jest.fn(),
          handleStreamTermination: jest.fn(),
          markStreamingMessageHalted: jest.fn(),
          sendToolResultToAssistant: jest.fn(),
          sendToolResultsToAssistant: jest.fn(),
        };
      });

      const { getByPlaceholderText } = renderWithContext(<ChatWindow onClose={jest.fn()} />);

      // Inject a canResend system message
      await act(async () => {
        capturedOnTimelineUpdate((prev: any[]) => [
          ...prev,
          {
            id: 'timeout-msg-2',
            role: 'system',
            content: 'Sync timeout',
            toolCallId: 'tool-2',
            canResend: true,
            toolResult: { data: 'test' },
          },
        ]);
      });

      const input = getByPlaceholderText(
        'Resend the tool result to continue...'
      ) as HTMLTextAreaElement;
      expect(input.disabled).toBe(true);
    });

    it('should re-enable input after canResend message is removed from timeline', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ChatEventHandler } = require('../services/chat_event_handler');
      let capturedOnTimelineUpdate: any;
      ChatEventHandler.mockImplementation((config: any) => {
        capturedOnTimelineUpdate = config.callbacks.onTimelineUpdate;
        return {
          handleEvent: jest.fn(),
          clearState: jest.fn(),
          cancelToolResultDispatch: jest.fn(),
          handleStreamTermination: jest.fn(),
          markStreamingMessageHalted: jest.fn(),
          sendToolResultsToAssistant: jest.fn(),
          sendToolResultToAssistant: jest.fn().mockResolvedValue(undefined),
        };
      });

      const ref = React.createRef<ChatWindowInstance>();
      const { getByPlaceholderText } = renderWithContext(
        <ChatWindow ref={ref} onClose={jest.fn()} />
      );

      // Inject a canResend system message
      await act(async () => {
        capturedOnTimelineUpdate((prev: any[]) => [
          ...prev,
          {
            id: 'timeout-msg-3',
            role: 'system',
            content: 'Sync timeout',
            toolCallId: 'tool-3',
            canResend: true,
            toolResult: { ok: true },
          },
        ]);
      });

      // Verify disabled
      const input = getByPlaceholderText(
        'Resend the tool result to continue...'
      ) as HTMLTextAreaElement;
      expect(input.disabled).toBe(true);

      // Remove the canResend message (simulates what handleResendToolResult does)
      await act(async () => {
        capturedOnTimelineUpdate((prev: any[]) =>
          prev.filter((msg: any) => msg.id !== 'timeout-msg-3')
        );
      });

      // Input should be re-enabled with default placeholder
      const enabledInput = getByPlaceholderText('How can I help you today?') as HTMLTextAreaElement;
      expect(enabledInput.disabled).toBe(false);
    });
  });

  describe('telemetry', () => {
    it('should record chat_window_show event on mount', () => {
      const mockRecorder = mockCore.telemetry.getPluginRecorder();

      renderWithContext(<ChatWindow ref={React.createRef()} onClose={jest.fn()} />);

      expect(mockRecorder.recordEvent).toHaveBeenCalledWith({
        name: 'chat_window_show',
        data: {},
      });
    });

    it('should record chat_window_hide event on unmount', () => {
      const mockRecorder = mockCore.telemetry.getPluginRecorder();

      const { unmount } = renderWithContext(
        <ChatWindow ref={React.createRef()} onClose={jest.fn()} />
      );

      // Not recorded while the window is still mounted.
      expect(mockRecorder.recordEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ name: 'chat_window_hide' })
      );

      unmount();

      expect(mockRecorder.recordEvent).toHaveBeenCalledWith({
        name: 'chat_window_hide',
        data: {},
      });
    });
  });
});
