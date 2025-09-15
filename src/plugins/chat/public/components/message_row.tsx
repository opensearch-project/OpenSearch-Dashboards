/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiIcon } from '@elastic/eui';
import './message_row.scss';

interface TimelineMessage {
  type: 'message';
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface MessageRowProps {
  message: TimelineMessage;
  isStreaming?: boolean;
}

export const MessageRow: React.FC<MessageRowProps> = ({ message, isStreaming = false }) => {
  return (
    <div className="messageRow">
      <div className="messageRow__icon">
        <EuiIcon
          type={message.role === 'user' ? 'user' : isStreaming ? 'discuss' : 'generate'}
          size="m"
          color={message.role === 'user' ? 'primary' : 'success'}
        />
      </div>
      <div className="messageRow__content">
        <EuiPanel paddingSize="s" color={message.role === 'user' ? 'primary' : 'plain'}>
          <EuiText size="s" style={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
            {isStreaming && <span className="messageRow__cursor">|</span>}
          </EuiText>
        </EuiPanel>
      </div>
    </div>
  );
};
