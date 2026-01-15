/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { EuiPanel, EuiText, EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ConfirmationRequest } from '../services/confirmation_service';
import './confirmation_message.scss';

interface ConfirmationMessageProps {
  request: ConfirmationRequest;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Inline confirmation message displayed in the chat timeline
 * Shows as "Waiting for input..." with a yellow background for user confirmation
 */
export const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  const confirmationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to confirmation when it appears
  useEffect(() => {
    if (confirmationRef.current) {
      confirmationRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, []);

  return (
    <div className="confirmationMessage" ref={confirmationRef}>
      <div className="confirmationMessage__content">
        <EuiPanel paddingSize="s" color="warning" hasShadow={false} hasBorder={true}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem>
              <EuiText size="s" color="default">
                Waiting for input...
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" responsive={false} alignItems="center">
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
