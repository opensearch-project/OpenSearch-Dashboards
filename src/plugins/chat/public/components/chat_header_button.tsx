/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useRef, useState, useEffect, useImperativeHandle } from 'react';
import { useEffectOnce, useUnmount } from 'react-use';
import { EuiToolTip, EuiButtonEmpty, EuiIcon } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart, SIDECAR_DOCKED_MODE } from '../../../../core/public';
import { ChatWindow, ChatWindowInstance } from './chat_window';
import { ChatProvider } from '../contexts/chat_context';
import { ChatService } from '../services/chat_service';
import { GlobalAssistantProvider } from '../../../context_provider/public';
import {
  MountPointPortal,
  OpenSearchDashboardsContextProvider,
} from '../../../opensearch_dashboards_react/public';
import { ContextProviderStart, TextSelectionMonitor } from '../../../context_provider/public';
import './chat_header_button.scss';
import { SuggestedActionsService } from '../services/suggested_action';
import gradientGenerateIcon from '../assets/gradient_generate_icon.svg';

export interface ChatHeaderButtonInstance {
  startNewConversation: ({ content }: { content: string }) => Promise<void>;
}

export enum ChatLayoutMode {
  SIDECAR = 'sidecar',
  FULLSCREEN = 'fullscreen',
}

interface ChatHeaderButtonProps {
  core: CoreStart;
  chatService: ChatService;
  contextProvider?: ContextProviderStart;
  charts?: any;
  suggestedActionsService: SuggestedActionsService;
}

export const ChatHeaderButton = React.forwardRef<ChatHeaderButtonInstance, ChatHeaderButtonProps>(
  ({ core, chatService, contextProvider, charts, suggestedActionsService }, ref) => {
    // Use ChatService as source of truth for window state
    const [isOpen, setIsOpen] = useState<boolean>(chatService.isWindowOpen());
    const [layoutMode, setLayoutMode] = useState<ChatLayoutMode>(chatService.getWindowMode());
    const sideCarRef = useRef<{ close: () => void }>();
    const chatWindowRef = useRef<ChatWindowInstance>(null);
    const flyoutMountPoint = useRef(null);

    const setMountPoint = useCallback((mountPoint) => {
      flyoutMountPoint.current = mountPoint;
    }, []);

    // Register ChatWindow ref with ChatService for external access
    useEffect(() => {
      chatService.setChatWindowRef(chatWindowRef);
      return () => {
        chatService.clearChatWindowRef();
      };
    }, [chatService]);

    const openSidecar = useCallback(() => {
      if (!flyoutMountPoint.current) {
        return;
      }

      try {
        sideCarRef.current = core.overlays.sidecar.open(flyoutMountPoint.current, {
          className: `chat-sidecar chat-sidecar--${layoutMode}`,
          config: {
            dockedMode:
              layoutMode === ChatLayoutMode.FULLSCREEN
                ? SIDECAR_DOCKED_MODE.TAKEOVER
                : SIDECAR_DOCKED_MODE.RIGHT,
            paddingSize: chatService.getPaddingSize(),
            isHidden: false,
          },
        });
      } catch (error) {
        return;
      }

      // Notify ChatService that window is now open
      chatService.setWindowState({ isWindowOpen: true });
    }, [core.overlays, layoutMode, chatService]);

    const closeSidecar = useCallback(() => {
      if (sideCarRef.current) {
        sideCarRef.current.close();
        sideCarRef.current = undefined;
      }
      // Notify ChatService that window is now closed
      chatService.setWindowState({ isWindowOpen: false });
    }, [chatService]);

    const toggleSidecar = useCallback(() => {
      if (isOpen) {
        closeSidecar();
      } else {
        openSidecar();
      }
    }, [isOpen, openSidecar, closeSidecar]);

    const toggleLayoutMode = useCallback(() => {
      const newLayoutMode =
        layoutMode === ChatLayoutMode.SIDECAR ? ChatLayoutMode.FULLSCREEN : ChatLayoutMode.SIDECAR;

      setLayoutMode(newLayoutMode);

      // Update sidecar config dynamically if currently open
      if (isOpen && sideCarRef.current) {
        core.overlays.sidecar.setSidecarConfig({
          dockedMode:
            newLayoutMode === ChatLayoutMode.FULLSCREEN
              ? SIDECAR_DOCKED_MODE.TAKEOVER
              : SIDECAR_DOCKED_MODE.RIGHT,
          paddingSize: newLayoutMode === ChatLayoutMode.FULLSCREEN ? window.innerHeight - 50 : 400,
          isHidden: false,
        });
      }

      // Update ChatService with new layout mode
      chatService.setWindowState({ windowMode: newLayoutMode });
    }, [layoutMode, isOpen, chatService, core.overlays.sidecar]);

    const startNewConversation = useCallback<ChatHeaderButtonInstance['startNewConversation']>(
      async ({ content }) => {
        openSidecar();
        chatWindowRef.current?.startNewChat();
        chatWindowRef.current?.sendMessage({ content });
      },
      [openSidecar]
    );

    useImperativeHandle(ref, () => ({ startNewConversation }), [startNewConversation]);

    // Listen to ChatService window state changes and sync local state
    useEffect(() => {
      const unsubscribe = chatService.onWindowStateChange(
        ({ isWindowOpen, windowMode }, changed) => {
          if (changed.isWindowOpen) {
            setIsOpen(isWindowOpen);
          }
          if (changed.windowMode) {
            setLayoutMode(windowMode as ChatLayoutMode);
          }
        }
      );
      return () => {
        unsubscribe();
      };
    }, [chatService]);

    // Register callbacks for external window open/close requests
    useEffect(() => {
      const unsubscribeOpen = chatService.onWindowOpenRequest(() => {
        if (!chatService.isWindowOpen()) {
          openSidecar();
        }
      });

      const unsubscribeClose = chatService.onWindowCloseRequest(() => {
        if (chatService.isWindowOpen()) {
          closeSidecar();
        }
      });

      return () => {
        unsubscribeOpen();
        unsubscribeClose();
      };
    }, [chatService, openSidecar, closeSidecar]);

    // Cleanup on unmount
    useUnmount(() => {
      if (sideCarRef.current) {
        sideCarRef.current.close();
      }
    });

    useEffectOnce(() => {
      if (!isOpen) {
        return;
      }

      const rafId = window.requestAnimationFrame(() => {
        openSidecar();
      });

      return () => {
        window.cancelAnimationFrame(rafId);
      };
    });

    // Use core chat service enablement logic
    const isChatAvailable = core.chat.isAvailable();

    if (!isChatAvailable) {
      return null;
    }

    return (
      <>
        {/* Text selection monitor - always active when chat UI is rendered */}
        <TextSelectionMonitor />

        <EuiToolTip content="Open Chat Assistant">
          <EuiButtonEmpty
            size="s"
            onClick={toggleSidecar}
            color="primary"
            aria-label="Toggle chat assistant"
            className="chatHeaderButton__button"
          >
            <EuiIcon type={gradientGenerateIcon} size="s" className="chatHeaderButton__icon" />
            <FormattedMessage id="chat.headerButton.askAI" defaultMessage="Ask AI" />
          </EuiButtonEmpty>
        </EuiToolTip>

        {/* Mount point for sidecar content */}
        <MountPointPortal setMountPoint={setMountPoint}>
          <div
            className={`chatHeaderButton__mountPoint ${
              isOpen
                ? 'chatHeaderButton__mountPoint--visible'
                : 'chatHeaderButton__mountPoint--hidden'
            }`}
          >
            <div className="chatHeaderButton__content">
              <OpenSearchDashboardsContextProvider services={{ core, contextProvider, charts }}>
                <GlobalAssistantProvider
                  onToolsUpdated={(_tools) => {
                    // Tools updated in chat
                  }}
                >
                  <ChatProvider
                    chatService={chatService}
                    suggestedActionsService={suggestedActionsService}
                  >
                    <ChatWindow
                      layoutMode={layoutMode}
                      onToggleLayout={toggleLayoutMode}
                      ref={chatWindowRef}
                      onClose={closeSidecar}
                    />
                  </ChatProvider>
                </GlobalAssistantProvider>
              </OpenSearchDashboardsContextProvider>
            </div>
          </div>
        </MountPointPortal>
      </>
    );
  }
);
