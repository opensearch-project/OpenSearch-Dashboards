/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiText,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import { useAssistantAction } from '../../../context_provider/public';

interface UserConfirmationArgs {
  message: string;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Example action that requires user confirmation before proceeding
 * This demonstrates human-in-the-loop workflows
 */
export function useUserConfirmationAction() {
  useAssistantAction<UserConfirmationArgs>({
    name: 'request_user_confirmation',
    description: 'Request confirmation from the user before proceeding with an action',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The message to display to the user',
        },
        confirmText: {
          type: 'string',
          description: 'Text for the confirm button (default: "Confirm")',
        },
        cancelText: {
          type: 'string',
          description: 'Text for the cancel button (default: "Cancel")',
        },
      },
      required: ['message'],
    },
    handler: async (args) => {
      // Return a promise that resolves when user makes a choice
      return new Promise((resolve) => {
        // This would be handled by the render function
        // The actual user interaction happens in the UI
        // For now, we just mark it as needing user input
        (window as any).__pendingConfirmation = { args, resolve };
      });
    },
    render: ({ status, args, result }) => {
      if (status === 'executing' && args) {
        return <UserConfirmationUI args={args} />;
      }

      if (status === 'complete') {
        return (
          <EuiPanel paddingSize="s" color="success">
            <EuiText size="s">
              <p>✓ User {result ? 'confirmed' : 'cancelled'} the action</p>
            </EuiText>
          </EuiPanel>
        );
      }

      return null;
    },
  });
}

function UserConfirmationUI({ args }: { args: UserConfirmationArgs }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = () => {
    setIsProcessing(true);
    const pending = (window as any).__pendingConfirmation;
    if (pending && pending.resolve) {
      pending.resolve(true);
      delete (window as any).__pendingConfirmation;
    }
  };

  const handleCancel = () => {
    setIsProcessing(true);
    const pending = (window as any).__pendingConfirmation;
    if (pending && pending.resolve) {
      pending.resolve(false);
      delete (window as any).__pendingConfirmation;
    }
  };

  return (
    <EuiPanel paddingSize="m" color="warning">
      <EuiTitle size="xs">
        <h4>User Confirmation Required</h4>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s">
        <p>{args.message}</p>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiFlexGroup gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            fill
            color="primary"
            onClick={handleConfirm}
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            {args.confirmText || 'Confirm'}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" onClick={handleCancel} disabled={isProcessing}>
            {args.cancelText || 'Cancel'}
          </EuiButtonEmpty>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}
