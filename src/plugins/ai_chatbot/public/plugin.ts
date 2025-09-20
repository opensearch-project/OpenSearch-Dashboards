/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  implements
    Plugin<AIChatbotSetup, AIChatbotStart, AIChatbotSetupDependencies, AIChatbotStartDependencies> {
  public setup(
    core: CoreSetup<AIChatbotStartDependencies, AIChatbotStart>,
    deps: AIChatbotSetupDependencies
  ): AIChatbotSetup {
    return {};
  }

  public start(core: CoreStart, deps: AIChatbotStartDependencies): AIChatbotStart {
    // Make services available globally for components (but disabled)
    (window as any).aiChatbotServices = {
      uiActions: deps.uiActions,
      contextProvider: deps.contextProvider,
      core,
      disabled: true,
    };

    let sidePanelInstance: any = null;

    // DISABLED: Add chatbot toggle to chrome
    // this.addChatbotToggle(core, () => {
    //   if (sidePanelInstance) {
    //     console.log('🔄 Closing existing side panel instance');
    //     sidePanelInstance.close();
    //     sidePanelInstance = null;
    //   } else {
    //     console.log('🚀 Opening new side panel instance');
    //     this.openChatbotSidePanel(core, deps).then((instance) => {
    //       sidePanelInstance = instance;
    //     });
    //   }
    // });

    return {
      openChatbot: () => {
        if (!sidePanelInstance) {
          this.openChatbotSidePanel(core, deps).then((instance) => {
            sidePanelInstance = instance;
          });
        }
      },
      closeChatbot: () => {
        if (sidePanelInstance) {
          sidePanelInstance.close();
          sidePanelInstance = null;
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
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 4px; vertical-align: text-bottom;">
            <path d="M8 2a6 6 0 0 1 6 6v1.5a1.5 1.5 0 0 1-1.5 1.5H11a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2.5A5.5 5.5 0 0 0 8 2.5 5.5 5.5 0 0 0 2.5 8H5a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3.5A1.5 1.5 0 0 1 2 10.5V8a6 6 0 0 1 6-6z"/>
          </svg>
          AI Assistant
        `;
        button.className = 'euiButton euiButton--primary euiButton--small';
        button.onclick = onClick;
        element.appendChild(button);

        return () => {
          element.removeChild(button);
        };
      },
    });
  }

  private async openChatbotSidePanel(core: CoreStart, deps: AIChatbotStartDependencies) {
    const { renderChatbotSidePanel } = await import('./side_panel');
    return renderChatbotSidePanel(core, deps);
  }

  public stop() {
    delete (window as any).aiChatbotServices;
  }
}
