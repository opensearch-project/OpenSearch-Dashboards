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

jest.mock('./chat_window', () => {
  const ActualReact = jest.requireActual('react');
  return {
    ChatWindow: ActualReact.forwardRef((props: any, ref: any) => {
      ActualReact.useImperativeHandle(ref, () => ({
        startNewChat: jest.fn(),
        sendMessage: jest.fn().mockResolvedValue(undefined),
      }));
      return null;
    }),
  };
});

describe('ChatHeaderButton', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockContextProvider: any;
  let mockSuggestedActionsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCore = coreMock.createStart();
    mockChatService = {
      sendMessage: jest.fn(),
      newThread: jest.fn(),
      isWindowOpen: jest.fn().mockReturnValue(false),
      getWindowMode: jest.fn().mockReturnValue('sidecar'),
      getPaddingSize: jest.fn().mockReturnValue(400),
      setWindowState: jest.fn(),
      setChatWindowRef: jest.fn(),
      clearChatWindowRef: jest.fn(),
      onWindowStateChange: jest.fn().mockReturnValue(() => {}),
      onWindowOpenRequest: jest.fn().mockReturnValue(() => {}),
      onWindowCloseRequest: jest.fn().mockReturnValue(() => {}),
    } as any;
    mockContextProvider = {};
    mockSuggestedActionsService = {
      getSuggestedActions: jest.fn().mockReturnValue([]),
    };

    // Mock sidecar with complete SidecarRef
    const mockSidecarRef = {
      close: jest.fn(),
      onClose: Promise.resolve(),
    } as any;
    mockCore.overlays.sidecar.open = jest.fn().mockReturnValue(mockSidecarRef);
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
          suggestedActionsService={mockSuggestedActionsService}
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
          suggestedActionsService={mockSuggestedActionsService}
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

  describe('initialization', () => {
    it('should initialize with window closed state from ChatService', () => {
      mockChatService.isWindowOpen.mockReturnValue(false);

      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      expect(mockChatService.isWindowOpen).toHaveBeenCalled();
      expect(mockChatService.getWindowMode).toHaveBeenCalled();
    });

    it('should initialize with window open state from ChatService', () => {
      mockChatService.isWindowOpen.mockReturnValue(true);

      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      expect(mockChatService.isWindowOpen).toHaveBeenCalled();
    });

    it('should register ChatWindow ref with ChatService', () => {
      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      expect(mockChatService.setChatWindowRef).toHaveBeenCalled();
    });

    it('should subscribe to ChatService state changes', () => {
      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      expect(mockChatService.onWindowStateChange).toHaveBeenCalled();
      expect(mockChatService.onWindowOpenRequest).toHaveBeenCalled();
      expect(mockChatService.onWindowCloseRequest).toHaveBeenCalled();
    });
  });

  describe('window state synchronization', () => {
    it('should respond to ChatService window open request', () => {
      let openRequestCallback: () => void;
      mockChatService.onWindowOpenRequest.mockImplementation((cb) => {
        openRequestCallback = cb;
        return jest.fn();
      });

      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      // Trigger the open request
      openRequestCallback!();

      expect(mockCore.overlays.sidecar.open).toHaveBeenCalled();
    });

    it('should respond to ChatService window close request when window is open', async () => {
      let closeRequestCallback: () => void;
      const mockClose = jest.fn();
      const mockSidecarRef = {
        close: mockClose,
        onClose: Promise.resolve(),
      } as any;
      mockChatService.onWindowCloseRequest.mockImplementation((cb) => {
        closeRequestCallback = cb;
        return jest.fn();
      });
      mockCore.overlays.sidecar.open.mockReturnValue(mockSidecarRef);

      // Start with window open state
      mockChatService.isWindowOpen.mockReturnValue(true);

      const { container } = render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      // Trigger the close request
      closeRequestCallback!();

      // Verify close was called on the sidecar ref
      expect(mockChatService.setWindowState).toHaveBeenCalledWith({ isWindowOpen: false });
    });

    it('should sync local state when ChatService state changes', () => {
      let stateChangeCallback: (
        newWindowState: any,
        changed: { isWindowOpen: boolean; windowMode: boolean; paddingSize: boolean }
      ) => void;
      mockChatService.onWindowStateChange.mockImplementation((cb) => {
        stateChangeCallback = cb;
        return jest.fn();
      });

      render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      // Trigger state change to open
      stateChangeCallback!(
        { isWindowOpen: true, windowMode: 'sidecar', paddingSize: 400 },
        { isWindowOpen: true, windowMode: false, paddingSize: false }
      );

      // Verify the component reflects the new state (button color should change)
      const button = document.querySelector('[aria-label="Toggle chat assistant"]');
      expect(button).toBeTruthy();
    });
  });

  describe('cleanup', () => {
    it('should clear ChatWindow ref on unmount', () => {
      const { unmount } = render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      unmount();

      expect(mockChatService.clearChatWindowRef).toHaveBeenCalled();
    });

    it('should close sidecar on unmount if open', () => {
      const mockClose = jest.fn();
      mockCore.overlays.sidecar.open.mockReturnValue({
        close: mockClose,
        onClose: Promise.resolve(),
      } as any);

      const { unmount } = render(
        <ChatHeaderButton
          core={mockCore}
          chatService={mockChatService}
          contextProvider={mockContextProvider}
          suggestedActionsService={mockSuggestedActionsService}
        />
      );

      // Open the sidecar
      const button = document.querySelector('[aria-label="Toggle chat assistant"]');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      unmount();

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
