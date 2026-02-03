/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPanel, EuiIcon, EuiButtonIcon } from '@elastic/eui';
import { Markdown } from '../../../opensearch_dashboards_react/public';
import type { Message } from '../../common/types';
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

  // Check if the message is a slash command
  // A message is a slash command if rawMessage exists and starts with "/"
  const isSlashCommand = () => {
    if (message.role === 'user' && 'rawMessage' in message && message.rawMessage) {
      return typeof message.rawMessage === 'string' && message.rawMessage.trim().startsWith('/');
    }
    return false;
  };

  // Handle multimodal content (text + images) or simple string content
  const renderContent = () => {
    const content =
      message.role === 'user' && 'rawMessage' in message && message.rawMessage
        ? message.rawMessage
        : message.content || '';

    // If content is a string, render as markdown
    if (typeof content === 'string') {
      return <Markdown markdown={content} openLinksInNewTab={true} />;
    }

    // If content is an array, handle multimodal content (text + binary)
    if (Array.isArray(content)) {
      return (
        <>
          {content.map((block: any, index: number) => {
            // Render binary content (images)
            if (block.type === 'binary' && block.data) {
              return (
                <img
                  key={index}
                  src={`data:${block.mimeType || 'image/jpeg'};base64,${block.data}`}
                  alt={block.filename || 'Visualization'}
                  style={{ maxWidth: '100%', marginBottom: '8px', borderRadius: '4px' }}
                />
              );
            }
            // Render text content as markdown
            if (block.type === 'text' && block.text) {
              return <Markdown key={index} markdown={block.text} openLinksInNewTab={true} />;
            }
            // Handle plain text blocks (for backward compatibility)
            if (block.text) {
              return <Markdown key={index} markdown={block.text} openLinksInNewTab={true} />;
            }
            return null;
          })}
        </>
      );
    }

    // Fallback for any other type
    return <Markdown markdown={String(content)} openLinksInNewTab={true} />;
  };

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
          <div className="messageRow__markdown">
            {renderContent()}
            {isStreaming && <span className="messageRow__cursor">|</span>}
          </div>
        </EuiPanel>

        {/* Actions for user messages - hide resend for slash commands */}
        {message.role === 'user' && onResend && !isSlashCommand() && (
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
