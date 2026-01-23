/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationMessage } from './confirmation_message';
import { ConfirmationRequest } from '../services/confirmation_service';

describe('ConfirmationMessage', () => {
  const mockRequest: ConfirmationRequest = {
    id: 'test-id-123',
    toolName: 'testTool',
    toolCallId: 'call-123',
    args: { param1: 'value1' },
    timestamp: Date.now(),
  };

  const mockOnApprove = jest.fn();
  const mockOnReject = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with message and buttons', () => {
    render(
      <ConfirmationMessage
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('Waiting for input...')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm')).toBeInTheDocument();
    expect(screen.getByLabelText('Reject')).toBeInTheDocument();
  });

  it('should call onApprove when approve button is clicked', () => {
    render(
      <ConfirmationMessage
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    fireEvent.click(screen.getByLabelText('Confirm'));

    expect(mockOnApprove).toHaveBeenCalledTimes(1);
    expect(mockOnReject).not.toHaveBeenCalled();
  });

  it('should call onReject when reject button is clicked', () => {
    render(
      <ConfirmationMessage
        request={mockRequest}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    fireEvent.click(screen.getByLabelText('Reject'));

    expect(mockOnReject).toHaveBeenCalledTimes(1);
    expect(mockOnApprove).not.toHaveBeenCalled();
  });
});
