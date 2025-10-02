/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiButtonIcon, EuiBadge, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import './chat_header.scss';

interface ChatHeaderProps {
  layoutMode: ChatLayoutMode;
  isStreaming: boolean;
  onToggleLayout?: () => void;
  onNewChat: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  layoutMode,
  isStreaming,
  onToggleLayout,
  onNewChat,
}) => {
  return (
    <div className="chatHeader">
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiText size="m">
            <h3>Assistant</h3>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge color="warning" className="chatHeader__experimentalBadge">
            Experimental
          </EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>
      <div className="chatHeader__buttons">
        {onToggleLayout && (
          <EuiButtonIcon
            iconType={layoutMode === ChatLayoutMode.FULLSCREEN ? 'minimize' : 'fullScreen'}
            onClick={onToggleLayout}
            disabled={isStreaming}
            aria-label={
              layoutMode === ChatLayoutMode.FULLSCREEN
                ? 'Switch to sidecar'
                : 'Switch to fullscreen'
            }
            size="m"
          />
        )}
        <EuiButtonIcon
          iconType="plus"
          onClick={onNewChat}
          disabled={isStreaming}
          aria-label="New chat"
          size="m"
        />
      </div>
    </div>
  );
};
