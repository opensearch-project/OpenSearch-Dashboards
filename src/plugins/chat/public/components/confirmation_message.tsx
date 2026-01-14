/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  EuiPanel,
  EuiText,
  EuiButton,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiButtonIcon,
  EuiSpacer,
} from '@elastic/eui';
import { ConfirmationRequest } from '../services/confirmation_service';
import './confirmation_message.scss';

interface ConfirmationMessageProps {
  request: ConfirmationRequest;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Inline confirmation message displayed in the chat timeline
 * Compact design with expandable parameters section
 */
export const ConfirmationMessage: React.FC<ConfirmationMessageProps> = ({
  request,
  onApprove,
  onReject,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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
      <div className="confirmationMessage__icon">
        <EuiIcon type="questionInCircle" size="m" color="primary" />
      </div>
      <div className="confirmationMessage__content">
        <EuiPanel paddingSize="s" color="primary" hasBorder>
          {/* Title row with actions */}
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType={isExpanded ? 'arrowDown' : 'arrowRight'}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Collapse parameters' : 'Expand parameters'}
                color="text"
                size="s"
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size="s">
                <strong>Confirm: {request.toolName}</strong>
                {request.description && (
                  <span style={{ marginLeft: '8px', color: '#69707D' }}>
                    — {request.description}
                  </span>
                )}
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty size="s" onClick={onReject} color="danger">
                    Reject
                  </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton size="s" onClick={onApprove} fill>
                    Approve
                  </EuiButton>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>

          {/* Expandable parameters section */}
          {isExpanded && (
            <>
              <EuiSpacer size="s" />
              <EuiCodeBlock language="json" fontSize="s" paddingSize="s" isCopyable>
                {JSON.stringify(request.args, null, 2)}
              </EuiCodeBlock>
            </>
          )}
        </EuiPanel>
      </div>
    </div>
  );
};
