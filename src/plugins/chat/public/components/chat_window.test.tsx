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
});
