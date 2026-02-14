/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useContext } from 'react';
import {
  EuiPanel,
  EuiText,
  EuiIcon,
  EuiBadge,
  EuiAccordion,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiSpacer,
  EuiLoadingContent,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  AssistantActionContext,
  AssistantActionContextValue,
} from '../../../context_provider/public';
import { GraphVisualization } from './graph_visualization';
import './tool_call_row.scss';

export interface TimelineToolCall {
  type: 'tool_call';
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  result?: string;
  arguments?: string;
  timestamp: number;
}

interface ToolCallRowProps {
  toolCall: TimelineToolCall;
  onApprove?: () => void;
  onReject?: () => void;
  initialOpen?: boolean;
}

const renderFallbackGraphTool = ({
  toolCall,
  context,
}: {
  toolCall: TimelineToolCall;
  context: AssistantActionContextValue | null;
}) => {
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
};

const getCustomizedRenderOptions = ({
  toolCall,
  context,
  onApprove,
  onReject,
}: ToolCallRowProps & { context: AssistantActionContextValue | null }) => {
  // Check context toolCallStates for immediate data availability
  let args;
  let result;

  if (context?.toolCallStates) {
    const ourToolState = context.toolCallStates.get(toolCall.id);
    if (ourToolState?.args) {
      args = ourToolState.args;
    }
    if (ourToolState?.result) {
      result = ourToolState.result;
    }
  }

  // Also try to parse result from toolCall.result
  if (!result && toolCall.result) {
    try {
      result = JSON.parse(toolCall.result);
    } catch (error) {
      // Not JSON, use as is
      result = toolCall.result;
    }
  }
  // Also try to parse arguments from toolCall.arguuments
  if (!args && toolCall.arguments) {
    try {
      args = JSON.parse(toolCall.arguments);
    } catch (error) {
      // Not JSON, use as is
      args = toolCall.arguments;
    }
  }

  // Determine the correct status and result
  let renderStatus: 'pending' | 'executing' | 'complete' | 'failed' = 'executing';
  const renderResult = result;

  // If we have a result from the context, the tool is complete
  if (result && typeof result === 'object' && result.success !== undefined) {
    renderStatus = result.success ? 'complete' : 'failed';
  } else if (toolCall.status === 'completed') {
    renderStatus = 'complete';
  } else if (toolCall.status === 'error') {
    renderStatus = 'failed';
  }

  return {
    status: renderStatus,
    args,
    result: renderResult,
    error: toolCall.status === 'error' ? new Error(toolCall.result || 'Unknown error') : undefined,
    onApprove,
    onReject,
  };
};

const isValidJSON = (content: string) => {
  try {
    JSON.parse(content);
    return true;
  } catch (error) {
    return false;
  }
};

export const ToolCallRow: React.FC<ToolCallRowProps> = ({
  toolCall,
  onApprove,
  onReject,
  initialOpen,
}) => {
  // Always call useContext at the top level - React Hook rules
  const context = useContext(AssistantActionContext);

  // Try to get custom renderer if context is available
  // Handle tool name mapping for graph visualization
  const actualToolName =
    toolCall.toolName === 'execute_promql_query' ? 'graph_timeseries_data' : toolCall.toolName;
  const renderer = context?.getActionRenderer?.(actualToolName);

  // Check if this is a graph visualization tool (handles both names)
  const isGraphTool =
    toolCall.toolName === 'graph_timeseries_data' || toolCall.toolName === 'execute_promql_query';

  // Try to use context-based custom renderer first if available
  const shouldUseCustomRenderer =
    context &&
    renderer &&
    (toolCall.toolName === 'request_user_confirmation' || // Always render for user confirmation
      isGraphTool || // Always render for graph visualization (both names)
      context.shouldUseCustomRenderer?.(actualToolName) || // Use custom renderer if specified
      (toolCall.status === 'completed' && toolCall.result && toolCall.toolName === 'ppl_query')); // Other completed tools

  // Direct graph rendering for graph visualization tools
  if (isGraphTool) {
    if (shouldUseCustomRenderer) {
      return (
        <div className="toolCallRow">
          {renderer(
            getCustomizedRenderOptions({
              toolCall,
              context,
            })
          )}
        </div>
      );
    }
    // fallback
    return renderFallbackGraphTool({
      toolCall,
      context,
    });
  }

  if (shouldUseCustomRenderer) {
    return renderer(
      getCustomizedRenderOptions({
        toolCall,
        context,
        onApprove,
        onReject,
      })
    );
  }

  const isRunning = toolCall.status === 'running';

  if (isRunning) {
    return (
      <div>
        <EuiFlexGroup alignItems="center" gutterSize="xs">
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size="m" />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">
              {i18n.translate('chat.toolCall.runningLabel', {
                defaultMessage: 'Running {toolName}',
                values: {
                  toolName: toolCall.toolName,
                },
              })}
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="xs" />
        <EuiLoadingContent lines={2} />
      </div>
    );
  }
  let iconType = 'checkInCircleEmpty';
  let iconColor = 'success';
  const isError = toolCall.status === 'error';

  if (isError) {
    iconType = 'alert';
    iconColor = 'danger';
  }

  return (
    <EuiAccordion
      id={`tool-call-${toolCall.id}-${toolCall.status}`}
      initialIsOpen={initialOpen || toolCall.status === 'running'}
      arrowDisplay="right"
      buttonContent={
        <EuiFlexGroup alignItems="center" gutterSize="xs">
          <EuiFlexItem grow={false}>
            <EuiIcon size="m" type={iconType} color={iconColor} />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiText size="s">{toolCall.toolName}</EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      }
    >
      <EuiSpacer size="xs" />
      <EuiPanel hasBorder paddingSize="s" style={{ wordBreak: 'break-all' }}>
        {isError &&
          i18n.translate('chat.toolCall.errorMessage', {
            defaultMessage: 'Error message: {errorMessage}',
            values: {
              errorMessage: toolCall.result,
            },
          })}
        {!isError && toolCall.result && isValidJSON(toolCall.result) ? (
          <EuiCodeBlock
            language="json"
            paddingSize="none"
            fontSize="s"
            transparentBackground
            overflowHeight={200}
            isCopyable
          >
            {toolCall.result}
          </EuiCodeBlock>
        ) : (
          toolCall.result
        )}
      </EuiPanel>
    </EuiAccordion>
  );
};
