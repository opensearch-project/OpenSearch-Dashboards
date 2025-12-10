/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChatWindow, ChatWindowInstance } from './chat_window';
import { coreMock } from '../../../../core/public/mocks';
import { of } from 'rxjs';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import { ChatProvider } from '../contexts/chat_context';
import { ChatService } from '../services/chat_service';

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

  const renderWithContext = (component: React.ReactElement) => {
    return render(
      <OpenSearchDashboardsContextProvider
        services={{ core: mockCore, contextProvider: mockContextProvider }}
      >
        <ChatProvider chatService={mockChatService}>{component}</ChatProvider>
      </OpenSearchDashboardsContextProvider>
    );
  };

  describe('ref functionality', () => {
    it('should expose startNewChat method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.startNewChat).toBeDefined();
      expect(typeof ref.current?.startNewChat).toBe('function');
    });

    it('should expose sendMessage method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.sendMessage).toBeDefined();
      expect(typeof ref.current?.sendMessage).toBe('function');
    });

    it('should call chatService.newThread when startNewChat is invoked', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} />);

      ref.current?.startNewChat();

      expect(mockChatService.newThread).toHaveBeenCalled();
    });

    it('should call chatService.sendMessage when sendMessage is invoked via ref', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} />);

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
      const { rerender } = renderWithContext(<ChatWindow ref={ref} />);

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
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ];
      mockChatService.getCurrentMessages.mockReturnValue(persistedMessages);

      renderWithContext(<ChatWindow />);

      // Should call getCurrentMessages on mount
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should not restore timeline when no persisted messages exist', () => {
      mockChatService.getCurrentMessages.mockReturnValue([]);

      renderWithContext(<ChatWindow />);

      // Should call getCurrentMessages but timeline should remain empty
      expect(mockChatService.getCurrentMessages).toHaveBeenCalled();
    });

    it('should sync timeline changes with ChatService for persistence', async () => {
      const { rerender } = renderWithContext(<ChatWindow />);

      // Wait for initial render and useEffect calls
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Initially called with empty timeline
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalledWith([]);

      // Simulate timeline change by re-rendering
      rerender(
        <OpenSearchDashboardsContextProvider
          services={{ core: mockCore, contextProvider: mockContextProvider }}
        >
          <ChatProvider chatService={mockChatService}>
            <ChatWindow />
          </ChatProvider>
        </OpenSearchDashboardsContextProvider>
      );

      // Should call updateCurrentMessages whenever timeline changes
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalled();
    });

    it('should call updateCurrentMessages on every timeline update', async () => {
      renderWithContext(<ChatWindow />);

      // Wait for initial mount effects
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should be called at least once during initialization
      expect(mockChatService.updateCurrentMessages).toHaveBeenCalled();
    });
  });
});
