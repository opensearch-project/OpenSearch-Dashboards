/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import { EuiPanel, EuiText, EuiIcon, EuiBadge, EuiAccordion, EuiCodeBlock } from '@elastic/eui';
import { AssistantActionContext } from '../../../context_provider/public';
import { GraphVisualization } from './graph_visualization';
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
  // Always call useContext at the top level - React Hook rules
  const context = useContext(AssistantActionContext);

  // Try to get custom renderer if context is available
  const renderer = context?.getActionRenderer?.(toolCall.toolName);

  // Direct graph rendering for graph_timeseries_data tool (bypass context issues)
  if (
    toolCall.toolName === 'graph_timeseries_data' &&
    toolCall.status === 'completed' &&
    toolCall.result
  ) {
    try {
      const parsedResult = JSON.parse(toolCall.result);

      // Check if this is a successful graph result with graphData
      if (parsedResult.success && parsedResult.graphData) {
        return (
          <div className="toolCallRow">
            <div className="toolCallRow__content">
              <div className="toolCallRow__info">
                <EuiText size="s" style={{ fontWeight: 600 }}>
                  {toolCall.toolName}
                </EuiText>
                <EuiBadge color="success">Completed</EuiBadge>
              </div>
              <div style={{ marginTop: '8px' }}>
                <GraphVisualization data={parsedResult.graphData} height={300} />
              </div>
            </div>
          </div>
        );
      }
    } catch (error) {
      // Failed to parse graph result, fall through to default rendering
    }
  }

  // Try to use context-based custom renderer if available
  const shouldUseCustomRenderer =
    context &&
    renderer &&
    (toolCall.toolName === 'request_user_confirmation' || // Always render for user confirmation
      (toolCall.status === 'completed' && toolCall.result && toolCall.toolName === 'ppl_query')); // Other completed tools

  if (shouldUseCustomRenderer) {
    // For user confirmation, we don't need to parse result - just pass the status and args
    if (toolCall.toolName === 'request_user_confirmation') {
      return (
        <div className="toolCallRow">
          {renderer({
            status: toolCall.status === 'running' ? 'executing' : 'complete',
            args: undefined, // Args would come from the tool execution context
            result: toolCall.result,
            error: undefined,
          })}
        </div>
      );
    }

    // For other tools, try to parse JSON result
    try {
      const parsedResult = JSON.parse(toolCall.result!);
      const isStructuredResult =
        typeof parsedResult === 'object' &&
        (parsedResult.success !== undefined || parsedResult.graphData !== undefined);

      if (isStructuredResult) {
        return (
          <div className="toolCallRow">
            {renderer({
              status: 'complete',
              args: parsedResult.graphData || parsedResult,
              result: parsedResult,
              error: undefined,
            })}
          </div>
        );
      }
    } catch (error) {
      // Tool result is not JSON, fall through to default rendering
      // In production, this would be logged through a proper logging service
    }
  }

  // Default rendering
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
              <EuiCodeBlock
                paddingSize="s"
                fontSize="s"
                isCopyable
                className="toolCallRow__resultText"
                language="json"
              >
                {toolCall.result}
              </EuiCodeBlock>
            </EuiAccordion>
          </div>
        )}
      </div>
    </div>
  );
};
