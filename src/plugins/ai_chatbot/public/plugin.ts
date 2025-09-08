/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Plugin, CoreSetup, CoreStart, AppMountParameters } from '../../../core/public';
import {
  AIChatbotSetupDependencies,
  AIChatbotStartDependencies,
  AIChatbotSetup,
  AIChatbotStart,
} from './types';

export class AIChatbotPlugin
  implements Plugin<AIChatbotSetup, AIChatbotStart, AIChatbotSetupDependencies, AIChatbotStartDependencies> {

  public setup(
    core: CoreSetup<AIChatbotStartDependencies, AIChatbotStart>,
    deps: AIChatbotSetupDependencies
  ): AIChatbotSetup {
    console.log('🤖 AI Chatbot Plugin Setup');

    return {};
  }

  public start(core: CoreStart, deps: AIChatbotStartDependencies): AIChatbotStart {
    console.log('🚀 AI Chatbot Plugin Start');
    console.log('🔍 Available plugins:', Object.keys(deps));
    console.log('🔍 Context Provider available:', !!deps.contextProvider);
    console.log('🔍 UI Actions available:', !!deps.uiActions);

    // Make services available globally for components
    (window as any).aiChatbotServices = {
      uiActions: deps.uiActions,
      contextProvider: deps.contextProvider,
      core,
    };

    let flyoutInstance: any = null;

    // Add chatbot toggle to chrome
    this.addChatbotToggle(core, () => {
      if (flyoutInstance) {
        flyoutInstance.close();
        flyoutInstance = null;
      } else {
        this.openChatbotFlyout(core, deps).then(instance => {
          flyoutInstance = instance;
        });
      }
    });

    return {
      openChatbot: () => {
        console.log('🤖 Opening AI Chatbot Flyout');
        if (!flyoutInstance) {
          this.openChatbotFlyout(core, deps).then(instance => {
            flyoutInstance = instance;
          });
        }
      },
      closeChatbot: () => {
        console.log('🤖 Closing AI Chatbot Flyout');
        if (flyoutInstance) {
          flyoutInstance.close();
          flyoutInstance = null;
        }
      },
    };
  }

  private addChatbotToggle(core: CoreStart, onClick: () => void) {
    // Add a header action button for the chatbot
    core.chrome.navControls.registerRight({
      order: 1000,
      mount: (element) => {
        const button = document.createElement('button');
        button.innerHTML = '🤖 AI Assistant';
        button.className = 'euiButton euiButton--primary euiButton--small';
        button.onclick = onClick;
        element.appendChild(button);
        
        return () => {
          element.removeChild(button);
        };
      },
    });
  }

  private async openChatbotFlyout(core: CoreStart, deps: AIChatbotStartDependencies) {
    const { renderChatbotFlyout } = await import('./flyout');
    return renderChatbotFlyout(core, deps);
  }

  public stop() {
    console.log('🛑 AI Chatbot Plugin Stop');
    delete (window as any).aiChatbotServices;
  }
}