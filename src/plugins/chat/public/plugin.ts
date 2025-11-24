/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiText } from '@elastic/eui';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Subscription, Observable, BehaviorSubject } from 'rxjs';

import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  ChatImplementationFunctions,
} from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart, AppPluginStartDependencies } from './types';
import { ChatService, ChatWindowState } from './services/chat_service';
import { ChatHeaderButton, ChatLayoutMode } from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { SuggestedActionsService } from './services/suggested_action';
import { isChatEnabled } from '../common/chat_capabilities';

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

    // Set fallback implementation for when chat is disabled
    if (core.chat?.setFallbackImplementation) {
      const fallbackImplementation: ChatImplementationFunctions = {
        // Message operations - return empty results when chat is disabled
        sendMessage: async (content: string, messages: any[]) => ({
          observable: null,
          userMessage: { id: '', role: 'user' as const, content },
        }),
        sendMessageWithWindow: async (
          content: string,
          messages: any[],
          options?: { clearConversation?: boolean }
        ) => ({
          observable: null,
          userMessage: { id: '', role: 'user' as const, content },
        }),

        // Thread management - return empty values when disabled
        getThreadId: () => '',
        getThreadId$: () => new BehaviorSubject<string>('').asObservable(),

        // Window management - return closed/default state when disabled
        isWindowOpen: () => false,
        openWindow: async () => {},
        closeWindow: async () => {},
        getWindowState: () => ({
          isWindowOpen: false,
          windowMode: 'sidecar' as const,
          paddingSize: 400, // Plugin-defined business logic default
        }),
        getWindowState$: () =>
          new BehaviorSubject({
            isWindowOpen: false,
            windowMode: 'sidecar' as const,
            paddingSize: 400, // Plugin-defined business logic default
          }).asObservable(),
        onWindowOpen: (callback: () => void) => () => {}, // Return no-op unsubscribe
        onWindowClose: (callback: () => void) => () => {}, // Return no-op unsubscribe
      };

      core.chat.setFallbackImplementation(fallbackImplementation);
    }

    return {
      suggestedActionsService: this.suggestedActionsService.setup(),
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

    // Always initialize chat service - core service handles enablement via NoOpChatService
    this.chatService = new ChatService(core.uiSettings);

    if (!isEnabled) {
      return {
        chatService: undefined,
      };
    }

    // Register all implementation functions with core chat service
    if (this.coreSetup?.chat?.setImplementation) {
      this.coreSetup.chat.setImplementation({
        // Message operations
        sendMessage: this.chatService.sendMessage.bind(this.chatService),
        sendMessageWithWindow: this.chatService.sendMessageWithWindow.bind(this.chatService),

        // Thread management
        getThreadId: this.chatService.getThreadId.bind(this.chatService),
        getThreadId$: this.chatService.getThreadId$.bind(this.chatService),

        // Window management
        isWindowOpen: this.chatService.isWindowOpen.bind(this.chatService),
        openWindow: this.chatService.openWindow.bind(this.chatService),
        closeWindow: this.chatService.closeWindow.bind(this.chatService),
        getWindowState: this.chatService.getWindowState.bind(this.chatService),
        getWindowState$: () => {
          // Create a mapped observable from the plugin's window state changes
          // Since plugin uses onWindowStateChange callback pattern, we need to convert it to observable
          return new Observable((subscriber) => {
            const unsubscribe = this.chatService?.onWindowStateChange((newState) => {
              subscriber.next(newState);
            });
            // Emit current state immediately
            subscriber.next(this.chatService?.getWindowState());
            return unsubscribe;
          });
        },
        onWindowOpen: this.chatService.onWindowOpenRequest.bind(this.chatService),
        onWindowClose: this.chatService.onWindowCloseRequest.bind(this.chatService),
      });
    }

    // Register suggested actions service with core chat service
    if (this.coreSetup?.chat?.setSuggestedActionsService) {
      const suggestedActionsServiceStart = this.suggestedActionsService.start();
      this.coreSetup.chat.setSuggestedActionsService(suggestedActionsServiceStart);
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
  }
}
