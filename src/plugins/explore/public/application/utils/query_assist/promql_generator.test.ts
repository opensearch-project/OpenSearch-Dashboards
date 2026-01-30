/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject } from 'rxjs';
import { EventType, BaseEvent } from '@ag-ui/core';

// Mock AgUiAgent
const mockRunAgent = jest.fn();
const mockSendToolResult = jest.fn();
const mockNewThread = jest.fn();
const mockAbort = jest.fn();
const mockGenerateMessageId = jest.fn(() => `msg-${Date.now()}`);

jest.mock('./agui_agent', () => ({
  AgUiAgent: jest.fn().mockImplementation(() => ({
    runAgent: mockRunAgent,
    sendToolResult: mockSendToolResult,
    newThread: mockNewThread,
    abort: mockAbort,
    generateMessageId: mockGenerateMessageId,
  })),
}));

// Mock PromQLToolHandlers
const mockExecuteTool = jest.fn();
jest.mock('./promql_tool_handlers', () => ({
  PromQLToolHandlers: jest.fn().mockImplementation(() => ({
    executeTool: mockExecuteTool,
  })),
}));

// Mock promql_tools
jest.mock('./promql_tools', () => ({
  PROMQL_FRONTEND_TOOLS: [],
  isPromQLMetadataTool: jest.fn((name: string) => name === 'search_metrics'),
}));

// Mock promql_utils
jest.mock('./promql_utils', () => ({
  extractQueryFromText: jest.fn((text: string) => {
    const match = text.match(/```(?:promql)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : undefined;
  }),
  validateToolArgs: jest.fn(() => null),
}));

import { generatePromQLWithAgUi } from './promql_generator';
import { isPromQLMetadataTool } from './promql_tools';
import { validateToolArgs } from './promql_utils';

const mockIsPromQLMetadataTool = isPromQLMetadataTool as jest.MockedFunction<
  typeof isPromQLMetadataTool
>;
const mockValidateToolArgs = validateToolArgs as jest.MockedFunction<typeof validateToolArgs>;

describe('generatePromQLWithAgUi', () => {
  let mockData: any;
  let streamSubject: Subject<BaseEvent>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockData = {
      search: jest.fn(),
    };

    streamSubject = new Subject<BaseEvent>();
    mockRunAgent.mockReturnValue(streamSubject);
  });

  const defaultOptions = {
    data: mockData,
    question: 'Show CPU usage',
    dataSourceName: 'prometheus-ds',
    dataSourceId: 'ds-123',
    dataSourceMeta: { prometheusUrl: 'http://localhost:9090' },
  };

  describe('successful query generation', () => {
    it('should return query when agent responds with valid PromQL', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      // Emit text message events with a PromQL query
      streamSubject.next({ type: EventType.TEXT_MESSAGE_START } as BaseEvent);
      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nrate(cpu_usage[5m])\n```',
      } as BaseEvent);
      streamSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      streamSubject.complete();

      const result = await resultPromise;

      expect(result.query).toBe('rate(cpu_usage[5m])');
      expect(mockNewThread).toHaveBeenCalled();
      expect(mockAbort).toHaveBeenCalled();
    });

    it('should extract query from streaming text on completion if not already set', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      // Emit content without TEXT_MESSAGE_END
      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nup\n```',
      } as BaseEvent);
      streamSubject.complete();

      const result = await resultPromise;

      expect(result.query).toBe('up');
    });
  });

  describe('error handling', () => {
    it('should throw error when no query is generated', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      // Complete without sending any query content
      streamSubject.next({ type: EventType.TEXT_MESSAGE_START } as BaseEvent);
      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: 'I cannot help with that.',
      } as BaseEvent);
      streamSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      streamSubject.complete();

      await expect(resultPromise).rejects.toThrow(
        'Could not generate a PromQL query from your question. Please rephrase and try again.'
      );
      expect(mockAbort).toHaveBeenCalled();
    });

    it('should throw error when RUN_ERROR event is received', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.next({
        type: EventType.RUN_ERROR,
        message: 'Agent failed to process request',
      } as BaseEvent);
      streamSubject.complete();

      await expect(resultPromise).rejects.toThrow('Agent failed to process request');
      expect(mockAbort).toHaveBeenCalled();
    });

    it('should throw error with default message when RUN_ERROR has no message', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.next({
        type: EventType.RUN_ERROR,
        message: '',
      } as BaseEvent);
      streamSubject.complete();

      await expect(resultPromise).rejects.toThrow('Unknown error');
    });

    it('should throw error when stream errors', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.error(new Error('Network error'));

      await expect(resultPromise).rejects.toThrow('Network error');
      expect(mockAbort).toHaveBeenCalled();
    });
  });

  describe('tool call handling', () => {
    it('should execute tool calls and continue conversation', async () => {
      const toolResultSubject = new Subject<BaseEvent>();
      mockSendToolResult.mockReturnValue(toolResultSubject);
      mockExecuteTool.mockResolvedValue(['metric1', 'metric2']);

      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      // Simulate tool call sequence
      streamSubject.next({
        type: EventType.TOOL_CALL_START,
        toolCallId: 'tc-1',
        toolCallName: 'search_metrics',
      } as BaseEvent);
      streamSubject.next({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: 'tc-1',
        delta: '{"query": "cpu"}',
      } as BaseEvent);
      streamSubject.next({
        type: EventType.TOOL_CALL_END,
        toolCallId: 'tc-1',
      } as BaseEvent);
      streamSubject.complete();

      // Wait for tool execution to start
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Complete the tool result stream with a query
      toolResultSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nrate(cpu_usage[5m])\n```',
      } as BaseEvent);
      toolResultSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      toolResultSubject.complete();

      const result = await resultPromise;

      expect(mockExecuteTool).toHaveBeenCalledWith('search_metrics', { query: 'cpu' });
      expect(mockSendToolResult).toHaveBeenCalled();
      expect(result.query).toBe('rate(cpu_usage[5m])');
    });

    it('should skip tool call with unknown tool name', async () => {
      mockIsPromQLMetadataTool.mockReturnValueOnce(false);

      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.next({
        type: EventType.TOOL_CALL_START,
        toolCallId: 'tc-1',
        toolCallName: 'unknown_tool',
      } as BaseEvent);
      streamSubject.next({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: 'tc-1',
        delta: '{}',
      } as BaseEvent);
      streamSubject.next({
        type: EventType.TOOL_CALL_END,
        toolCallId: 'tc-1',
      } as BaseEvent);
      // Provide a valid query so the function completes successfully
      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nup\n```',
      } as BaseEvent);
      streamSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      streamSubject.complete();

      const result = await resultPromise;

      // Unknown tool should be skipped, not executed
      expect(mockExecuteTool).not.toHaveBeenCalled();
      expect(result.query).toBe('up');
    });

    it('should handle invalid tool arguments', async () => {
      mockValidateToolArgs.mockReturnValueOnce('Missing required field: query');

      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.next({
        type: EventType.TOOL_CALL_START,
        toolCallId: 'tc-1',
        toolCallName: 'search_metrics',
      } as BaseEvent);
      streamSubject.next({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId: 'tc-1',
        delta: '{}',
      } as BaseEvent);
      streamSubject.next({
        type: EventType.TOOL_CALL_END,
        toolCallId: 'tc-1',
      } as BaseEvent);
      streamSubject.complete();

      await expect(resultPromise).rejects.toThrow(
        'Invalid tool arguments: Missing required field: query'
      );
    });

    it('should not execute tool call when toolCall or args are missing', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      // Start a tool call but don't provide args
      streamSubject.next({
        type: EventType.TOOL_CALL_START,
        toolCallId: 'tc-1',
        toolCallName: 'search_metrics',
      } as BaseEvent);
      // End without providing args (empty string)
      streamSubject.next({
        type: EventType.TOOL_CALL_END,
        toolCallId: 'tc-1',
      } as BaseEvent);

      // Also provide a valid query response
      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nup\n```',
      } as BaseEvent);
      streamSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      streamSubject.complete();

      const result = await resultPromise;

      expect(mockExecuteTool).not.toHaveBeenCalled();
      expect(result.query).toBe('up');
    });
  });

  describe('agent lifecycle', () => {
    it('should call newThread before running agent', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nup\n```',
      } as BaseEvent);
      streamSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      streamSubject.complete();

      await resultPromise;

      expect(mockNewThread).toHaveBeenCalledTimes(1);
      expect(mockRunAgent).toHaveBeenCalledTimes(1);
    });

    it('should always call abort in finally block', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.error(new Error('Test error'));

      await expect(resultPromise).rejects.toThrow('Test error');
      expect(mockAbort).toHaveBeenCalledTimes(1);
    });

    it('should pass correct parameters to runAgent', async () => {
      const resultPromise = generatePromQLWithAgUi(defaultOptions);

      streamSubject.next({
        type: EventType.TEXT_MESSAGE_CONTENT,
        delta: '```promql\nup\n```',
      } as BaseEvent);
      streamSubject.next({ type: EventType.TEXT_MESSAGE_END } as BaseEvent);
      streamSubject.complete();

      await resultPromise;

      expect(mockRunAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          dataSourceName: 'prometheus-ds',
          language: 'PROMQL',
          dataSourceId: 'ds-123',
        })
      );
    });
  });
});
