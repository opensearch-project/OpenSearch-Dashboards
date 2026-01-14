/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { EuiFieldText, EuiButtonIcon, EuiTextColor } from '@elastic/eui';
import { ChatLayoutMode } from './chat_header_button';
import { ContextPills } from './context_pills';
import { SlashCommandMenu } from './slash_command_menu';
import { slashCommandRegistry, SlashCommand } from '../services/slash_commands';
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
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [ghostText, setGhostText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Update command suggestions when input changes
  useEffect(() => {
    if (input.startsWith('/')) {
      const hasSpace = input.includes(' ');

      if (!hasSpace) {
        // Before space: show command autocomplete
        const suggestions = slashCommandRegistry.getSuggestions(input);
        setCommandSuggestions(suggestions);
        setShowCommandMenu(suggestions.length > 0);
        setSelectedCommandIndex(0);

        // Set ghost text for inline autocomplete
        if (suggestions.length > 0) {
          const topSuggestion = suggestions[0];
          const query = input.slice(1);
          if (topSuggestion.command.toLowerCase().startsWith(query.toLowerCase())) {
            setGhostText(topSuggestion.command.slice(query.length));
          } else {
            setGhostText('');
          }
        } else {
          setGhostText('');
        }
      } else {
        // After space: show hint text if command has one
        setShowCommandMenu(false);
        setCommandSuggestions([]);

        const parts = input.slice(1).split(' ');
        const commandName = parts[0];
        const args = parts.slice(1).join(' ');
        const command = slashCommandRegistry.get(commandName);

        if (command && command.hint && args.trim() === '') {
          setGhostText(command.hint);
        } else {
          setGhostText('');
        }
      }
    } else {
      setShowCommandMenu(false);
      setCommandSuggestions([]);
      setGhostText('');
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Tab or Space for command autocomplete (only before space is typed)
    if (
      (e.key === 'Tab' || e.key === ' ') &&
      ghostText &&
      input.startsWith('/') &&
      !input.includes(' ')
    ) {
      e.preventDefault();
      const selectedCommand = commandSuggestions[selectedCommandIndex];
      if (selectedCommand) {
        onInputChange(`/${selectedCommand.command} `);
        setShowCommandMenu(false);
        setGhostText('');
        inputRef.current?.focus();
      }
      return;
    }

    // Handle command menu navigation
    if (showCommandMenu && commandSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev < commandSuggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev > 0 ? prev - 1 : commandSuggestions.length - 1));
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selectedCommand = commandSuggestions[selectedCommandIndex];
        if (selectedCommand) {
          onInputChange(`/${selectedCommand.command} `);
          setShowCommandMenu(false);
          setGhostText('');
          inputRef.current?.focus();
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCommandMenu(false);
        return;
      }
    }

    // Pass through to parent handler for normal message sending
    onKeyDown(e);
  };

  const handleCommandSelect = (command: SlashCommand) => {
    onInputChange(`/${command.command} `);
    setShowCommandMenu(false);
    setGhostText('');
    inputRef.current?.focus();
  };

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
          <EuiFieldText
            inputRef={inputRef}
            placeholder="Ask a question, type / for commands"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            autoFocus={true}
            fullWidth
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
          iconType={isStreaming ? 'generate' : 'sortUp'}
          onClick={onSend}
          isDisabled={input.trim().length === 0 || isStreaming}
          aria-label="Send message"
          size="m"
          color="primary"
          display="fill"
        />
      </div>
    </div>
  );
};
