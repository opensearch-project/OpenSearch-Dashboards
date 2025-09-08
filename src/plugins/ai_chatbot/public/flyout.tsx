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
    const flyoutContainer = document.createElement('div');
    flyoutContainer.style.position = 'fixed';
    flyoutContainer.style.top = '0';
    flyoutContainer.style.right = '0';
    flyoutContainer.style.height = '100vh';
    flyoutContainer.style.width = '500px';
    flyoutContainer.style.zIndex = '9999';
    flyoutContainer.style.boxShadow = '-4px 0 8px rgba(0, 0, 0, 0.1)';
    
    document.body.appendChild(flyoutContainer);

    const closeFlyout = () => {
      ReactDOM.unmountComponentAtNode(flyoutContainer);
      document.body.removeChild(flyoutContainer);
    };

    ReactDOM.render(
      <ChatbotFlyout 
        core={core} 
        deps={deps} 
        onClose={closeFlyout}
      />,
      flyoutContainer
    );

    resolve({ close: closeFlyout });
  });
}