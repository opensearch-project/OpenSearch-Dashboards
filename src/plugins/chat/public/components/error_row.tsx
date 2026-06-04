/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiText, EuiIcon, EuiButtonEmpty } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import type { SystemMessage } from '../../common/types';
import './error_row.scss';

interface ErrorRowProps {
  error: SystemMessage;
  onResendToolResult?: (params: {
    messageId: string;
    toolCallId: string;
    toolResult: any;
  }) => Promise<void>;
}

export const ErrorRow: React.FC<ErrorRowProps> = ({ error, onResendToolResult }) => {
  const [isResending, setIsResending] = useState(false);
  const canResend = Boolean(
    error.canResend && error.toolCallId && error.toolResult && onResendToolResult
  );

  const handleResend = async () => {
    if (!error.toolCallId || !error.toolResult || !onResendToolResult) return;
    setIsResending(true);
    try {
      await onResendToolResult({
        messageId: error.id,
        toolCallId: error.toolCallId,
        toolResult: error.toolResult,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="errorRow">
      <div className="errorRow__icon">
        <EuiIcon type="error" size="m" color="danger" />
      </div>
      <div className="errorRow__content">
        <div className="errorRow__info">
          <EuiText size="s" style={{ fontWeight: 600, color: '#BD271E' }}>
            {error.title ||
              i18n.translate('chat.errorRow.title', {
                defaultMessage: 'Something went wrong',
              })}
          </EuiText>
        </div>
        <div className="errorRow__message">
          <EuiText size="s" color="danger">
            {error.content}
          </EuiText>
        </div>
        {canResend && (
          <div className="errorRow__actions">
            <EuiButtonEmpty
              size="xs"
              iconType="refresh"
              color="danger"
              isLoading={isResending}
              isDisabled={isResending}
              onClick={handleResend}
              data-test-subj="chatErrorRowResendToolResult"
            >
              {i18n.translate('chat.errorRow.resendToolResult', {
                defaultMessage: 'Resend tool result',
              })}
            </EuiButtonEmpty>
          </div>
        )}
      </div>
    </div>
  );
};
