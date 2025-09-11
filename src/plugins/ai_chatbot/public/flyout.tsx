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
import { ChatbotFlyout } from './components/chatbot_flyout';

export function renderChatbotFlyout(
  core: CoreStart,
  deps: AIChatbotStartDependencies
): Promise<{ close: () => void }> {
  return new Promise((resolve) => {
    // Clean up any existing flyouts first
    const existingFlyouts = document.querySelectorAll('[id^="ai-chatbot-flyout"]');
    existingFlyouts.forEach((flyout) => {
      console.log('🧹 Cleaning up existing flyout');
      ReactDOM.unmountComponentAtNode(flyout);
      if (document.body.contains(flyout)) {
        document.body.removeChild(flyout);
      }
    });

    // Create a minimal container that doesn't block the UI
    const flyoutContainer = document.createElement('div');
    flyoutContainer.id = `ai-chatbot-flyout-${Date.now()}`;
    // Remove all positioning - let EuiFlyout handle it
    flyoutContainer.style.position = 'relative';
    flyoutContainer.style.zIndex = '1000';

    document.body.appendChild(flyoutContainer);

    let isClosed = false;
    const closeFlyout = () => {
      if (isClosed) return;
      isClosed = true;

      console.log('🔄 Closing flyout and unmounting component');
      try {
        ReactDOM.unmountComponentAtNode(flyoutContainer);
        if (document.body.contains(flyoutContainer)) {
          document.body.removeChild(flyoutContainer);
        }
      } catch (error) {
        console.error('Error during flyout cleanup:', error);
      }
    };

    // Use React 16 render method with proper cleanup
    ReactDOM.render(
      <ChatbotFlyout core={core} deps={deps} onClose={closeFlyout} />,
      flyoutContainer
    );

    console.log('✅ Flyout rendered with unique ID:', flyoutContainer.id);
    resolve({ close: closeFlyout });
  });
}
