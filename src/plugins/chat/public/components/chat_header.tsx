/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiIcon } from '@elastic/eui';
import './chat_header.scss';

interface ChatHeaderProps {
  conversationName?: string;
  isStreaming: boolean;
  onNewChat: () => void;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationName = '',
  isStreaming,
  onNewChat,
  onClose,
}) => {
  return (
    <div className="chatHeader">
      <EuiFlexGroup
        alignItems="center"
        gutterSize="none"
        responsive={false}
        className="chatHeader__titleGroup"
      >
        <EuiFlexItem grow={false}>
          <EuiIcon type="chatLeft" size="m" className="chatHeader__chatIcon" />
        </EuiFlexItem>
        {conversationName && (
          <EuiFlexItem grow={true} className="chatHeader__titleContainer">
            <EuiText size="m">
              <h3 className="chatHeader__title">{conversationName}</h3>
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <div className="chatHeader__buttons">
        <EuiButtonIcon
          iconType="documentEdit"
          onClick={onNewChat}
          disabled={isStreaming}
          aria-label="New chat"
          size="m"
          color="text"
        />
        <EuiButtonIcon
          iconType="cross"
          onClick={onClose}
          aria-label="Close chatbot"
          size="m"
          color="text"
        />
      </div>
    </div>
  );
};
