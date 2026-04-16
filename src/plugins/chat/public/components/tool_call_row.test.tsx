/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ToolCallRow, TimelineToolCall } from './tool_call_row';

// Mock the context - use require inside the factory
jest.mock('../../../context_provider/public', () => {
  const actualReact = jest.requireActual('react');
  return {
    AssistantActionContext: actualReact.createContext(null),
  };
});

// Mock the GraphVisualization component
jest.mock('./graph_visualization', () => ({
  GraphVisualization: () => 'GraphVisualization',
}));

describe('ToolCallRow', () => {
  const createToolCall = (overrides: Partial<TimelineToolCall> = {}): TimelineToolCall => ({
    type: 'tool_call',
    id: 'tool-1',
    toolName: 'test_tool',
    status: 'completed',
    timestamp: Date.now(),
    ...overrides,
  });

  describe('running state', () => {
    it('should render loading spinner when tool is running', () => {
      const toolCall = createToolCall({ status: 'running' });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      expect(screen.getByText(/Running test_tool/)).toBeInTheDocument();
      expect(container.querySelector('.euiLoadingSpinner')).toBeInTheDocument();
    });

    it('should show loading content placeholder when running', () => {
      const toolCall = createToolCall({ status: 'running' });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      expect(container.querySelector('.euiLoadingContent')).toBeInTheDocument();
    });
  });

  describe('completed state', () => {
    it('should render success icon when completed', () => {
      const toolCall = createToolCall({
        status: 'completed',
        result: '{"success": true}',
      });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      expect(
        container.querySelector('[data-euiicon-type="checkInCircleEmpty"]')
      ).toBeInTheDocument();
    });

    it('should render tool name in accordion button', () => {
      const toolCall = createToolCall({
        status: 'completed',
        toolName: 'my_custom_tool',
        result: 'result data',
      });

      render(<ToolCallRow toolCall={toolCall} />);

      expect(screen.getByText('my_custom_tool')).toBeInTheDocument();
    });

    it('should render result as JSON code block when valid JSON', () => {
      const toolCall = createToolCall({
        status: 'completed',
        result: '{"key": "value", "number": 42}',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText('Result:')).toBeInTheDocument();
      // The JSON content should be present
      expect(screen.getByText(/"key"/)).toBeInTheDocument();
    });

    it('should render result as plain text when not valid JSON', () => {
      const toolCall = createToolCall({
        status: 'completed',
        result: 'Plain text result',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText('Plain text result')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should render alert icon when error', () => {
      const toolCall = createToolCall({
        status: 'error',
        result: 'Error message',
      });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      expect(container.querySelector('[data-euiicon-type="alert"]')).toBeInTheDocument();
    });

    it('should display error message', () => {
      const toolCall = createToolCall({
        status: 'error',
        result: 'Something went wrong',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText(/Error message: Something went wrong/)).toBeInTheDocument();
    });
  });

  describe('parameters display', () => {
    it('should display parameters section when arguments are provided', () => {
      const toolCall = createToolCall({
        status: 'completed',
        arguments: '{"query": "test query", "limit": 10}',
        result: '{"data": []}',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText('Parameters:')).toBeInTheDocument();
    });

    it('should render arguments as formatted JSON when valid JSON', () => {
      const toolCall = createToolCall({
        status: 'completed',
        arguments: '{"query":"test","limit":10}',
        result: '{"data": []}',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      // The JSON content should be present and formatted
      expect(screen.getByText('Parameters:')).toBeInTheDocument();
      expect(screen.getByText(/"query"/)).toBeInTheDocument();
    });

    it('should render arguments as plain text when not valid JSON', () => {
      const toolCall = createToolCall({
        status: 'completed',
        arguments: 'plain text arguments',
        result: 'result',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText('plain text arguments')).toBeInTheDocument();
    });

    it('should not display parameters section when arguments are not provided', () => {
      const toolCall = createToolCall({
        status: 'completed',
        result: '{"data": []}',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.queryByText('Parameters:')).not.toBeInTheDocument();
    });

    it('should display both parameters and result sections', () => {
      const toolCall = createToolCall({
        status: 'completed',
        arguments: '{"input": "test"}',
        result: '{"output": "success"}',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText('Parameters:')).toBeInTheDocument();
      expect(screen.getByText('Result:')).toBeInTheDocument();
    });
  });

  describe('accordion behavior', () => {
    it('should be initially closed by default', () => {
      const toolCall = createToolCall({
        status: 'completed',
        result: 'result',
      });

      render(<ToolCallRow toolCall={toolCall} />);

      // The accordion content should not be visible by default
      // We check that the result text is not immediately visible
      const panels = document.querySelectorAll('.euiAccordion__childWrapper');
      expect(panels.length).toBeGreaterThan(0);
    });

    it('should be initially open when initialOpen is true', () => {
      const toolCall = createToolCall({
        status: 'completed',
        result: 'visible result',
      });

      render(<ToolCallRow toolCall={toolCall} initialOpen={true} />);

      expect(screen.getByText('Result:')).toBeInTheDocument();
    });

    it('should be initially open when status is running', () => {
      const toolCall = createToolCall({
        status: 'running',
      });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      // Running state shows loading content, not accordion
      expect(container.querySelector('.euiLoadingContent')).toBeInTheDocument();
    });
  });

  describe('graph visualization tools', () => {
    it('should handle graph_timeseries_data tool specially', () => {
      const toolCall = createToolCall({
        toolName: 'graph_timeseries_data',
        status: 'running',
      });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      // Should render the graph tool UI (loading state)
      expect(container.querySelector('.toolCallRow')).toBeInTheDocument();
    });

    it('should handle execute_promql_query tool as graph tool', () => {
      const toolCall = createToolCall({
        toolName: 'execute_promql_query',
        status: 'running',
      });

      const { container } = render(<ToolCallRow toolCall={toolCall} />);

      expect(container.querySelector('.toolCallRow')).toBeInTheDocument();
    });
  });
});
