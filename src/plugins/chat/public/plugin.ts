/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiText } from '@elastic/eui';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart, AppPluginStartDependencies } from './types';
import { ChatService, ChatWindowState } from './services/chat_service';
import {
  ChatHeaderButton,
  ChatHeaderButtonInstance,
  ChatLayoutMode,
} from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { SuggestedActionsService } from './services/suggested_action';

const isValidChatWindowState = (test: unknown): test is ChatWindowState => {
  const state = test as ChatWindowState | null;
  return (
    typeof state === 'object' &&
    !!state &&
    typeof state.isWindowOpen === 'boolean' &&
    [ChatLayoutMode.SIDECAR, ChatLayoutMode.FULLSCREEN].includes(state.windowMode) &&
    typeof state.paddingSize === 'number'
  );
};

/**
 * @experimental
 * Chat plugin for AI-powered interactions. This plugin is experimental and will change in future releases.
 */
export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  private chatService: ChatService | undefined;
  private suggestedActionsService = new SuggestedActionsService();
  private paddingSizeSubscription?: Subscription;
  private unsubscribeWindowStateChange?: () => void;

  constructor(private initializerContext: PluginInitializerContext) {}

  private setupChatbotWindowState({ overlays }: Pick<CoreStart, 'overlays'>) {
    if (!this.chatService) {
      throw new Error('Chat service not initialized.');
    }
    const WINDOW_STATE_KEY = 'chat.windowState';
    let storeState;
    try {
      const stateString = window.localStorage.getItem(WINDOW_STATE_KEY);
      if (stateString) {
        storeState = JSON.parse(stateString);
      }
      // eslint-disable-next-line no-empty
    } catch {}

    if (isValidChatWindowState(storeState)) {
      this.chatService.setWindowState(storeState);
    }

    this.paddingSizeSubscription = overlays.sidecar
      .getSidecarConfig$()
      .pipe(
        map((config) => config?.paddingSize),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe((paddingSize) => {
        this.chatService?.setWindowState({ paddingSize });
      });

    this.unsubscribeWindowStateChange = this.chatService.onWindowStateChange((newWindowState) => {
      window.localStorage.setItem(WINDOW_STATE_KEY, JSON.stringify(newWindowState));
    });
  }

  public setup(): ChatPluginSetup {
    return {
      suggestedActionsService: this.suggestedActionsService.setup(),
    };
  }

  public start(core: CoreStart, deps: AppPluginStartDependencies): ChatPluginStart {
    // Get configuration
    const config = this.initializerContext.config.get<{ enabled: boolean; agUiUrl?: string }>();

    // Check if chat plugin is enabled
    if (!config.enabled) {
      return {
        chatService: undefined,
      };
    }

    const chatHeaderButtonRef = React.createRef<ChatHeaderButtonInstance>();

    // Initialize chat service (it will use the server proxy)
    this.chatService = new ChatService();

    // Store reference to chat service for use in subscription
    const chatService = this.chatService;

    // Register chat button in header with conditional visibility
    core.chrome.navControls.registerPrimaryHeaderRight({
      order: 1000,
      mount: (element) => {
        let unmountComponent: (() => void) | null = null;

        // Mount the component
        const mountPoint = toMountPoint(
          React.createElement(ChatHeaderButton, {
            core,
            chatService,
            contextProvider: deps.contextProvider,
            charts: deps.charts,
            ref: chatHeaderButtonRef,
            suggestedActionsService: this.suggestedActionsService!,
          })
        );
        unmountComponent = mountPoint(element);

        // Return cleanup function
        return () => {
          if (unmountComponent) {
            unmountComponent();
          }
        };
      },
    });

    core.chrome.globalSearch.registerSearchCommand({
      id: 'AI_CHATBOT_COMMAND',
      type: 'ACTIONS',
      inputPlaceholder: i18n.translate('chat.globalSearch.chatWithAI.placeholder', {
        defaultMessage: 'Search or chat with AI',
      }),
      run: async () => [
        React.createElement(
          EuiText,
          {
            size: 'xs',
            color: 'subdued',
          },
          i18n.translate('chat.globalSearch.chatWithAI.hints', {
            defaultMessage: 'Press Enter to chat with AI',
          })
        ),
      ],
      action: async ({ content }: { content: string }) => {
        await chatHeaderButtonRef.current?.startNewConversation({ content });
      },
    });

    this.setupChatbotWindowState(core);

    return {
      chatService: this.chatService,
    };
  }

  public stop() {
    this.paddingSizeSubscription?.unsubscribe();
    this.unsubscribeWindowStateChange?.();
  }
}
