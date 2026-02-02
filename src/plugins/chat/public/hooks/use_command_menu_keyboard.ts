/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, RefObject } from 'react';
import { slashCommandRegistry, SlashCommand } from '../services/slash_commands';

interface UseCommandMenuKeyboardParams {
  input: string;
  onInputChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: RefObject<HTMLTextAreaElement>;
}

interface UseCommandMenuKeyboardReturn {
  showCommandMenu: boolean;
  commandSuggestions: SlashCommand[];
  selectedCommandIndex: number;
  ghostText: string;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleCommandSelect: (command: SlashCommand) => void;
}

/**
 * Custom hook to handle command menu keyboard interactions
 * Manages state and keyboard event handling for slash command autocomplete
 */
export const useCommandMenuKeyboard = ({
  input,
  onInputChange,
  onKeyDown,
  inputRef,
}: UseCommandMenuKeyboardParams): UseCommandMenuKeyboardReturn => {
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandSuggestions, setCommandSuggestions] = useState<SlashCommand[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [ghostText, setGhostText] = useState('');

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

  useEffect(() => {
    const textArea = inputRef.current;
    if (textArea) {
      textArea.style.height = 'auto';
      const maxHeight = 80;
      const minHeight = 45;
      const newHeight = Math.min(Math.max(textArea.scrollHeight, minHeight), maxHeight);
      textArea.style.height = `${newHeight}px`;
    }
  }, [input, inputRef]);

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

  return {
    showCommandMenu,
    commandSuggestions,
    selectedCommandIndex,
    ghostText,
    handleKeyDown,
    handleCommandSelect,
  };
};
