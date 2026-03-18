/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { EuiText } from '@elastic/eui';
import { debounceTime, distinctUntilChanged, map, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import {
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
  ChatWindowState,
} from '../../../core/public';
import {
  ChatPluginSetup,
  ChatPluginStart,
  AppPluginStartDependencies,
  ChatLayoutMode,
} from './types';
import { ChatService } from './services/chat_service';
import { ChatHeaderButton } from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { SuggestedActionsService } from './services/suggested_action';
import { isChatEnabled } from '../common/chat_capabilities';
import { CHAT_DEFAULT_MAX_FILE_UPLOAD_BYTES, CHAT_MAX_FILE_ATTACHMENTS } from '../common';
import { CommandRegistryService } from './services/command_registry_service';
import { ConfirmationService } from './services/confirmation_service';
import { AgenticMemoryProvider } from './services/agentic_memory_provider';
import { ChatMountService } from './services/chat_mount_service';

const isValidChatWindowState = (test: unknown): test is ChatWindowState => {
  const state = test as ChatWindowState | null;
  return (
    typeof state === 'object' &&
    !!state &&
    typeof state.isWindowOpen === 'boolean' &&
    (state.windowMode === ChatLayoutMode.SIDECAR ||
      state.windowMode === ChatLayoutMode.FULLSCREEN) &&
    (typeof state.paddingSize === 'number' || typeof state.paddingSize === 'undefined')
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
  private chatMountService?: ChatMountService;
  private paddingSizeSubscription?: Subscription;
  private windowStateChangeSubscription?: Subscription;
  private coreSetup?: CoreSetup;

  constructor(private initializerContext: PluginInitializerContext) {}

  private setupChatbotWindowState({
    overlays,
    chat,
    chrome,
  }: Pick<CoreStart, 'overlays' | 'chat' | 'chrome'>) {
    if (!this.chatService) {
      throw new Error('Chat service not initialized.');
    }
    const WINDOW_STATE_KEY = 'chat.windowState';
    let storeState: unknown;
    try {
      const stateString = window.localStorage.getItem(WINDOW_STATE_KEY);
      if (stateString) {
        storeState = JSON.parse(stateString);
      }
      // eslint-disable-next-line no-empty
    } catch {}

    if (isValidChatWindowState(storeState)) {
      chat.setWindowState(storeState);
    }

    this.paddingSizeSubscription = overlays.sidecar
      .getSidecarConfig$()
      .pipe(
        map((config) => config?.paddingSize),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe((paddingSize) => {
        chat?.setWindowState({ paddingSize });
      });

    this.windowStateChangeSubscription = chat.getWindowState$().subscribe((newWindowState) => {
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
    const chatConfig = this.initializerContext.config.get<{
      enabled: boolean;
      agUiUrl?: string;
      mlCommonsAgentId?: string;
      fileUploadEnabled?: boolean;
      maxFileUploadBytes?: number;
      maxFileAttachments?: number;
    }>();
    const contextProviderConfig = deps.contextProvider ? { enabled: true } : { enabled: false };

    // Check enablement using the unified logic
    const isEnabled = isChatEnabled(
      chatConfig,
      contextProviderConfig,
      core.application.capabilities
    );

    // Always initialize chat service - core service handles enablement.
    // Pass core.http so the proxy URL includes basePath (required in dev when OSD uses a random basePath).
    this.chatService = new ChatService(
      core.uiSettings,
      core.chat,
      core.workspaces,
      core.http,
      chatConfig.fileUploadEnabled ?? true,
      chatConfig.maxFileUploadBytes ?? CHAT_DEFAULT_MAX_FILE_UPLOAD_BYTES,
      chatConfig.maxFileAttachments ?? CHAT_MAX_FILE_ATTACHMENTS
    );

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
        openWindow: async () => {
          await this.chatService!.openWindow();
        },
        closeWindow: this.chatService.closeWindow.bind(this.chatService),
      });
    }

    // Set up agentic memory provider only if ML Commons agent ID is configured
    if (this.coreSetup?.chat?.setMemoryProvider && chatConfig.mlCommonsAgentId) {
      try {
        const agenticMemoryProvider = new AgenticMemoryProvider(
          core.http,
          () => this.chatService?.getCurrentDataSourceId() ?? Promise.resolve(undefined)
        );
        this.coreSetup.chat.setMemoryProvider(agenticMemoryProvider);
      } catch (error) {
        // If agentic memory provider setup fails, fall back to default LocalStorageMemoryProvider
        // eslint-disable-next-line no-console
        console.warn('Failed to set up agentic memory provider, using default:', error);
      }
    }

    this.chatMountService = new ChatMountService();

    this.chatMountService.start({
      core,
      chatService: this.chatService!,
      contextProvider: deps.contextProvider,
      charts: deps.charts,
      suggestedActionsService: this.suggestedActionsService!,
      confirmationService: this.confirmationService,
    });

    // Register chat button in header with conditional visibility
    core.chrome.navControls.registerPrimaryHeaderRight({
      order: 1000,
      mount: (element) => {
        let unmountComponent: (() => void) | null = null;

        // Mount the component
        const mountPoint = toMountPoint(
          React.createElement(ChatHeaderButton, {
            core,
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
    this.chatMountService?.stop();
    this.paddingSizeSubscription?.unsubscribe();
    this.windowStateChangeSubscription?.unsubscribe();
    this.chatService?.destroy();
    this.confirmationService.cleanAll();
  }
}
