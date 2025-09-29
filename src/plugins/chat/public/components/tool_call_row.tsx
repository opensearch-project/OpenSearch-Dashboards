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

  // Direct graph rendering for graph_timeseries_data tool
  if (toolCall.toolName === 'graph_timeseries_data') {
    // Function to find graph data from context or toolCall
    const findGraphData = () => {
      // Check toolCall result first
      if (toolCall.result) {
        try {
          const parsedResult = JSON.parse(toolCall.result);
          if (parsedResult.success && parsedResult.graphData) {
            return parsedResult;
          }
        } catch (error) {
          // Not JSON, continue
        }
      }

      // Check context toolCallStates for immediate data availability
      if (context?.toolCallStates) {
        const ourToolState = context.toolCallStates.get(toolCall.id);
        if (ourToolState?.args && typeof ourToolState.args === 'object' && ourToolState.args.data) {
          // Create graph data structure from tool args
          const graphData = {
            data: ourToolState.args.data,
            title: ourToolState.args.title || 'Time Series Chart',
            xAxisLabel: ourToolState.args.xAxisLabel || 'Time',
            yAxisLabel: ourToolState.args.yAxisLabel || 'Value',
            query: ourToolState.args.query,
            metadata: ourToolState.args.metadata,
          };

          return { success: true, graphData };
        }
      }

      return null;
    };

    // Try to find graph data
    const foundGraphData = findGraphData();
    // Render graph if data is available
    if (foundGraphData && foundGraphData.graphData) {
      return (
        <div className="toolCallRow">
          <div className="toolCallRow__icon">
            <EuiIcon type="visLine" size="m" color="success" />
          </div>
          <div className="toolCallRow__content">
            <div className="toolCallRow__info">
              <EuiText size="s" style={{ fontWeight: 600 }}>
                {toolCall.toolName}
              </EuiText>
              <EuiBadge color={toolCall.status === 'completed' ? 'success' : 'primary'}>
                {toolCall.status === 'completed' ? 'Completed' : 'Ready'}
              </EuiBadge>
            </div>
            <div style={{ marginTop: '8px' }}>
              <GraphVisualization data={foundGraphData.graphData} height={300} />
            </div>
          </div>
        </div>
      );
    }

    // Check for error in found data
    if (foundGraphData && foundGraphData.success === false) {
      return (
        <div className="toolCallRow">
          <div className="toolCallRow__icon">
            <EuiIcon type="visLine" size="m" color="danger" />
          </div>
          <div className="toolCallRow__content">
            <div className="toolCallRow__info">
              <EuiText size="s" style={{ fontWeight: 600 }}>
                {toolCall.toolName}
              </EuiText>
              <EuiBadge color="danger">Error</EuiBadge>
            </div>
            <EuiPanel paddingSize="m" style={{ marginTop: '8px' }}>
              <EuiText size="s" color="danger">
                {foundGraphData.error || 'Failed to generate graph visualization'}
              </EuiText>
            </EuiPanel>
          </div>
        </div>
      );
    }

    // Handle running state (no valid result data yet)
    if (toolCall.status === 'running') {
      return (
        <div className="toolCallRow">
          <div className="toolCallRow__icon">
            <EuiIcon type="visLine" size="m" color="accent" />
          </div>
          <div className="toolCallRow__content">
            <div className="toolCallRow__info">
              <EuiText size="s" style={{ fontWeight: 600 }}>
                {toolCall.toolName}
              </EuiText>
              <EuiBadge color="primary">Running</EuiBadge>
            </div>
            <EuiPanel paddingSize="m" style={{ height: '300px', marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                }}
              >
                <EuiIcon type="loading" size="l" />
                <EuiText size="s" color="subdued" style={{ marginTop: '16px' }}>
                  Generating graph visualization...
                </EuiText>
              </div>
            </EuiPanel>
          </div>
        </div>
      );
    }

    // Handle completed state
    if (toolCall.status === 'completed' && toolCall.result) {
      try {
        const parsedResult = JSON.parse(toolCall.result);

        // Check if this is a successful graph result with graphData
        if (parsedResult.success && parsedResult.graphData) {
          return (
            <div className="toolCallRow">
              <div className="toolCallRow__icon">
                <EuiIcon type="visLine" size="m" color="success" />
              </div>
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

        // Handle case where result exists but doesn't have proper graphData
        if (parsedResult.success === false) {
          return (
            <div className="toolCallRow">
              <div className="toolCallRow__icon">
                <EuiIcon type="visLine" size="m" color="danger" />
              </div>
              <div className="toolCallRow__content">
                <div className="toolCallRow__info">
                  <EuiText size="s" style={{ fontWeight: 600 }}>
                    {toolCall.toolName}
                  </EuiText>
                  <EuiBadge color="danger">Error</EuiBadge>
                </div>
                <EuiPanel paddingSize="m" style={{ marginTop: '8px' }}>
                  <EuiText size="s" color="danger">
                    {parsedResult.error || 'Failed to generate graph visualization'}
                  </EuiText>
                </EuiPanel>
              </div>
            </div>
          );
        }
      } catch (error) {
        // Failed to parse graph result, show error state
        return (
          <div className="toolCallRow">
            <div className="toolCallRow__icon">
              <EuiIcon type="visLine" size="m" color="danger" />
            </div>
            <div className="toolCallRow__content">
              <div className="toolCallRow__info">
                <EuiText size="s" style={{ fontWeight: 600 }}>
                  {toolCall.toolName}
                </EuiText>
                <EuiBadge color="danger">Error</EuiBadge>
              </div>
              <EuiPanel paddingSize="m" style={{ marginTop: '8px' }}>
                <EuiText size="s" color="danger">
                  Failed to parse graph data
                </EuiText>
              </EuiPanel>
            </div>
          </div>
        );
      }
    }

    // Handle error state
    if (toolCall.status === 'error') {
      return (
        <div className="toolCallRow">
          <div className="toolCallRow__icon">
            <EuiIcon type="visLine" size="m" color="danger" />
          </div>
          <div className="toolCallRow__content">
            <div className="toolCallRow__info">
              <EuiText size="s" style={{ fontWeight: 600 }}>
                {toolCall.toolName}
              </EuiText>
              <EuiBadge color="danger">Error</EuiBadge>
            </div>
            <EuiPanel paddingSize="m" style={{ marginTop: '8px' }}>
              <EuiText size="s" color="danger">
                {toolCall.result || 'An error occurred while generating the graph'}
              </EuiText>
            </EuiPanel>
          </div>
        </div>
      );
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
