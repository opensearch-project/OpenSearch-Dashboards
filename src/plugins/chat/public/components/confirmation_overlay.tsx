/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiModalFooter,
  EuiButton,
  EuiButtonEmpty,
  EuiText,
  EuiSpacer,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiCallOut,
} from '@elastic/eui';
import { ConfirmationRequest, ConfirmationService } from '../services/confirmation_service';

interface ConfirmationOverlayProps {
  confirmationService: ConfirmationService;
}

/**
 * Modal overlay for confirming tool calls
 * Similar to Kiro's confirmation UI
 */
export const ConfirmationOverlay: React.FC<ConfirmationOverlayProps> = ({
  confirmationService,
}) => {
  const [pendingConfirmations, setPendingConfirmations] = useState<ConfirmationRequest[]>([]);
  const [currentRequest, setCurrentRequest] = useState<ConfirmationRequest | null>(null);

  useEffect(() => {
    const subscription = confirmationService.getPendingConfirmations$().subscribe((requests) => {
      setPendingConfirmations(requests);
      // Show the first pending request
      if (requests.length > 0 && !currentRequest) {
        setCurrentRequest(requests[0]);
      } else if (requests.length === 0) {
        setCurrentRequest(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [confirmationService, currentRequest]);

  const handleApprove = () => {
    if (currentRequest) {
      confirmationService.approve(currentRequest.id);
      // Show next request if any
      const remaining = pendingConfirmations.filter((req) => req.id !== currentRequest.id);
      setCurrentRequest(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleReject = () => {
    if (currentRequest) {
      confirmationService.reject(currentRequest.id);
      // Show next request if any
      const remaining = pendingConfirmations.filter((req) => req.id !== currentRequest.id);
      setCurrentRequest(remaining.length > 0 ? remaining[0] : null);
    }
  };

  if (!currentRequest) {
    return null;
  }

  return (
    <EuiModal onClose={handleReject} maxWidth={600}>
      <EuiModalHeader>
        <EuiModalHeaderTitle>
          <EuiFlexGroup gutterSize="s" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiIcon type="questionInCircle" size="l" color="primary" />
            </EuiFlexItem>
            <EuiFlexItem>Confirm Tool Execution</EuiFlexItem>
          </EuiFlexGroup>
        </EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        <EuiCallOut
          title={`The AI wants to execute: ${currentRequest.toolName}`}
          color="primary"
          iconType="iInCircle"
        >
          {currentRequest.description && (
            <EuiText size="s">
              <p>{currentRequest.description}</p>
            </EuiText>
          )}
        </EuiCallOut>

        <EuiSpacer size="m" />

        <EuiText size="s">
          <h4>Parameters:</h4>
        </EuiText>
        <EuiSpacer size="s" />
        <EuiCodeBlock language="json" fontSize="s" paddingSize="m" isCopyable>
          {JSON.stringify(currentRequest.args, null, 2)}
        </EuiCodeBlock>

        {pendingConfirmations.length > 1 && (
          <>
            <EuiSpacer size="m" />
            <EuiText size="xs" color="subdued">
              {pendingConfirmations.length - 1} more confirmation(s) pending
            </EuiText>
          </>
        )}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButtonEmpty onClick={handleReject} color="danger">
          Reject
        </EuiButtonEmpty>
        <EuiButton onClick={handleApprove} fill>
          Approve
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
};
