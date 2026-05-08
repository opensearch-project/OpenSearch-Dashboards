/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { createRef } from 'react';
import { useCommandMenuKeyboard } from './use_command_menu_keyboard';
import { slashCommandRegistry, SlashCommand } from '../services/slash_commands';

// Mock the slash command registry
jest.mock('../services/slash_commands', () => {
  const mockRegistry = {
    getSuggestions: jest.fn(),
    get: jest.fn(),
  };
  return {
    slashCommandRegistry: mockRegistry,
    SlashCommand: {},
  };
});

describe('useCommandMenuKeyboard', () => {
  let mockOnInputChange: jest.Mock;
  let mockOnKeyDown: jest.Mock;
  let inputRef: React.RefObject<HTMLTextAreaElement>;

  const mockCommands: SlashCommand[] = [
    {
      command: 'help',
      description: 'Show help',
      handler: jest.fn(),
    },
    {
      command: 'hello',
      description: 'Say hello',
      handler: jest.fn(),
    },
    {
      command: 'hint',
      description: 'Command with hint',
      hint: 'Enter your text here',
      handler: jest.fn(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnInputChange = jest.fn();
    mockOnKeyDown = jest.fn();
    inputRef = createRef<HTMLTextAreaElement>();

    // Mock textarea element
    Object.defineProperty(inputRef, 'current', {
      writable: true,
      value: {
        focus: jest.fn(),
        style: {
          height: '',
        },
        scrollHeight: 45,
      },
    });

    // Default mock implementations
    (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([]);
    (slashCommandRegistry.get as jest.Mock).mockReturnValue(undefined);
  });

  describe('initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.showCommandMenu).toBe(false);
      expect(result.current.commandSuggestions).toEqual([]);
      expect(result.current.selectedCommandIndex).toBe(0);
      expect(result.current.ghostText).toBe('');
      expect(typeof result.current.handleKeyDown).toBe('function');
      expect(typeof result.current.handleCommandSelect).toBe('function');
    });
  });

  describe('command suggestions', () => {
    it('should show command suggestions when typing "/"', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.showCommandMenu).toBe(true);
      expect(result.current.commandSuggestions).toEqual([mockCommands[0]]);
      expect(slashCommandRegistry.getSuggestions).toHaveBeenCalledWith('/h');
    });

    it('should not show command menu for empty input', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.showCommandMenu).toBe(false);
      expect(result.current.commandSuggestions).toEqual([]);
    });

    it('should not show command menu for non-slash input', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: 'hello',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.showCommandMenu).toBe(false);
      expect(result.current.commandSuggestions).toEqual([]);
    });

    it('should hide command menu after space is typed', () => {
      (slashCommandRegistry.get as jest.Mock).mockReturnValue(mockCommands[0]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/help ',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.showCommandMenu).toBe(false);
    });

    it('should update suggestions when input changes', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result, rerender } = renderHook(
        ({ input }) =>
          useCommandMenuKeyboard({
            input,
            onInputChange: mockOnInputChange,
            onKeyDown: mockOnKeyDown,
            inputRef,
          }),
        { initialProps: { input: '/h' } }
      );

      expect(result.current.showCommandMenu).toBe(true);

      // Change input to show multiple suggestions
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([
        mockCommands[0],
        mockCommands[1],
      ]);
      rerender({ input: '/he' });

      expect(result.current.commandSuggestions).toEqual([mockCommands[0], mockCommands[1]]);
    });
  });

  describe('ghost text', () => {
    it('should show ghost text for matching command', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.ghostText).toBe('elp');
    });

    it('should not show ghost text when command does not match', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/x',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.ghostText).toBe('');
    });

    it('should show hint text after command with space', () => {
      (slashCommandRegistry.get as jest.Mock).mockReturnValue(mockCommands[2]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/hint ',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.ghostText).toBe('Enter your text here');
    });

    it('should clear ghost text when args are provided', () => {
      (slashCommandRegistry.get as jest.Mock).mockReturnValue(mockCommands[2]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/hint something',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.ghostText).toBe('');
    });
  });

  describe('keyboard navigation - Arrow keys', () => {
    it('should handle ArrowDown to select next command', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([
        mockCommands[0],
        mockCommands[1],
      ]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.selectedCommandIndex).toBe(0);

      // Press ArrowDown
      act(() => {
        const event = {
          key: 'ArrowDown',
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(result.current.selectedCommandIndex).toBe(1);
    });

    it('should wrap to first command when pressing ArrowDown at the end', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([
        mockCommands[0],
        mockCommands[1],
      ]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      // Move to last command
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any);
      });

      expect(result.current.selectedCommandIndex).toBe(1);

      // Press ArrowDown again - should wrap to 0
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any);
      });

      expect(result.current.selectedCommandIndex).toBe(0);
    });

    it('should handle ArrowUp to select previous command', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([
        mockCommands[0],
        mockCommands[1],
      ]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      // First move to index 1
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any);
      });

      expect(result.current.selectedCommandIndex).toBe(1);

      // Press ArrowUp
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn() } as any);
      });

      expect(result.current.selectedCommandIndex).toBe(0);
    });

    it('should wrap to last command when pressing ArrowUp at the beginning', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([
        mockCommands[0],
        mockCommands[1],
      ]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.selectedCommandIndex).toBe(0);

      // Press ArrowUp - should wrap to last index
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowUp', preventDefault: jest.fn() } as any);
      });

      expect(result.current.selectedCommandIndex).toBe(1);
    });
  });

  describe('command selection - Tab/Space', () => {
    it('should complete command with Tab key', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        const event = {
          key: 'Tab',
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(mockOnInputChange).toHaveBeenCalledWith('/help ');
      expect(result.current.showCommandMenu).toBe(false);
      expect(result.current.ghostText).toBe('');
    });

    it('should complete command with Space key', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        const event = {
          key: ' ',
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(mockOnInputChange).toHaveBeenCalledWith('/help ');
      expect(result.current.showCommandMenu).toBe(false);
    });

    it('should not complete with Tab/Space if no ghost text', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/x',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        result.current.handleKeyDown({ key: 'Tab', preventDefault: jest.fn() } as any);
      });

      expect(mockOnInputChange).not.toHaveBeenCalled();
      expect(mockOnKeyDown).toHaveBeenCalled();
    });

    it('should not complete with Tab/Space after space is typed', () => {
      (slashCommandRegistry.get as jest.Mock).mockReturnValue(mockCommands[0]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/help ',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        result.current.handleKeyDown({ key: 'Tab', preventDefault: jest.fn() } as any);
      });

      expect(mockOnInputChange).not.toHaveBeenCalled();
      expect(mockOnKeyDown).toHaveBeenCalled();
    });

    it('should select non-first command with Tab/Space', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([
        mockCommands[0],
        mockCommands[1],
      ]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      // Select second command
      act(() => {
        result.current.handleKeyDown({ key: 'ArrowDown', preventDefault: jest.fn() } as any);
      });

      expect(result.current.selectedCommandIndex).toBe(1);

      // Complete with Tab
      act(() => {
        result.current.handleKeyDown({ key: 'Tab', preventDefault: jest.fn() } as any);
      });

      expect(mockOnInputChange).toHaveBeenCalledWith('/hello ');
    });
  });

  describe('command selection - Enter', () => {
    it('should select command with Enter key when menu is open', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        const event = {
          key: 'Enter',
          shiftKey: false,
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(mockOnInputChange).toHaveBeenCalledWith('/help ');
      expect(result.current.showCommandMenu).toBe(false);
    });

    it('should not intercept Enter+Shift when menu is open', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        const event = {
          key: 'Enter',
          shiftKey: true,
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(mockOnInputChange).not.toHaveBeenCalled();
      expect(mockOnKeyDown).toHaveBeenCalled();
    });

    it('should pass through Enter when menu is not open', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: 'regular message',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        const event = {
          key: 'Enter',
          shiftKey: false,
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(mockOnInputChange).not.toHaveBeenCalled();
      expect(mockOnKeyDown).toHaveBeenCalled();
    });
  });

  describe('escape key', () => {
    it('should close command menu with Escape key', () => {
      (slashCommandRegistry.getSuggestions as jest.Mock).mockReturnValue([mockCommands[0]]);

      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      expect(result.current.showCommandMenu).toBe(true);

      act(() => {
        const event = {
          key: 'Escape',
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(result.current.showCommandMenu).toBe(false);
    });

    it('should pass through Escape when menu is not open', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: 'regular message',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        const event = {
          key: 'Escape',
          preventDefault: jest.fn(),
        } as any;
        result.current.handleKeyDown(event);
      });

      expect(mockOnKeyDown).toHaveBeenCalled();
    });
  });

  describe('handleCommandSelect', () => {
    it('should select command and close menu', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '/h',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      act(() => {
        result.current.handleCommandSelect(mockCommands[0]);
      });

      expect(mockOnInputChange).toHaveBeenCalledWith('/help ');
      expect(inputRef.current?.focus).toHaveBeenCalled();
    });
  });

  describe('pass-through behavior', () => {
    it('should pass through other keys to parent handler', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: 'message',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      const event = {
        key: 'a',
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnKeyDown).toHaveBeenCalledWith(event);
    });

    it('should pass through keys when menu is closed', () => {
      const { result } = renderHook(() =>
        useCommandMenuKeyboard({
          input: '',
          onInputChange: mockOnInputChange,
          onKeyDown: mockOnKeyDown,
          inputRef,
        })
      );

      const event = {
        key: 'Enter',
        shiftKey: false,
        preventDefault: jest.fn(),
      } as any;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(mockOnKeyDown).toHaveBeenCalledWith(event);
    });
  });
});
