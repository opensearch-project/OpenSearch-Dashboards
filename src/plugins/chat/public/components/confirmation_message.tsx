/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ConfirmationRequest } from '../services/confirmation_service';
import './confirmation_message.scss';

interface ConfirmationMessageProps {
  request: ConfirmationRequest;
  onApprove: () => void;
  onReject: () => void;
}

export const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  return (
    <div className="confirmationMessage">
      <div className="confirmationMessage__content">
        <EuiPanel paddingSize="s" color="warning" hasShadow={false} hasBorder={true}>
          <EuiFlexGroup alignItems="center" gutterSize="xs" responsive={false}>
            <EuiFlexItem>
              <EuiText size="xs" color="default">
                Waiting for input...
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="xs" responsive={false} alignItems="center">
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    size="s"
                    color="danger"
                    iconType="crossInCircleEmpty"
                    onClick={onReject}
                    aria-label="Reject"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    size="s"
                    color="success"
                    iconType="checkInCircleEmpty"
                    onClick={onApprove}
                    aria-label="Confirm"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </div>
    </div>
  );
};
