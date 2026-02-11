/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInput } from './chat_input';
import { ChatLayoutMode } from './chat_header_button';

// Mock the hooks
jest.mock('../hooks', () => ({
  useCommandMenuKeyboard: jest.fn(() => ({
    showCommandMenu: false,
    commandSuggestions: [],
    selectedCommandIndex: -1,
    ghostText: '',
    handleKeyDown: jest.fn(),
    handleCommandSelect: jest.fn(),
  })),
  useStopButtonTiming: jest.fn((isStreaming) => isStreaming),
}));

// Mock ContextPills component
jest.mock('./context_pills', () => ({
  ContextPills: () => <div data-test-subj="contextPills">Context Pills</div>,
}));

// Mock SlashCommandMenu component
jest.mock('./slash_command_menu', () => ({
  SlashCommandMenu: () => <div data-test-subj="slashCommandMenu">Slash Command Menu</div>,
}));

describe('ChatInput', () => {
  const defaultProps = {
    layoutMode: 'docked' as ChatLayoutMode,
    input: '',
    isStreaming: false,
    onInputChange: jest.fn(),
    onSend: jest.fn(),
    onKeyDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('send button', () => {
    it('should render send button when not streaming', () => {
      render(<ChatInput {...defaultProps} />);

      const sendButton = screen.getByTestId('chatSendButton');
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toHaveAttribute('aria-label', 'Send message');
    });

    it('should disable send button when input is empty', () => {
      render(<ChatInput {...defaultProps} input="" />);

      const sendButton = screen.getByTestId('chatSendButton');
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when input has only whitespace', () => {
      render(<ChatInput {...defaultProps} input="   " />);

      const sendButton = screen.getByTestId('chatSendButton');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has content', () => {
      render(<ChatInput {...defaultProps} input="Hello" />);

      const sendButton = screen.getByTestId('chatSendButton');
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable send button when streaming', () => {
      render(<ChatInput {...defaultProps} input="Hello" isStreaming={true} />);

      const sendButton = screen.getByTestId('chatSendButton');
      expect(sendButton).toBeDisabled();
    });

    it('should call onSend when send button is clicked', () => {
      const onSend = jest.fn();
      render(<ChatInput {...defaultProps} input="Hello" onSend={onSend} />);

      const sendButton = screen.getByTestId('chatSendButton');
      fireEvent.click(sendButton);

      expect(onSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop button', () => {
    it('should render stop button when streaming with onStopExecution handler', () => {
      const onStopExecution = jest.fn();
      render(<ChatInput {...defaultProps} isStreaming={true} onStopExecution={onStopExecution} />);

      const stopButton = screen.getByTestId('chatStopExecutionButton');
      expect(stopButton).toBeInTheDocument();
      expect(stopButton).toHaveAttribute('aria-label', 'Stop agent execution');
    });

    it('should not render stop button when not streaming', () => {
      const onStopExecution = jest.fn();
      render(<ChatInput {...defaultProps} isStreaming={false} onStopExecution={onStopExecution} />);

      expect(screen.queryByTestId('chatStopExecutionButton')).not.toBeInTheDocument();
      expect(screen.getByTestId('chatSendButton')).toBeInTheDocument();
    });

    it('should not render stop button when streaming but no onStopExecution handler', () => {
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      expect(screen.queryByTestId('chatStopExecutionButton')).not.toBeInTheDocument();
      expect(screen.getByTestId('chatSendButton')).toBeInTheDocument();
    });

    it('should call onStopExecution when stop button is clicked', () => {
      const onStopExecution = jest.fn();
      render(<ChatInput {...defaultProps} isStreaming={true} onStopExecution={onStopExecution} />);

      const stopButton = screen.getByTestId('chatStopExecutionButton');
      fireEvent.click(stopButton);

      expect(onStopExecution).toHaveBeenCalledTimes(1);
    });

    it('should have danger color for stop button', () => {
      const onStopExecution = jest.fn();
      render(<ChatInput {...defaultProps} isStreaming={true} onStopExecution={onStopExecution} />);

      const stopButton = screen.getByTestId('chatStopExecutionButton');
      expect(stopButton).toHaveClass('euiButtonIcon--danger');
    });
  });

  describe('button consolidation', () => {
    it('should show only send button when not streaming', () => {
      const onStopExecution = jest.fn();
      render(<ChatInput {...defaultProps} isStreaming={false} onStopExecution={onStopExecution} />);

      expect(screen.getByTestId('chatSendButton')).toBeInTheDocument();
      expect(screen.queryByTestId('chatStopExecutionButton')).not.toBeInTheDocument();
    });

    it('should show only stop button when streaming', () => {
      const onStopExecution = jest.fn();
      render(<ChatInput {...defaultProps} isStreaming={true} onStopExecution={onStopExecution} />);

      expect(screen.getByTestId('chatStopExecutionButton')).toBeInTheDocument();
      expect(screen.queryByTestId('chatSendButton')).not.toBeInTheDocument();
    });

    it('should switch from send to stop button when streaming starts', () => {
      const onStopExecution = jest.fn();
      const { rerender } = render(
        <ChatInput {...defaultProps} isStreaming={false} onStopExecution={onStopExecution} />
      );

      expect(screen.getByTestId('chatSendButton')).toBeInTheDocument();
      expect(screen.queryByTestId('chatStopExecutionButton')).not.toBeInTheDocument();

      rerender(
        <ChatInput {...defaultProps} isStreaming={true} onStopExecution={onStopExecution} />
      );

      expect(screen.getByTestId('chatStopExecutionButton')).toBeInTheDocument();
      expect(screen.queryByTestId('chatSendButton')).not.toBeInTheDocument();
    });

    it('should switch from stop to send button when streaming ends', () => {
      const onStopExecution = jest.fn();
      const { rerender } = render(
        <ChatInput {...defaultProps} isStreaming={true} onStopExecution={onStopExecution} />
      );

      expect(screen.getByTestId('chatStopExecutionButton')).toBeInTheDocument();
      expect(screen.queryByTestId('chatSendButton')).not.toBeInTheDocument();

      rerender(
        <ChatInput {...defaultProps} isStreaming={false} onStopExecution={onStopExecution} />
      );

      expect(screen.getByTestId('chatSendButton')).toBeInTheDocument();
      expect(screen.queryByTestId('chatStopExecutionButton')).not.toBeInTheDocument();
    });
  });

  describe('input field', () => {
    it('should render textarea with placeholder', () => {
      render(<ChatInput {...defaultProps} />);

      const textarea = screen.getByPlaceholderText('Ask anything. Type / for actions');
      expect(textarea).toBeInTheDocument();
    });

    it('should call onInputChange when text is entered', () => {
      const onInputChange = jest.fn();
      render(<ChatInput {...defaultProps} onInputChange={onInputChange} />);

      const textarea = screen.getByPlaceholderText('Ask anything. Type / for actions');
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(onInputChange).toHaveBeenCalledWith('Hello');
    });

    it('should disable textarea when streaming', () => {
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      const textarea = screen.getByPlaceholderText('Ask anything. Type / for actions');
      expect(textarea).toBeDisabled();
    });

    it('should not disable textarea when not streaming', () => {
      render(<ChatInput {...defaultProps} isStreaming={false} />);

      const textarea = screen.getByPlaceholderText('Ask anything. Type / for actions');
      expect(textarea).not.toBeDisabled();
    });
  });
});
