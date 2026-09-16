/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
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

    // Track the chat window open state reactively so the button's data-test-subj
    // reflects the action a click will perform.
    const [isWindowOpen, setIsWindowOpen] = useState(core.chat.isWindowOpen());

    useEffect(() => {
      const subscription = core.chat
        .getWindowState$()
        .subscribe((state) => setIsWindowOpen(state.isWindowOpen));
      return () => subscription.unsubscribe();
    }, [core.chat]);

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

    // The data-test-subj encodes the action the button will perform (open when
    // closed, close when open). Use the same value as the React `key` so that
    // when the window state changes, React unmounts this button and mounts a
    // fresh one rather than mutating the attribute on the live node in place.
    // The automatic click-telemetry listener reads the clicked node while the
    // click bubbles up; because the clicked node is replaced (not mutated), the
    // node it reads keeps its pre-click data-test-subj regardless of timing.
    const testSubj = isWindowOpen
      ? 'chatHeaderButtonCloseChatWindow'
      : 'chatHeaderButtonOpenChatWindow';

    return (
      <EuiToolTip content="Open Chat Assistant">
        <EuiButtonEmpty
          key={testSubj}
          size="s"
          onClick={toggleChatWindow}
          color="primary"
          aria-label="Toggle chat assistant"
          className="chatHeaderButton__button"
          data-test-subj={testSubj}
        >
          <EuiIcon type={gradientGenerateIcon} size="s" className="chatHeaderButton__icon" />
          <FormattedMessage id="chat.headerButton.askAI" defaultMessage="Ask AI" />
        </EuiButtonEmpty>
      </EuiToolTip>
    );
  }
);
