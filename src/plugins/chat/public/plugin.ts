/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart, AppPluginStartDependencies } from './types';
import { ChatService } from './services/chat_service';
import { ChatHeaderButton } from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';

export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  private chatService: ChatService | undefined;

  constructor(private initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup): ChatPluginSetup {
    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart, deps: AppPluginStartDependencies): ChatPluginStart {
    // Get configuration
    const config = this.initializerContext.config.get<{ agUiUrl: string }>();

    // Initialize chat service with configured AG-UI URL
    this.chatService = new ChatService(config.agUiUrl);

    // Store reference to chat service for use in subscription
    const chatService = this.chatService;

    // Register chat button in header with conditional visibility
    core.chrome.navControls.registerRight({
      order: 1000,
      mount: (element) => {
        let isVisible = false;
        let unmountComponent: (() => void) | null = null;

        const updateVisibility = (currentAppId: string | undefined) => {
          const shouldShow = currentAppId && currentAppId.startsWith('explore');

          if (shouldShow && !isVisible) {
            // Mount the component
            const mountPoint = toMountPoint(
              React.createElement(ChatHeaderButton, {
                core,
                chatService,
                contextProvider: deps.contextProvider,
                charts: deps.charts,
              })
            );
            unmountComponent = mountPoint(element);
            isVisible = true;
          } else if (!shouldShow && isVisible) {
            // Unmount the component
            if (unmountComponent) {
              unmountComponent();
              unmountComponent = null;
            }
            isVisible = false;
          }
        };

        // Subscribe to app changes
        const subscription = core.application.currentAppId$.subscribe(updateVisibility);

        // Return cleanup function
        return () => {
          subscription.unsubscribe();
          if (unmountComponent) {
            unmountComponent();
          }
        };
      },
    });

    return {
      chatService: this.chatService,
    };
  }

  public stop() {}
}
