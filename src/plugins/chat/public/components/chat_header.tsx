/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import './chat_header.scss';

interface ChatHeaderProps {
  conversationName?: string;
  isStreaming: boolean;
  onNewChat: () => void;
  onClose: () => void;
  onShowHistory?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  title?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversationName = '',
  isStreaming,
  onNewChat,
  onClose,
  onShowHistory,
  showBackButton = false,
  onBack,
  title,
}) => {
  const displayTitle = title || conversationName;

  return (
    <div className="chatHeader">
      <EuiFlexGroup
        alignItems="center"
        gutterSize="none"
        responsive={false}
        className="chatHeader__titleGroup"
      >
        <EuiFlexItem grow={false}>
          {showBackButton && onBack ? (
            <EuiToolTip
              content={i18n.translate('chat.header.goBackTooltip', {
                defaultMessage: 'Go back',
              })}
            >
              <EuiButtonIcon
                iconType="arrowLeft"
                onClick={onBack}
                aria-label={i18n.translate('chat.header.goBackAriaLabel', {
                  defaultMessage: 'Go back',
                })}
                size="m"
                color="text"
              />
            </EuiToolTip>
          ) : (
            <EuiToolTip
              content={i18n.translate('chat.header.showHistoryTooltip', {
                defaultMessage: 'View all conversations',
              })}
            >
              <EuiButtonIcon
                iconType="chatLeft"
                onClick={onShowHistory}
                aria-label={i18n.translate('chat.header.showHistoryAriaLabel', {
                  defaultMessage: 'Show conversation history',
                })}
                size="m"
                color="text"
              />
            </EuiToolTip>
          )}
        </EuiFlexItem>
        {displayTitle && (
          <EuiFlexItem grow={true} className="chatHeader__titleContainer">
            <EuiText size="m">
              <h3 className="chatHeader__title">{displayTitle}</h3>
            </EuiText>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <div className="chatHeader__buttons">
        <EuiToolTip
          content={i18n.translate('chat.header.newChatTooltip', {
            defaultMessage: 'Start a new conversation',
          })}
        >
          <EuiButtonIcon
            iconType="documentEdit"
            onClick={onNewChat}
            disabled={isStreaming}
            aria-label={i18n.translate('chat.header.newChatAriaLabel', {
              defaultMessage: 'New chat',
            })}
            size="m"
            color="text"
          />
        </EuiToolTip>
        <EuiToolTip
          content={i18n.translate('chat.header.closeChatTooltip', {
            defaultMessage: 'Close chat window',
          })}
        >
          <EuiButtonIcon
            iconType="cross"
            onClick={onClose}
            aria-label={i18n.translate('chat.header.closeChatAriaLabel', {
              defaultMessage: 'Close chatbot',
            })}
            size="m"
            color="text"
          />
        </EuiToolTip>
      </div>
    </div>
  );
};
