/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFieldText, EuiButtonIcon } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import './chat_input.scss';

interface ChatInputProps {
  layoutMode: ChatLayoutMode;
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  layoutMode,
  input,
  isStreaming,
  onInputChange,
  onSend,
  onKeyDown,
}) => {
  return (
    <div className={`chatInput chatInput--${layoutMode}`}>
      <EuiFieldText
        placeholder="Type your message..."
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isStreaming}
        fullWidth
      />
      <EuiButtonIcon
        iconType={isStreaming ? 'loading' : 'generate'}
        onClick={onSend}
        disabled={input.trim().length === 0 || isStreaming}
        aria-label="Send message"
        size="m"
        color="primary"
      />
    </div>
  );
};
