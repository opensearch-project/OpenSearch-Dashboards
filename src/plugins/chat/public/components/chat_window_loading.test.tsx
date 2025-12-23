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

// Create mock observable
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

describe('ChatWindow Loading Functionality', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockContextProvider: any;
  let mockChatService: jest.Mocked<ChatService>;
  let mockSuggestedActionsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();
    mockContextProvider = {};
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
  });

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

  describe('image capture functionality', () => {
    it('should expose setCapturingImage method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.setCapturingImage).toBeDefined();
      expect(typeof ref.current?.setCapturingImage).toBe('function');
    });

    it('should expose setPendingImage method via ref', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      expect(ref.current).toBeDefined();
      expect(ref.current?.setPendingImage).toBeDefined();
      expect(typeof ref.current?.setPendingImage).toBe('function');
    });

    it('should allow calling setCapturingImage without errors', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      expect(() => {
        ref.current?.setCapturingImage(true);
      }).not.toThrow();

      expect(() => {
        ref.current?.setCapturingImage(false);
      }).not.toThrow();
    });

    it('should allow calling setPendingImage without errors', () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      expect(() => {
        ref.current?.setPendingImage('data:image/png;base64,test');
      }).not.toThrow();

      expect(() => {
        ref.current?.setPendingImage(undefined);
      }).not.toThrow();
    });

    it('should handle image data in sendMessage', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const imageData = 'data:image/png;base64,test';

      await act(async () => {
        await ref.current?.sendMessage({
          content: 'test message',
          imageData,
        });
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'test message',
        expect.any(Array),
        imageData
      );
    });

    it('should send default message when only image is provided', async () => {
      const ref = React.createRef<ChatWindowInstance>();

      renderWithContext(<ChatWindow ref={ref} onClose={jest.fn()} />);

      const imageData = 'data:image/png;base64,test';

      await act(async () => {
        await ref.current?.sendMessage({
          content: '',
          imageData,
        });
      });

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'Can you analyze this visualization?',
        expect.any(Array),
        imageData
      );
    });
  });
});
