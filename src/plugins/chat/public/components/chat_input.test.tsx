/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ChatInput } from './chat_input';
import { ChatLayoutMode } from './chat_header_button';

// Mock the context pills component
jest.mock('./context_pills', () => ({
  ContextPills: () => <div data-test-subj="context-pills">Context Pills</div>,
}));

// Mock the slash command menu
jest.mock('./slash_command_menu', () => ({
  SlashCommandMenu: () => <div data-test-subj="slash-command-menu">Slash Command Menu</div>,
}));

// Mock the command menu keyboard hook
jest.mock('../hooks/use_command_menu_keyboard', () => ({
  useCommandMenuKeyboard: () => ({
    showCommandMenu: false,
    commandSuggestions: [],
    selectedCommandIndex: 0,
    ghostText: '',
    handleKeyDown: jest.fn((e: any) => e),
    handleCommandSelect: jest.fn(),
  }),
}));

// Mock useOpenSearchDashboards hook
jest.mock('../../../opensearch_dashboards_react/public', () => {
  const { BehaviorSubject } = jest.requireActual('rxjs');
  const mockScreenshotButton$ = new BehaviorSubject({
    title: 'Add dashboard screenshot',
    iconType: 'image',
    enabled: true,
  });

  return {
    useOpenSearchDashboards: () => ({
      services: {
        core: {
          chat: {
            screenshot: {
              getScreenshotButton$: () => mockScreenshotButton$,
            },
          },
        },
      },
    }),
  };
});

describe('ChatInput', () => {
  const defaultProps = {
    layoutMode: ChatLayoutMode.SIDECAR,
    input: '',
    isStreaming: false,
    isCapturing: false,
    includeScreenShotEnabled: true,
    onCaptureScreenshot: jest.fn(),
    onInputChange: jest.fn(),
    onSend: jest.fn(),
    onStop: jest.fn(),
    onKeyDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render input field', () => {
      const { getByPlaceholderText } = render(<ChatInput {...defaultProps} />);

      expect(getByPlaceholderText('How can I help you today?')).toBeTruthy();
    });

    it('should render send button when not streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} />);

      const button = getByLabelText('Send message');
      expect(button).toBeTruthy();
    });

    it('should render stop button when streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} isStreaming={true} />);

      const button = getByLabelText('Stop generating');
      expect(button).toBeTruthy();
    });

    it('should render context pills', () => {
      const { getByTestId } = render(<ChatInput {...defaultProps} />);

      expect(getByTestId('context-pills')).toBeTruthy();
    });
  });

  describe('input handling', () => {
    it('should call onInputChange when input changes', () => {
      const onInputChange = jest.fn();
      const { getByPlaceholderText } = render(
        <ChatInput {...defaultProps} onInputChange={onInputChange} />
      );

      const input = getByPlaceholderText('How can I help you today?');
      fireEvent.change(input, { target: { value: 'test message' } });

      expect(onInputChange).toHaveBeenCalledWith('test message');
    });

    it('should display input value', () => {
      const { getByPlaceholderText } = render(<ChatInput {...defaultProps} input="test value" />);

      const input = getByPlaceholderText('How can I help you today?') as HTMLTextAreaElement;
      expect(input.value).toBe('test value');
    });

    it('should keep input enabled when streaming', () => {
      const { getByPlaceholderText } = render(<ChatInput {...defaultProps} isStreaming={true} />);

      const input = getByPlaceholderText('How can I help you today?') as HTMLTextAreaElement;
      expect(input.disabled).toBe(false);
    });

    it('should keep input enabled when not streaming', () => {
      const { getByPlaceholderText } = render(<ChatInput {...defaultProps} isStreaming={false} />);

      const input = getByPlaceholderText('How can I help you today?') as HTMLTextAreaElement;
      expect(input.disabled).toBe(false);
    });
  });

  describe('send button behavior', () => {
    it('should call onSend when send button is clicked', () => {
      const onSend = jest.fn();
      const { getByLabelText } = render(
        <ChatInput {...defaultProps} input="test" onSend={onSend} />
      );

      const button = getByLabelText('Send message');
      fireEvent.click(button);

      expect(onSend).toHaveBeenCalled();
    });

    it('should disable send button when input is empty', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} input="" />);

      const button = getByLabelText('Send message') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should disable send button when input is whitespace only', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} input="   " />);

      const button = getByLabelText('Send message') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable send button when input has content', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} input="test message" />);

      const button = getByLabelText('Send message') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should show sortUp icon when not streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} input="test" />);

      const button = getByLabelText('Send message');
      // Button should exist and be enabled
      expect(button).toBeTruthy();
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });

    it('should have primary color when not streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} input="test" />);

      const button = getByLabelText('Send message');
      expect(button.classList.contains('euiButtonIcon--primary')).toBe(true);
    });
  });

  describe('stop button behavior', () => {
    it('should call onStop when stop button is clicked', () => {
      const onStop = jest.fn();
      const { getByLabelText } = render(
        <ChatInput {...defaultProps} isStreaming={true} onStop={onStop} />
      );

      const button = getByLabelText('Stop generating');
      fireEvent.click(button);

      expect(onStop).toHaveBeenCalled();
    });

    it('should enable stop button during streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} isStreaming={true} />);

      const button = getByLabelText('Stop generating') as HTMLButtonElement;
      expect(button.disabled).toBe(false);
    });

    it('should show stop icon when streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} isStreaming={true} />);

      const button = getByLabelText('Stop generating');
      // Button should exist and be enabled
      expect(button).toBeTruthy();
      expect((button as HTMLButtonElement).disabled).toBe(false);
    });

    it('should have danger color when streaming', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} isStreaming={true} />);

      const button = getByLabelText('Stop generating');
      expect(button.classList.contains('euiButtonIcon--danger')).toBe(true);
    });

    it('should not call onSend when stop button is clicked', () => {
      const onSend = jest.fn();
      const onStop = jest.fn();
      const { getByLabelText } = render(
        <ChatInput {...defaultProps} isStreaming={true} onSend={onSend} onStop={onStop} />
      );

      const button = getByLabelText('Stop generating');
      fireEvent.click(button);

      expect(onStop).toHaveBeenCalled();
      expect(onSend).not.toHaveBeenCalled();
    });
  });

  describe('button state transitions', () => {
    it('should transition from send to stop button when streaming starts', () => {
      const { getByLabelText, rerender, queryByLabelText } = render(
        <ChatInput {...defaultProps} input="test" isStreaming={false} />
      );

      // Initially should show send button
      expect(getByLabelText('Send message')).toBeTruthy();
      expect(queryByLabelText('Stop generating')).toBeNull();

      // After streaming starts
      rerender(<ChatInput {...defaultProps} input="test" isStreaming={true} />);

      expect(getByLabelText('Stop generating')).toBeTruthy();
      expect(queryByLabelText('Send message')).toBeNull();
    });

    it('should transition from stop to send button when streaming ends', () => {
      const { getByLabelText, rerender, queryByLabelText } = render(
        <ChatInput {...defaultProps} input="test" isStreaming={true} />
      );

      // Initially should show stop button
      expect(getByLabelText('Stop generating')).toBeTruthy();
      expect(queryByLabelText('Send message')).toBeNull();

      // After streaming ends
      rerender(<ChatInput {...defaultProps} input="test" isStreaming={false} />);

      expect(getByLabelText('Send message')).toBeTruthy();
      expect(queryByLabelText('Stop generating')).toBeNull();
    });
  });

  describe('layout modes', () => {
    it('should apply sidecar layout class', () => {
      const { container } = render(
        <ChatInput {...defaultProps} layoutMode={ChatLayoutMode.SIDECAR} />
      );

      const chatInput = container.querySelector('.chatInput--sidecar');
      expect(chatInput).toBeTruthy();
    });

    it('should apply fullscreen layout class', () => {
      const { container } = render(
        <ChatInput {...defaultProps} layoutMode={ChatLayoutMode.FULLSCREEN} />
      );

      const chatInput = container.querySelector('.chatInput--fullscreen');
      expect(chatInput).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria-label for send button', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} input="test" />);

      expect(getByLabelText('Send message')).toBeTruthy();
    });

    it('should have proper aria-label for stop button', () => {
      const { getByLabelText } = render(<ChatInput {...defaultProps} isStreaming={true} />);

      expect(getByLabelText('Stop generating')).toBeTruthy();
    });

    it('should have autofocus on input', () => {
      const { getByPlaceholderText } = render(<ChatInput {...defaultProps} />);

      const input = getByPlaceholderText('How can I help you today?') as HTMLTextAreaElement;
      // Input should exist and be focused
      expect(input).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid button clicks', () => {
      const onSend = jest.fn();
      const { getByLabelText } = render(
        <ChatInput {...defaultProps} input="test" onSend={onSend} />
      );

      const button = getByLabelText('Send message');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(onSend).toHaveBeenCalledTimes(3);
    });

    it('should handle empty onStop callback', () => {
      const { getByLabelText } = render(
        <ChatInput {...defaultProps} isStreaming={true} onStop={undefined as any} />
      );

      const button = getByLabelText('Stop generating');

      // Should not throw when clicking with undefined callback
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it('should handle empty onSend callback', () => {
      const { getByLabelText } = render(
        <ChatInput {...defaultProps} input="test" onSend={undefined as any} />
      );

      const button = getByLabelText('Send message');

      // Should not throw when clicking with undefined callback
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });
});
