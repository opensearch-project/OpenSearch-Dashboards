/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ErrorRow } from './error_row';
import type { SystemMessage } from '../../common/types';

describe('ErrorRow', () => {
  const baseError: SystemMessage = {
    id: 'error-1',
    role: 'system',
    content: 'Something failed',
  };

  it('should not render resend button when canResend is false', () => {
    const { queryByTestId } = render(<ErrorRow error={baseError} />);
    expect(queryByTestId('chatErrorRowResendToolResult')).toBeNull();
  });

  it('should render resend button when canResend, toolCallId, toolResult, and callback are present', () => {
    const error: SystemMessage = {
      ...baseError,
      toolCallId: 'tool-1',
      canResend: true,
      toolResult: { ok: true },
    };
    const onResend = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(<ErrorRow error={error} onResendToolResult={onResend} />);
    expect(getByTestId('chatErrorRowResendToolResult')).toBeTruthy();
  });

  it('should call onResendToolResult with messageId, toolCallId, and toolResult on click and disable button during send', async () => {
    let resolveSend: () => void = () => {};
    const onResend = jest.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSend = resolve;
        })
    );

    const error: SystemMessage = {
      ...baseError,
      id: 'msg-123',
      toolCallId: 'tool-456',
      canResend: true,
      toolResult: { data: 'test' },
    };

    const { getByTestId } = render(<ErrorRow error={error} onResendToolResult={onResend} />);
    const button = getByTestId('chatErrorRowResendToolResult');

    fireEvent.click(button);

    expect(onResend).toHaveBeenCalledWith({
      messageId: 'msg-123',
      toolCallId: 'tool-456',
      toolResult: { data: 'test' },
    });

    // Button should be disabled while sending
    expect(button.closest('button')).toBeDisabled();

    // Resolve the promise
    resolveSend();

    await waitFor(() => {
      expect(button.closest('button')).not.toBeDisabled();
    });
  });
});
