/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiPanel, EuiText, EuiIcon, EuiBadge, EuiAccordion } from '@elastic/eui';
import './tool_call_row.scss';

interface TimelineToolCall {
  type: 'tool_call';
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  result?: string;
  timestamp: number;
}

interface ToolCallRowProps {
  toolCall: TimelineToolCall;
}

export const ToolCallRow: React.FC<ToolCallRowProps> = ({ toolCall }) => {
  return (
    <div className="toolCallRow">
      <div className="toolCallRow__icon">
        <EuiIcon type="wrench" size="m" color="accent" />
      </div>
      <div className="toolCallRow__content">
        <div className="toolCallRow__info">
          <EuiText size="s" style={{ fontWeight: 600 }}>
            {toolCall.toolName}
          </EuiText>
          <EuiBadge
            color={
              toolCall.status === 'running'
                ? 'warning'
                : toolCall.status === 'completed'
                ? 'success'
                : 'danger'
            }
          >
            {toolCall.status === 'running' ? 'Running' : toolCall.status}
          </EuiBadge>
        </div>
        {toolCall.result && toolCall.status === 'completed' && (
          <div className="toolCallRow__result">
            <EuiAccordion
              id={`tool-result-${toolCall.id}`}
              buttonContent="View Result"
              paddingSize="none"
              initialIsOpen={false}
            >
              <EuiPanel paddingSize="s" color="subdued" className="toolCallRow__resultText">
                <EuiText size="xs">{toolCall.result}</EuiText>
              </EuiPanel>
            </EuiAccordion>
          </div>
        )}
      </div>
    </div>
  );
};
