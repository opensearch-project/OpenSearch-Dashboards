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

import React from 'react';
import ReactDOM from 'react-dom';
import { CoreStart } from '../../../core/public';
import { AIChatbotStartDependencies } from './types';
import { ChatbotSidePanel } from './components/chatbot_side_panel';

export function renderChatbotSidePanel(
  core: CoreStart,
  deps: AIChatbotStartDependencies
): Promise<{ close: () => void }> {
  return new Promise((resolve) => {
    // Clean up any existing side panels first
    const existingPanels = document.querySelectorAll('[id^="ai-chatbot-side-panel"]');
    existingPanels.forEach((panel) => {
      console.log('🧹 Cleaning up existing side panel');
      ReactDOM.unmountComponentAtNode(panel);
      if (document.body.contains(panel)) {
        document.body.removeChild(panel);
      }
    });

    // Create a container for the side panel
    const panelContainer = document.createElement('div');
    panelContainer.id = `ai-chatbot-side-panel-${Date.now()}`;
    // No positioning styles - the component handles its own positioning
    panelContainer.style.position = 'relative';
    panelContainer.style.zIndex = '1000';

    document.body.appendChild(panelContainer);

    let isClosed = false;
    const closeSidePanel = () => {
      if (isClosed) return;
      isClosed = true;

      console.log('🔄 Closing side panel and unmounting component');
      try {
        ReactDOM.unmountComponentAtNode(panelContainer);
        if (document.body.contains(panelContainer)) {
          document.body.removeChild(panelContainer);
        }
      } catch (error) {
        console.error('Error during side panel cleanup:', error);
      }
    };

    // Use React 16 render method with proper cleanup
    ReactDOM.render(
      <ChatbotSidePanel core={core} deps={deps} onClose={closeSidePanel} />,
      panelContainer
    );

    console.log('✅ Side panel rendered with unique ID:', panelContainer.id);
    resolve({ close: closeSidePanel });
  });
}
