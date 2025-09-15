/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { AppMountParameters, CoreSetup, CoreStart, Plugin } from '../../../core/public';
import { ChatPluginSetup, ChatPluginStart, AppPluginStartDependencies } from './types';
import { PLUGIN_NAME } from '../common';
import { ChatService } from './services/chat_service';
import { ChatHeaderButton } from './components/chat_header_button';
import { toMountPoint } from '../../opensearch_dashboards_react/public';

export class ChatPlugin implements Plugin<ChatPluginSetup, ChatPluginStart> {
  private chatService: ChatService | undefined;

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
    // Initialize chat service
    this.chatService = new ChatService();

    // Register chat button in header using toMountPoint
    core.chrome.navControls.registerRight({
      order: 1000,
      mount: toMountPoint(
        React.createElement(ChatHeaderButton, {
          core,
          chatService: this.chatService,
          contextProvider: deps.contextProvider,
        })
      ),
    });

    return {
      chatService: this.chatService,
    };
  }

  public stop() {}
}
