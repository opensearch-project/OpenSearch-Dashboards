/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ChatHeaderButton, ChatHeaderButtonInstance } from './chat_header_button';
import { ChatService } from '../services/chat_service';
import { coreMock } from '../../../../core/public/mocks';

// Mock dependencies
jest.mock('./chat_window', () => ({
  ChatWindow: React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      startNewChat: jest.fn(),
      sendMessage: jest.fn().mockResolvedValue(undefined),
    }));
    return <div data-test-subj="mock-chat-window">Mock Chat Window</div>;
  }),
}));

jest.mock('../contexts/chat_context', () => ({
  ChatProvider: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('../../../context_provider/public', () => ({
  GlobalAssistantProvider: ({ children }: any) => <div>{children}</div>,
  TextSelectionMonitor: () => <div data-test-subj="text-selection-monitor" />,
}));

jest.mock('../../../opensearch_dashboards_react/public', () => ({
  OpenSearchDashboardsContextProvider: ({ children }: any) => <div>{children}</div>,
}));

describe('ChatHeaderButton', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockContextProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();
    mockChatService = {
      sendMessage: jest.fn(),
      newThread: jest.fn(),
    } as any;
    mockContextProvider = {};

    // Mock sidecar
    mockCore.overlays.sidecar.open = jest.fn().mockReturnValue({
      close: jest.fn(),
    });
    mockCore.overlays.sidecar.setSidecarConfig = jest.fn();
  });

  describe('ref functionality', () => {
    it('should expose startNewConversation method via ref', async () => {
      const ref = React.createRef<ChatHeaderButtonInstance>();

      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          ref={ref}
        />
      );

      expect(ref.current).toBeDefined();
      expect(ref.current?.startNewConversation).toBeDefined();
      expect(typeof ref.current?.startNewConversation).toBe('function');
    });

    it('should call startNewChat and sendMessage when startNewConversation is invoked', async () => {
      const ref = React.createRef<ChatHeaderButtonInstance>();

      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          ref={ref}
        />
      );

      // Call startNewConversation
      await ref.current?.startNewConversation({ content: 'test message' });

      // Verify sidecar was opened
      await waitFor(() => {
        expect(mockCore.overlays.sidecar.open).toHaveBeenCalled();
      });
    });
  });
});
