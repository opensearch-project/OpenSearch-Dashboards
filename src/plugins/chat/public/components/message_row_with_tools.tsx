/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiPanel, EuiIcon, EuiButtonIcon, EuiSpacer } from '@elastic/eui';
import { Markdown } from '../../../opensearch_dashboards_react/public';
import { ToolCallRenderer } from './tool_call_renderer';
import './message_row.scss';

interface TimelineMessage {
  type: 'message';
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: string[]; // Array of tool call IDs associated with this message
}

interface MessageRowWithToolsProps {
  message: TimelineMessage;
  isStreaming?: boolean;
  onResend?: (message: TimelineMessage) => void;
}

export const MessageRowWithTools: React.FC<MessageRowWithToolsProps> = ({
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
            <Markdown markdown={message.content} openLinksInNewTab={true} />
            {isStreaming && <span className="messageRow__cursor">|</span>}
          </div>

          {/* Render tool calls if present */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <>
              <EuiSpacer size="m" />
              <div className="messageRow__toolCalls">
                {message.toolCalls.map((toolCallId) => (
                  <div key={toolCallId} className="messageRow__toolCall">
                    <ToolCallRenderer toolCallId={toolCallId} />
                  </div>
                ))}
              </div>
            </>
          )}
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
