/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EventType,
  BaseEvent,
  Message,
  ToolCall,
  RunErrorEvent,
  TextMessageContentEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallStartEvent,
} from '@ag-ui/core';
import { DataPublicPluginStart } from '../../../../../data/public';
import { PROMQL_FRONTEND_TOOLS, isPromQLMetadataTool } from './promql_tools';
import { extractQueryFromText, validateToolArgs } from './promql_utils';
import { AgUiAgent } from './agui_agent';
import { PromQLToolHandlers } from './promql_tool_handlers';

interface GeneratePromQLOptions {
  data: DataPublicPluginStart;
  question: string;
  dataSourceName: string;
  dataSourceId?: string;
}

interface GeneratePromQLResult {
  query?: string;
  error?: Error;
}

function isTextMessageContentEvent(event: BaseEvent): event is TextMessageContentEvent {
  return event.type === EventType.TEXT_MESSAGE_CONTENT;
}

function isToolCallStartEvent(event: BaseEvent): event is ToolCallStartEvent {
  return event.type === EventType.TOOL_CALL_START;
}

function isToolCallArgsEvent(event: BaseEvent): event is ToolCallArgsEvent {
  return event.type === EventType.TOOL_CALL_ARGS;
}

function isToolCallEndEvent(event: BaseEvent): event is ToolCallEndEvent {
  return event.type === EventType.TOOL_CALL_END;
}

function isRunErrorEvent(event: BaseEvent): event is RunErrorEvent {
  return event.type === EventType.RUN_ERROR;
}

const PROMQL_SYSTEM_PROMPT = `You are a PromQL expert. Your task is to convert natural language questions into valid PromQL queries.

## Instructions
1. First, use tools to discover available metrics matching the user's intent.
2. Select the most appropriate metric and construct a query using proper functions.
3. Return only one markdown code block with PromQL query inside.
4. If it requires multiple queries, use \`;\` and a new line to separate them.
5. Do not output explanations. Output 'OOD' if question is out of domain.
`;

/** Maximum number of tool calls allowed per query generation */
const MAX_TOOL_CALLS = 3;

/**
 * Generate a cache key for deduplicating tool calls
 */
function getToolCallCacheKey(toolName: string, args: Record<string, unknown>): string {
  return `${toolName}:${JSON.stringify(args, Object.keys(args).sort())}`;
}

/**
 * Generate a PromQL query using AG-UI streaming with frontend tool execution.
 * This is a standalone function for use in Redux thunks or other non-hook contexts.
 */
export async function generatePromQLWithAgUi({
  data,
  question,
  dataSourceName,
  dataSourceId,
}: GeneratePromQLOptions): Promise<GeneratePromQLResult> {
  const agent = new AgUiAgent();
  const toolHandlers = new PromQLToolHandlers(data, dataSourceName);

  let streamingText = '';
  let finalQuery: string | undefined;
  let error: Error | undefined;

  const messages: Message[] = [
    // 'system' role messages seem to be ignored by ag-ui agent
    { id: agent.generateMessageId(), role: 'user', content: PROMQL_SYSTEM_PROMPT },
    { id: agent.generateMessageId(), role: 'user', content: question },
  ];
  const currentToolCalls = new Map<string, ToolCall>();
  const toolCallArgs = new Map<string, string>();
  let toolCallCount = 0;

  /**
   * Execute a tool call and send the result back to the agent
   */
  async function executeToolAndContinue(toolCall: ToolCall, toolCallId: string): Promise<void> {
    try {
      const args = JSON.parse(toolCall.function.arguments);

      const toolName = toolCall.function.name;
      if (!isPromQLMetadataTool(toolName)) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const validationError = validateToolArgs(toolName, args);
      if (validationError) {
        throw new Error(`Invalid tool arguments: ${validationError}`);
      }

      if (toolCallCount++ > MAX_TOOL_CALLS) {
        throw new Error(
          `Exceeded maximum tool calls (${MAX_TOOL_CALLS}). Please simplify your question.`
        );
      }

      const result = await toolHandlers.executeTool(toolName, args);
      const assistantMessage: Message = {
        id: agent.generateMessageId(),
        role: 'assistant',
        toolCalls: [toolCall],
      };
      messages.push(assistantMessage);

      const observable = agent.sendToolResult(toolCallId, result, {
        messages,
        dataSourceName,
        language: 'PROMQL',
        tools: PROMQL_FRONTEND_TOOLS,
        dataSourceId,
      });

      // Add tool result to messages for subsequent requests in the conversation
      const toolResultMessage: Message = {
        id: agent.generateMessageId(),
        role: 'tool',
        content: typeof result === 'string' ? result : JSON.stringify(result),
        toolCallId,
      };
      messages.push(toolResultMessage);

      await processStream(observable);
    } catch (err) {
      error = err as Error;
    }
  }

  /**
   * Handle a single AG-UI event
   * Returns a Promise if the event triggers an async operation
   */
  function handleEvent(event: BaseEvent): Promise<void> | undefined {
    if (isTextMessageContentEvent(event)) {
      streamingText += event.delta;
      return undefined;
    }

    if (event.type === EventType.TEXT_MESSAGE_END) {
      finalQuery = extractQueryFromText(streamingText);
      return undefined;
    }

    if (isToolCallStartEvent(event)) {
      const toolCall: ToolCall = {
        id: event.toolCallId,
        type: 'function',
        function: {
          name: event.toolCallName,
          arguments: '',
        },
      };
      currentToolCalls.set(event.toolCallId, toolCall);
      toolCallArgs.set(event.toolCallId, '');
      return undefined;
    }

    if (isToolCallArgsEvent(event)) {
      const currentArgs = toolCallArgs.get(event.toolCallId) || '';
      toolCallArgs.set(event.toolCallId, currentArgs + event.delta);
      return undefined;
    }

    if (isToolCallEndEvent(event)) {
      const toolCall = currentToolCalls.get(event.toolCallId);
      const args = toolCallArgs.get(event.toolCallId);

      currentToolCalls.delete(event.toolCallId);
      toolCallArgs.delete(event.toolCallId);

      if (toolCall && args) {
        toolCall.function.arguments = args;

        if (isPromQLMetadataTool(toolCall.function.name)) {
          return executeToolAndContinue(toolCall, event.toolCallId);
        }
      }
      return undefined;
    }

    if (isRunErrorEvent(event)) {
      error = new Error(event.message || 'Unknown error');
      return undefined;
    }

    return undefined;
  }

  /**
   * Process a stream of AG-UI events
   */
  async function processStream(observable: ReturnType<typeof agent.runAgent>): Promise<void> {
    const pendingOperations: Array<Promise<void>> = [];

    return new Promise((resolve, reject) => {
      observable.subscribe({
        next: (event: BaseEvent) => {
          const operation = handleEvent(event);
          if (operation) {
            pendingOperations.push(operation);
          }
        },
        error: (err: Error) => {
          error = err;
          reject(err);
        },
        complete: async () => {
          try {
            await Promise.all(pendingOperations);
          } catch (err) {
            error = err as Error;
          }

          console.log('❗streamingText:', streamingText);
          if (!finalQuery && streamingText) {
            finalQuery = extractQueryFromText(streamingText);
          }
          resolve();
        },
      });
    });
  }

  try {
    agent.newThread();

    const observable = agent.runAgent({
      messages,
      dataSourceName,
      language: 'PROMQL',
      tools: PROMQL_FRONTEND_TOOLS,
      dataSourceId,
    });

    await processStream(observable);

    if (!finalQuery && !error) {
      error = new Error(
        'Could not generate a PromQL query from your question. Please rephrase and try again.'
      );
    }

    return { query: finalQuery, error };
  } catch (err) {
    return { error: err as Error };
  } finally {
    agent.abort();
  }
}
