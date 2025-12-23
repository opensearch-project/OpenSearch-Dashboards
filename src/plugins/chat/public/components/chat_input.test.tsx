/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatInput } from './chat_input';
import { ChatLayoutMode } from './chat_header_button';

describe('ChatInput', () => {
  const defaultProps = {
    layoutMode: ChatLayoutMode.SIDECAR,
    input: '',
    isStreaming: false,
    onInputChange: jest.fn(),
    onSend: jest.fn(),
    onKeyDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should render input field with correct placeholder', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
    });

    it('should call onInputChange when typing', () => {
      const onInputChange = jest.fn();
      render(<ChatInput {...defaultProps} onInputChange={onInputChange} />);

      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.change(input, { target: { value: 'test message' } });

      expect(onInputChange).toHaveBeenCalledWith('test message');
    });

    it('should call onSend when send button is clicked', () => {
      const onSend = jest.fn();
      render(<ChatInput {...defaultProps} input="test message" onSend={onSend} />);

      const sendButton = screen.getByLabelText('Send message');
      fireEvent.click(sendButton);

      expect(onSend).toHaveBeenCalled();
    });

    it('should call onKeyDown when key is pressed', () => {
      const onKeyDown = jest.fn();
      render(<ChatInput {...defaultProps} onKeyDown={onKeyDown} />);

      const input = screen.getByPlaceholderText('Type your message...');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe('loading indicator functionality', () => {
    it('should show loading indicator when isCapturingImage is true', () => {
      render(<ChatInput {...defaultProps} isCapturingImage={true} />);

      expect(screen.getByText('Capturing screenshot...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument(); // EuiLoadingSpinner
    });

    it('should not show loading indicator when isCapturingImage is false', () => {
      render(<ChatInput {...defaultProps} isCapturingImage={false} />);

      expect(screen.queryByText('Capturing screenshot...')).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should not show loading indicator when isCapturingImage is undefined', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.queryByText('Capturing screenshot...')).not.toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should show loading indicator above image attachment when both are present', () => {
      const mockImageData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      render(
        <ChatInput
          {...defaultProps}
          isCapturingImage={true}
          pendingImage={mockImageData}
          onRemoveImage={jest.fn()}
        />
      );

      expect(screen.getByText('Capturing screenshot...')).toBeInTheDocument();
      expect(screen.getByAltText('Visualization screenshot')).toBeInTheDocument();
    });
  });

  describe('image attachment functionality', () => {
    const mockImageData =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    it('should show image attachment when pendingImage is provided', () => {
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={jest.fn()} />
      );

      expect(screen.getByAltText('Visualization screenshot')).toBeInTheDocument();
    });

    it('should not show image attachment when pendingImage is not provided', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.queryByAltText('Visualization screenshot')).not.toBeInTheDocument();
    });

    it('should show remove button when image is present and onRemoveImage is provided', () => {
      const onRemoveImage = jest.fn();
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={onRemoveImage} />
      );

      expect(screen.getByLabelText('Remove image')).toBeInTheDocument();
    });

    it('should call onRemoveImage when remove button is clicked', () => {
      const onRemoveImage = jest.fn();
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={onRemoveImage} />
      );

      const removeButton = screen.getByLabelText('Remove image');
      fireEvent.click(removeButton);

      expect(onRemoveImage).toHaveBeenCalled();
    });

    it('should not show remove button when onRemoveImage is not provided', () => {
      render(<ChatInput {...defaultProps} pendingImage={mockImageData} />);

      expect(screen.queryByLabelText('Remove image')).not.toBeInTheDocument();
    });

    it('should change placeholder text when image is present', () => {
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={jest.fn()} />
      );

      expect(
        screen.getByPlaceholderText('Ask a question about the visualization...')
      ).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Type your message...')).not.toBeInTheDocument();
    });

    it('should apply special CSS class to input when image is present', () => {
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={jest.fn()} />
      );

      const input = screen.getByPlaceholderText('Ask a question about the visualization...');
      expect(input).toHaveClass('chatInput__fieldWithImage');
    });
  });

  describe('button states', () => {
    it('should disable send button when input is empty and no image', () => {
      render(<ChatInput {...defaultProps} input="" />);

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has content', () => {
      render(<ChatInput {...defaultProps} input="test message" />);

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).not.toBeDisabled();
    });

    it('should enable send button when image is present even without text', () => {
      const mockImageData = 'data:image/png;base64,test';
      render(
        <ChatInput
          {...defaultProps}
          input=""
          pendingImage={mockImageData}
          onRemoveImage={jest.fn()}
        />
      );

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).not.toBeDisabled();
    });

    it('should disable send button when streaming', () => {
      render(<ChatInput {...defaultProps} input="test" isStreaming={true} />);

      const sendButton = screen.getByLabelText('Send message');
      expect(sendButton).toBeDisabled();
    });

    it('should disable input field when streaming', () => {
      render(<ChatInput {...defaultProps} isStreaming={true} />);

      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeDisabled();
    });

    it('should show different icon when streaming', () => {
      const { rerender } = render(<ChatInput {...defaultProps} isStreaming={false} />);

      // Check initial icon (sortUp)
      let sendButton = screen.getByLabelText('Send message');
      expect(sendButton.querySelector('[data-euiicon-type="sortUp"]')).toBeInTheDocument();

      // Check streaming icon (generate)
      rerender(<ChatInput {...defaultProps} isStreaming={true} />);
      sendButton = screen.getByLabelText('Send message');
      expect(sendButton.querySelector('[data-euiicon-type="generate"]')).toBeInTheDocument();
    });
  });

  describe('layout modes', () => {
    it('should apply sidecar layout class', () => {
      const { container } = render(
        <ChatInput {...defaultProps} layoutMode={ChatLayoutMode.SIDECAR} />
      );

      expect(container.querySelector('.chatInput--sidecar')).toBeInTheDocument();
    });

    it('should apply fullscreen layout class', () => {
      const { container } = render(
        <ChatInput {...defaultProps} layoutMode={ChatLayoutMode.FULLSCREEN} />
      );

      expect(container.querySelector('.chatInput--fullscreen')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      const mockImageData = 'data:image/png;base64,test';
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={jest.fn()} />
      );

      expect(screen.getByLabelText('Send message')).toBeInTheDocument();
      expect(screen.getByLabelText('Remove image')).toBeInTheDocument();
      expect(screen.getByAltText('Visualization screenshot')).toBeInTheDocument();
    });

    it('should have proper role for loading spinner', () => {
      render(<ChatInput {...defaultProps} isCapturingImage={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
