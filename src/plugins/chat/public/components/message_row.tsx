/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPanel, EuiIcon, EuiButtonIcon, EuiImage } from '@elastic/eui';
import { Markdown } from '../../../opensearch_dashboards_react/public';
import type { Message, UserMessage } from '../../common/types';
import './message_row.scss';

interface MessageRowProps {
  message: Message;
  isStreaming?: boolean;
  onResend?: (message: Message) => void;
}

export const MessageRow: React.FC<MessageRowProps> = ({
  message,
  isStreaming = false,
  onResend,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleResend = () => {
    if (onResend) {
      onResend(message);
    }
  };

  // Handle optional content
  const content = message.content || '';

  // Check if this is a user message with image data
  const userMessage = message as UserMessage;
  const hasImage = message.role === 'user' && userMessage.imageData;

  return (
    <div
      className={`messageRow ${message.role === 'user' ? 'messageRow--user' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="messageRow__icon">
        <EuiIcon
          type={message.role === 'user' ? 'user' : isStreaming ? 'discuss' : 'generate'}
          size="m"
          color={message.role === 'user' ? 'primary' : 'success'}
        />
      </div>
      <div className="messageRow__content">
        <EuiPanel paddingSize="s" color={message.role === 'user' ? 'primary' : 'plain'}>
          {/* Display image if present */}
          {hasImage && userMessage.imageData && (
            <div className="messageRow__image">
              <EuiImage
                src={userMessage.imageData}
                alt="Visualization screenshot"
                size="l"
                hasShadow
                allowFullScreen
              />
            </div>
          )}
          <div className="messageRow__markdown">
            <Markdown markdown={content} openLinksInNewTab={true} />
            {isStreaming && <span className="messageRow__cursor">|</span>}
          </div>
        </EuiPanel>

        {/* Actions for user messages */}
        {message.role === 'user' && onResend && (
          <div className={`messageRow__actions ${isHovered ? 'messageRow__actions--visible' : ''}`}>
            <EuiButtonIcon
              iconType="refresh"
              color="primary"
              size="s"
              onClick={handleResend}
              aria-label="Resend message"
              title="Resend message"
            />
          </div>
        )}
      </div>
    </div>
  );
};
