/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { EuiButtonIcon, EuiTextColor, EuiTextArea } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { ContextPills } from './context_pills';
import { SlashCommandMenu } from './slash_command_menu';
import { useCommandMenuKeyboard } from '../hooks';
import './chat_input.scss';

interface ChatInputProps {
  layoutMode: ChatLayoutMode;
  input: string;
  isStreaming: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  layoutMode,
  input,
  isStreaming,
  onInputChange,
  onSend,
  onStop,
  onKeyDown,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Use custom hook for command menu keyboard handling
  const {
    showCommandMenu,
    commandSuggestions,
    selectedCommandIndex,
    ghostText,
    handleKeyDown,
    handleCommandSelect,
  } = useCommandMenuKeyboard({
    input,
    onInputChange,
    onKeyDown,
    inputRef,
  });

  return (
    <div className={`chatInput chatInput--${layoutMode}`}>
      <ContextPills category="chat" />
      <div className="chatInput__inputRow" style={{ position: 'relative' }}>
        {showCommandMenu && (
          <SlashCommandMenu
            commands={commandSuggestions}
            selectedIndex={selectedCommandIndex}
            onSelect={handleCommandSelect}
          />
        )}
        <div className="chatInput__fieldWrapper">
          <EuiTextArea
            inputRef={inputRef}
            placeholder="How can I help you today?"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            autoFocus={true}
            fullWidth
            resize="none"
            rows={1}
          />
          {ghostText && (
            <div className="chatInput__ghostText" aria-hidden="true">
              {input}
              <EuiTextColor color="subdued" className="chatInput__ghostText--subdued">
                {ghostText}
              </EuiTextColor>
            </div>
          )}
        </div>
        <EuiButtonIcon
          iconType={isStreaming ? 'stop' : 'sortUp'}
          onClick={isStreaming ? onStop : onSend}
          isDisabled={!isStreaming && input.trim().length === 0}
          aria-label={isStreaming ? 'Stop generating' : 'Send message'}
          size="m"
          color={isStreaming ? 'danger' : 'primary'}
          display="fill"
        />
      </div>
    </div>
  );
};
