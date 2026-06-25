/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatHeader } from './chat_header';

describe('ChatHeader tooltips', () => {
  const defaultProps = {
    isStreaming: false,
    onNewChat: jest.fn(),
    onClose: jest.fn(),
  };

  it('should have tooltip on new chat button', () => {
    render(<ChatHeader {...defaultProps} />);

    const newChatButton = screen.getByLabelText('New chat');
    const tooltip = newChatButton.closest('[class*="euiToolTip"]');

    expect(tooltip).toBeTruthy();
  });

  it('should have tooltip on close button', () => {
    render(<ChatHeader {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close chatbot');
    const tooltip = closeButton.closest('[class*="euiToolTip"]');

    expect(tooltip).toBeTruthy();
  });

  it('should have tooltip on history button', () => {
    const onShowHistory = jest.fn();
    render(<ChatHeader {...defaultProps} onShowHistory={onShowHistory} />);

    const historyButton = screen.getByLabelText('Show conversation history');
    const tooltip = historyButton.closest('[class*="euiToolTip"]');

    expect(tooltip).toBeTruthy();
  });

  it('should have tooltip on back button', () => {
    const onBack = jest.fn();
    render(<ChatHeader {...defaultProps} showBackButton={true} onBack={onBack} />);

    const backButton = screen.getByLabelText('Go back');
    const tooltip = backButton.closest('[class*="euiToolTip"]');

    expect(tooltip).toBeTruthy();
  });
});
