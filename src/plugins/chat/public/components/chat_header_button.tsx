/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback } from 'react';
import { EuiToolTip, EuiButtonEmpty, EuiIcon } from '@elastic/eui';
import { FormattedMessage } from '@osd/i18n/react';
import { CoreStart } from '../../../../core/public';
import './chat_header_button.scss';
import gradientGenerateIcon from '../assets/gradient_generate_icon.svg';

export interface ChatHeaderButtonInstance {
  startNewConversation: ({ content }: { content: string }) => Promise<void>;
}

interface ChatHeaderButtonProps {
  core: CoreStart;
}

export const ChatHeaderButton = React.forwardRef<ChatHeaderButtonInstance, ChatHeaderButtonProps>(
  ({ core }, ref) => {
    // Use core chat service enablement logic
    const isChatAvailable = core.chat.isAvailable();

    const toggleChatWindow = useCallback(() => {
      if (core.chat.isWindowOpen()) {
        core.chat.closeWindow();
        return;
      }
      core.chat.openWindow();
    }, [core.chat]);

    if (!isChatAvailable) {
      return null;
    }

    return (
      <EuiToolTip content="Open Chat Assistant">
        <EuiButtonEmpty
          size="s"
          onClick={toggleChatWindow}
          color="primary"
          aria-label="Toggle chat assistant"
          className="chatHeaderButton__button"
        >
          <EuiIcon type={gradientGenerateIcon} size="s" className="chatHeaderButton__icon" />
          <FormattedMessage id="chat.headerButton.askAI" defaultMessage="Ask AI" />
        </EuiButtonEmpty>
      </EuiToolTip>
    );
  }
);
