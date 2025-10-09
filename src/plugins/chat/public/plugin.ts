/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CoreSetup, CoreStart, Plugin, PluginInitializerContext } from '../../../core/public';
import { ExpressionsSetup } from '../../expressions/public';
import { UiActionsStart } from '../../ui_actions/public';
import {
  ChatPluginSetup,
  ChatPluginSetupDependencies,
  ChatPluginStart,
  AppPluginStartDependencies,
} from './types';
import { ChatService } from './services/chat_service';
import { ChatHeaderButton } from './components/chat_header_button';
import { AiVisEmbeddableFactory } from './embeddable';
import { toMountPoint } from '../../opensearch_dashboards_react/public';
import { setExpressionLoader, setReactExpressionRenderer } from './services/expressions_services';

/**
 * @experimental
 * Chat plugin for AI-powered interactions. This plugin is experimental and will change in future releases.
 */
export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  private chatService: ChatService | undefined;

  constructor(private initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup,
    { expressions, embeddable, uiActions }: ChatPluginSetupDependencies
  ): ChatPluginSetup {
    // Register the AI Visualization embeddable factory during setup phase
    if (embeddable) {
      // Create a simple getStartServices function that returns a no-op executeTriggerActions
      const getStartServices = async () => {
        const [coreStart] = await core.getStartServices();
        return {
          // Use a no-op function for executeTriggerActions
          executeTriggerActions: () => Promise.resolve(),
          isEditable: () => true,
          core: coreStart,
        };
      };

      const factory = new AiVisEmbeddableFactory(getStartServices);
      embeddable.registerEmbeddableFactory(factory.type, factory);
    }

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart, deps: AppPluginStartDependencies): ChatPluginStart {
    // Get configuration
    const config = this.initializerContext.config.get<{ enabled: boolean; agUiUrl?: string }>();

    // Set expression loader and renderer if available
    if (deps.expressions) {
      setExpressionLoader(deps.expressions.ExpressionLoader);
      setReactExpressionRenderer(deps.expressions.ReactExpressionRenderer);
    }

    // Check if chat plugin is enabled and has required agUiUrl
    if (!config.enabled || !config.agUiUrl) {
      return {
        chatService: undefined,
      };
    }

    // Initialize chat service with configured AG-UI URL
    this.chatService = new ChatService(config.agUiUrl);

    // Store reference to chat service for use in subscription
    const chatService = this.chatService;

    // The embeddable factory is now registered in the setup phase

    // Register chat button in header with conditional visibility
    core.chrome.navControls.registerRight({
      order: 1000,
      mount: (element) => {
        let isVisible = false;
        let unmountComponent: (() => void) | null = null;

        const updateVisibility = (currentAppId: string | undefined) => {
          // Show the chat button in both explore and dashboards pages
          const shouldShow =
            currentAppId && (currentAppId.startsWith('explore') || currentAppId === 'dashboards');
          // eslint-disable-next-line no-console
          console.log('Current App ID:', currentAppId, ' - Should show chat button:', shouldShow);
          if (shouldShow && !isVisible) {
            // Mount the component
            const mountPoint = toMountPoint(
              React.createElement(ChatHeaderButton, {
                core,
                chatService,
                contextProvider: deps.contextProvider,
                charts: deps.charts,
                expressions: deps.expressions,
                dashboard: deps.dashboard,
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
