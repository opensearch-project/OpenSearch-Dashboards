/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiIcon, EuiBadge } from '@elastic/eui';
import './error_row.scss';

interface TimelineError {
  type: 'error';
  id: string;
  message: string;
  code?: string;
  timestamp: number;
}

interface ErrorRowProps {
  error: TimelineError;
}

export const ErrorRow: React.FC<ErrorRowProps> = ({ error }) => {
  return (
    <div className="errorRow">
      <div className="errorRow__icon">
        <EuiIcon type="error" size="m" color="danger" />
      </div>
      <div className="errorRow__content">
        <div className="errorRow__info">
          <EuiText size="s" style={{ fontWeight: 600, color: '#BD271E' }}>
            Run Error
          </EuiText>
          {error.code && <EuiBadge color="danger">{error.code}</EuiBadge>}
        </div>
        <div className="errorRow__message">
          <EuiText size="s" color="danger">
            {error.message}
          </EuiText>
        </div>
      </div>
    </div>
  );
};
