/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatInput } from './chat_input';
import { ChatLayoutMode } from './chat_header_button';

describe('ChatInput Loading Indicator', () => {
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

  describe('loading indicator functionality', () => {
    it('should show loading indicator when isCapturingImage is true', () => {
      render(<ChatInput {...defaultProps} isCapturingImage={true} />);

      expect(screen.getByText('Capturing screenshot...')).toBeInTheDocument();
      expect(screen.getByTestId('euiLoadingSpinner')).toBeInTheDocument();
    });

    it('should not show loading indicator when isCapturingImage is false', () => {
      render(<ChatInput {...defaultProps} isCapturingImage={false} />);

      expect(screen.queryByText('Capturing screenshot...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('euiLoadingSpinner')).not.toBeInTheDocument();
    });

    it('should not show loading indicator when isCapturingImage is undefined', () => {
      render(<ChatInput {...defaultProps} />);

      expect(screen.queryByText('Capturing screenshot...')).not.toBeInTheDocument();
      expect(screen.queryByTestId('euiLoadingSpinner')).not.toBeInTheDocument();
    });

    it('should show loading indicator above image attachment when both are present', () => {
      const mockImageData = 'data:image/png;base64,test';

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

  describe('image attachment with loading states', () => {
    const mockImageData = 'data:image/png;base64,test';

    it('should change placeholder text when image is present', () => {
      render(
        <ChatInput {...defaultProps} pendingImage={mockImageData} onRemoveImage={jest.fn()} />
      );

      expect(
        screen.getByPlaceholderText('Ask a question about the visualization...')
      ).toBeInTheDocument();
    });

    it('should enable send button when image is present even without text', () => {
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

    it('should show loading indicator without image initially', () => {
      render(<ChatInput {...defaultProps} isCapturingImage={true} />);

      expect(screen.getByText('Capturing screenshot...')).toBeInTheDocument();
      expect(screen.queryByAltText('Visualization screenshot')).not.toBeInTheDocument();
    });
  });
});
