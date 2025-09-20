/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import {
  AppMountParameters,
  CoreSetup,
  CoreStart,
  Plugin,
  PluginInitializerContext,
} from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_NAME } from '../common';
import { ChatService } from './services/chat_service';
import { ChatHeaderButton } from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';

export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  private chatService: ChatService | undefined;

  constructor(private initializerContext: PluginInitializerContext) {}

  public setup(core: CoreSetup): ChatPluginSetup {
    // Register an application into the side navigation menu
    core.application.register({
      id: 'chat',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in opensearch_dashboards.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application
        return renderApp(coreStart, depsStart as AppPluginStartDependencies, params);
      },
    });

    // Return methods that should be available to other plugins
    return {
      getGreeting() {
        return i18n.translate('chat.greetingText', {
          defaultMessage: 'Hello from {name}!',
          values: {
            name: PLUGIN_NAME,
          },
        });
      },
    };
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
