/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiText } from '@elastic/eui';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  ChatWindowState,
} from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart, AppPluginStartDependencies } from './types';
import { ChatService } from './services/chat_service';
import { ChatHeaderButton, ChatLayoutMode } from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { SuggestedActionsService } from './services/suggested_action';
import { isChatEnabled } from '../common/chat_capabilities';
import { CommandRegistryService } from './services/command_registry_service';
import { ConfirmationService } from './services/confirmation_service';

const isValidChatWindowState = (test: unknown): test is ChatWindowState => {
  const state = test as ChatWindowState | null;
  return (
    typeof state === 'object' &&
    !!state &&
    typeof state.isWindowOpen === 'boolean' &&
    // @ts-expect-error TS2345 TODO(ts-error): fixme
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
  private commandRegistryService = new CommandRegistryService();
  private confirmationService = new ConfirmationService();
  private paddingSizeSubscription?: Subscription;
  private unsubscribeWindowStateChange?: () => void;
  private coreSetup?: CoreSetup;

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

  public setup(core: CoreSetup): ChatPluginSetup {
    // Store core setup reference for later use
    this.coreSetup = core;
    const suggestedActionsSetup = this.suggestedActionsService.setup();
    const commandRegistrySetup = this.commandRegistryService.setup();

    // Register suggested actions service with core chat service
    if (this.coreSetup?.chat?.setSuggestedActionsService) {
      this.coreSetup.chat.setSuggestedActionsService(suggestedActionsSetup);
    }

    return {
      suggestedActionsService: suggestedActionsSetup,
      commandRegistry: commandRegistrySetup,
    };
  }

  public start(core: CoreStart, deps: AppPluginStartDependencies): ChatPluginStart {
    // Get plugin configuration (same as original implementation)
    const chatConfig = this.initializerContext.config.get<{ enabled: boolean; agUiUrl?: string }>();
    const contextProviderConfig = deps.contextProvider ? { enabled: true } : { enabled: false };

    // Check enablement using the unified logic
    const isEnabled = isChatEnabled(
      chatConfig,
      contextProviderConfig,
      core.application.capabilities
    );

    // Always initialize chat service - core service handles enablement
    this.chatService = new ChatService(core.uiSettings, core.chat, core.workspaces);

    if (!isEnabled) {
      return {
        chatService: undefined,
      };
    }

    // Register implementation functions with core chat service
    if (this.coreSetup?.chat?.setImplementation) {
      this.coreSetup.chat.setImplementation({
        // Only business logic operations
        sendMessage: this.chatService.sendMessage.bind(this.chatService),
        sendMessageWithWindow: this.chatService.sendMessageWithWindow.bind(this.chatService),
        openWindow: this.chatService.openWindow.bind(this.chatService),
        closeWindow: this.chatService.closeWindow.bind(this.chatService),
      });
    }

    // Register chat button in header with conditional visibility
    core.chrome.navControls.registerPrimaryHeaderRight({
      order: 1000,
      mount: (element) => {
        let unmountComponent: (() => void) | null = null;

        // Mount the component
        const mountPoint = toMountPoint(
          React.createElement(ChatHeaderButton, {
            core,
            chatService: this.chatService!,
            contextProvider: deps.contextProvider,
            charts: deps.charts,
            suggestedActionsService: this.suggestedActionsService!,
            confirmationService: this.confirmationService,
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
        await this.chatService!.sendMessageWithWindow(content, [], { clearConversation: true });
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
    this.chatService?.destroy();
    this.confirmationService.cleanAll();
  }
}
