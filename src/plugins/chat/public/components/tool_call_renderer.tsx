/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { EuiLoadingSpinner, EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { AssistantActionContext } from '../../../context_provider/public';

interface ToolCallRendererProps {
  toolCallId: string;
}

export function ToolCallRenderer({ toolCallId }: ToolCallRendererProps) {
  // ToolCallRenderer called with toolCallId

  const context = useContext(AssistantActionContext);

  if (!context) {
    // No AssistantActionContext found
    return null;
  }

  const { toolCallStates, getActionRenderer } = context;
  const toolCallState = toolCallStates.get(toolCallId);

  // Tool call state retrieved

  if (!toolCallState) {
    // No tool call state found for ID
    return null;
  }

  const renderer = getActionRenderer(toolCallState.name);
  // Renderer lookup completed

  // If no custom renderer, show default status
  if (!renderer) {
    if (toolCallState.status === 'executing') {
      return (
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="m" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s" color="subdued">
              Running {toolCallState.name}...
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }
    return null;
  }

  // Use custom renderer
  // Using custom renderer
  return (
    <div className="tool-call-render">
      {renderer({
        status: toolCallState.status,
        args: toolCallState.args,
        result: toolCallState.result,
        error: toolCallState.error,
      })}
    </div>
  );
}
