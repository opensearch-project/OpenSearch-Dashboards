/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiText, EuiIcon } from '@elastic/eui';
import type { SystemMessage } from '../../common/types';
import './error_row.scss';

interface ErrorRowProps {
  error: SystemMessage;
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
            System Error
          </EuiText>
        </div>
        <div className="errorRow__message">
          <EuiText size="s" color="danger">
            {error.content}
          </EuiText>
        </div>
      </div>
    </div>
  );
};
