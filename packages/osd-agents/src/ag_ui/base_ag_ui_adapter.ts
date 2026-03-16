/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base AG UI Adapter
 *
 * Agent-agnostic adapter that bridges any agent implementing BaseAgent interface
 * with the AG UI protocol using official AG UI types.
 * This adapter converts agent interactions into AG UI compliant events and messages.
 *
 *  *
 * ## Event Flow Pattern
 *
 * The adapter emits events following the AG UI specification with proper message
 * interruption and continuation for tool calls:
 *
 * ### Standard Response (No Tools):
 * 1. RUN_STARTED
 * 2. TEXT_MESSAGE_START (messageId: "msg-1")
 * 3. TEXT_MESSAGE_CONTENT (messageId: "msg-1", delta: "response")
 * 4. TEXT_MESSAGE_END (messageId: "msg-1")
 * 5. RUN_FINISHED
 *
 * ### Tool Execution Flow:
 * 1. RUN_STARTED
 * 2. TEXT_MESSAGE_START (messageId: "msg-1")
 * 3. TEXT_MESSAGE_CONTENT (messageId: "msg-1", delta: "I'll help...")
 * 4. TOOL_CALL_START (toolCallId: "tool-1", parentMessageId: "msg-1")
 * 5. TOOL_CALL_ARGS (toolCallId: "tool-1", delta: '{"query": "example"}')
 * 6. TOOL_CALL_END (toolCallId: "tool-1")
 * 7. TEXT_MESSAGE_END (messageId: "msg-1")  // Ends current text message
 * 8. TOOL_CALL_RESULT (toolCallId: "tool-1", content: "result")
 * 9. TEXT_MESSAGE_START (messageId: "msg-2")  // New message for continuation
 * 10. TEXT_MESSAGE_CONTENT (messageId: "msg-2", delta: "Based on...")
 * 11. TEXT_MESSAGE_END (messageId: "msg-2")
 * 12. RUN_FINISHED
 *
 * ## Key Implementation Details:
 * - TextMessageManager handles message lifecycle and ID tracking
 * - parentMessageId links tool calls to triggering text messages
 * - Message interruption occurs when first tool call starts
 * - New message IDs are generated for post-tool content
 */

import { v4 as uuidv4 } from 'uuid';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Observable } from 'rxjs';
import {
  EventType,
  BaseEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  StateDeltaEvent,
  StepStartedEvent,
  StepFinishedEvent,
  Message,
  Tool,
  RunAgentInput,
  State,
} from '@ag-ui/core';
import { BaseAgent, StreamingCallbacks } from '../agents/base_agent';
import { MCPServerConfig } from '../types/mcp_types';
import { Logger } from '../utils/logger';
import { AGUIAuditLogger } from '../utils/ag_ui_audit_logger';
import { TextMessageManager } from './managers/text_message_manager';

export interface BaseAGUIConfig {
  port?: number;
  host?: string;
  cors?: {
    origins: string[];
    credentials: boolean;
  };
  mcpConfigs?: Record<string, MCPServerConfig>;
}

export class BaseAGUIAdapter {
  private agent: BaseAgent;
  protected logger: Logger;
  private auditLogger?: AGUIAuditLogger;
  protected textMessageManager: TextMessageManager;

  // State management for AG UI events
  private stateHistory: State[] = [];
  // Accumulate state deltas during message streaming
  private pendingStateDeltas: any[] = [];
  // Tool execution tracking
  protected toolCallsPending = 0;
  protected toolCallsCompleted = 0;

  constructor(
    agent: BaseAgent,
    config: BaseAGUIConfig = {},
    logger?: Logger,
    auditLogger?: AGUIAuditLogger
  ) {
    this.agent = agent;
    this.logger = logger || new Logger();
    this.auditLogger = auditLogger;
    this.textMessageManager = new TextMessageManager(auditLogger);
  }

  async initialize(mcpConfigs: Record<string, MCPServerConfig> = {}): Promise<void> {
    const agentType = this.agent.getAgentType();
    this.logger.debug(`Initializing ${agentType} AG UI Adapter`);

    // Check for custom system prompt file path from environment variable
    let customSystemPrompt: string | undefined;
    const systemPromptPath = process.env.SYSTEM_PROMPT;
    if (systemPromptPath) {
      try {
        // Resolve relative paths relative to the project root (where package.json is)
        const resolvedPath = resolve(process.cwd(), systemPromptPath);
        if (existsSync(resolvedPath)) {
          customSystemPrompt = readFileSync(resolvedPath, 'utf-8');
          this.logger.info('Using custom system prompt from file', {
            originalPath: systemPromptPath,
            resolvedPath,
          });
        } else {
          this.logger.warn('System prompt file not found', {
            originalPath: systemPromptPath,
            resolvedPath,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Failed to load system prompt file', {
          path: systemPromptPath,
          error: errorMessage,
        });
      }
    }

    // Initialize agent with MCP configs and custom system prompt
    await this.agent.initialize(mcpConfigs, customSystemPrompt);

    this.logger.debug(`${agentType} AG UI Adapter initialized`);
  }

  /**
   * Run agent using AG UI protocol RunAgentInput with streaming content
   */
  async runAgent(input: RunAgentInput): Promise<Observable<BaseEvent>> {
    const agentType = this.agent.getAgentType();

    // Generate unique request ID for this specific request
    const requestId = `req-${uuidv4().slice(0, 8)}`;

    // Reset tool execution tracking for new request
    this.toolCallsPending = 0;
    this.toolCallsCompleted = 0;

    // Set logger context for correlation
    this.logger.setContext(input.threadId, input.runId, requestId);

    this.logger.debug(`Running ${agentType} agent with AG UI input`, {
      threadId: input.threadId,
      runId: input.runId,
      requestId,
      messageCount: input.messages.length,
      toolCount: input.tools?.length || 0,
    });

    return new Observable<BaseEvent>((observer) => {
      // Start audit logging for this request
      this.auditLogger?.startRequest(input.threadId, input.runId, requestId);

      this.processAgentRequestWithEvents(input, observer, requestId).catch((error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('Error in processAgentRequestWithEvents', {
          error: errorMessage,
          threadId: input.threadId,
          runId: input.runId,
          agentType,
        });

        // Emit error event and complete
        const errorEvent = {
          type: EventType.RUN_ERROR,
          message: errorMessage,
          code: 'AGENT_ERROR',
          timestamp: Date.now(),
        } as RunErrorEvent;

        this.emitAndAuditEvent(errorEvent, observer, input.threadId, input.runId);

        this.auditLogger?.endRequest(input.threadId, input.runId, 'error', errorMessage);

        observer.complete();
      });
    });
  }

  /**
   * Emit event to observer and audit logger
   */
  protected emitAndAuditEvent(
    event: BaseEvent,
    observer: any,
    threadId: string,
    runId: string
  ): void {
    observer.next(event);
    this.auditLogger?.logEvent(threadId, runId, event);
  }

  /**
   * Process agent request and emit events through observer
   */
  private async processAgentRequestWithEvents(
    input: RunAgentInput,
    observer: any,
    requestId: string
  ): Promise<void> {
    const agentType = this.agent.getAgentType();

    // Emit run started event
    this.emitAndAuditEvent(
      {
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
        timestamp: Date.now(),
      } as RunStartedEvent,
      observer,
      input.threadId,
      input.runId
    );

    this.stateHistory.push(input.state || {});

    try {
      // Validate that we have messages
      if (!input.messages || input.messages.length === 0) {
        throw new Error('No messages found in input');
      }

      // Start text message stream using TextMessageManager
      const messageId = this.textMessageManager.startMessage(observer, input.threadId, input.runId);

      // Run the agent with streaming integration
      // Pass the full messages array instead of extracting text
      await this.runAgentWithStreamingEvents(
        input.messages, // Pass full messages array
        messageId,
        observer,
        input.threadId,
        input.runId,
        requestId, // Pass request ID
        input // Pass the full input
      );

      // End text message stream using TextMessageManager (only if still active)
      if (this.textMessageManager.isMessageActive()) {
        this.textMessageManager.endMessage(observer, input.threadId, input.runId);
      }

      // Emit run finished event
      this.emitAndAuditEvent(
        {
          type: EventType.RUN_FINISHED,
          threadId: input.threadId,
          runId: input.runId,
          timestamp: Date.now(),
        } as RunFinishedEvent,
        observer,
        input.threadId,
        input.runId
      );

      // End audit logging for successful completion
      this.auditLogger?.endRequest(input.threadId, input.runId, 'success');

      // Complete the stream
      observer.complete();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Error running agent', {
        error: errorMessage,
        stack: errorStack,
        threadId: input.threadId,
        runId: input.runId,
      });

      // Emit run error event
      this.emitAndAuditEvent(
        {
          type: EventType.RUN_ERROR,
          message: errorMessage,
          code: 'AGENT_ERROR',
          timestamp: Date.now(),
        } as RunErrorEvent,
        observer,
        input.threadId,
        input.runId
      );

      // End audit logging for error
      this.auditLogger?.endRequest(input.threadId, input.runId, 'error', errorMessage);

      // Complete the stream
      observer.complete();
    }
  }

  /**
   * Detect and parse PPL query from text content
   */
  private detectPPLQuery(text: string): any | null {
    try {
      // Check for STATE_DELTA JSON block with PPL query
      const stateDeltaMatch = text.match(
        /\{\s*"type"\s*:\s*"STATE_DELTA"[\s\S]*?"ppl_query"[\s\S]*?\}[\s\S]*?\}/
      );
      if (stateDeltaMatch) {
        // Extract the JSON object
        const jsonStr = stateDeltaMatch[0];
        const parsed = JSON.parse(jsonStr);
        if (parsed.delta?.ppl_query) {
          this.logger.debug('PPL query detected in STATE_DELTA format', {
            query: parsed.delta.ppl_query.query,
            dataset: parsed.delta.ppl_query.dataset,
          });
          return parsed.delta.ppl_query;
        }
      }

      // Alternative: Check for PPL query in code blocks
      const pplBlockMatch = text.match(/```ppl\s*([\s\S]*?)```/i);
      if (pplBlockMatch) {
        const query = pplBlockMatch[1].trim();
        if (query) {
          this.logger.debug('PPL query detected in code block', { query });
          // Try to extract dataset from query (source=dataset pattern)
          const datasetMatch = query.match(/source\s*=\s*([^\s|]+)/);
          const dataset = datasetMatch ? datasetMatch[1] : 'unknown';

          return {
            query,
            description: 'PPL query from code block',
            dataset,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Check for inline PPL patterns
      const inlinePatterns = [
        /source\s*=\s*[^\s|]+.*?\|.*?(?:where|stats|fields|sort|head|tail)/i,
        /search\s+source\s*=\s*[^\s|]+/i,
      ];

      for (const pattern of inlinePatterns) {
        const match = text.match(pattern);
        if (match) {
          const query = match[0];
          const datasetMatch = query.match(/source\s*=\s*([^\s|]+)/);
          const dataset = datasetMatch ? datasetMatch[1] : 'unknown';

          this.logger.debug('Inline PPL query detected', { query, dataset });
          return {
            query,
            description: 'Inline PPL query',
            dataset,
            timestamp: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      this.logger.debug('Error detecting PPL query', { error: error.message });
    }

    return null;
  }

  /**
   * Run agent with streaming content emission through observer
   *
   * This method sets up the core event flow callbacks that convert agent events
   * into AG UI compliant events:
   *
   * - onTextStart/onTextDelta: Emit TEXT_MESSAGE_CONTENT events
   * - onToolUseStart: Interrupt current message, emit TOOL_CALL_START with parentMessageId
   * - onToolResult: Emit TOOL_CALL_END, then TOOL_CALL_RESULT, resume text messaging
   * - onTurnComplete: Emit any pending STATE_DELTA events
   *
   * The method ensures proper message ID tracking and event sequencing per AG UI spec.
   */
  private async runAgentWithStreamingEvents(
    messages: any[], // Changed from userMessage: string to messages array
    messageId: string,
    observer: any,
    threadId: string,
    runId: string,
    requestId: string, // Add request ID parameter
    fullInput?: RunAgentInput // Add parameter for full input
  ): Promise<void> {
    const agentType = this.agent.getAgentType();
    // Track accumulated text to detect multi-line PPL queries
    let accumulatedText = '';

    try {
      // Create callbacks to convert agent events to AG UI events
      const callbacks: StreamingCallbacks = {
        onTextStart: (text: string) => {
          accumulatedText = text; // Start accumulating text
          this.textMessageManager.emitContent(text, observer, threadId, runId);
        },
        onTextDelta: (delta: string) => {
          accumulatedText += delta; // Continue accumulating text

          // Check for PPL query in accumulated text (for multi-line queries)
          const pplQuery = this.detectPPLQuery(accumulatedText);
          if (pplQuery) {
            // Check if we already have this query in pending deltas
            const existingQuery = this.pendingStateDeltas.find(
              (d) => d.ppl_query?.query === pplQuery.query
            );

            if (!existingQuery) {
              // Add to pending state deltas
              this.pendingStateDeltas.push({
                ppl_query: pplQuery,
              });
              this.logger.debug('PPL query added to pending state deltas', {
                query: pplQuery.query,
                pendingCount: this.pendingStateDeltas.length,
              });
            }
          }

          this.textMessageManager.emitContent(delta, observer, threadId, runId);
        },
        onToolUseStart: (toolName: string, toolUseId: string, input: any) => {
          // Track tool execution count
          this.toolCallsPending++;

          // Get current message ID before interrupting (for parentMessageId)
          const parentMessageId = this.textMessageManager.getCurrentMessageId();

          // Interrupt current text message before starting tool calls
          if (this.textMessageManager.isMessageActive()) {
            this.textMessageManager.interruptForTools(observer, threadId, runId);
          }

          // Emit proper TOOL_CALL_START event with parentMessageId
          const actualToolName = toolName.split('__')[1] || toolName;

          this.emitAndAuditEvent(
            {
              type: EventType.TOOL_CALL_START,
              toolCallId: toolUseId,
              toolCallName: actualToolName,
              parentMessageId, // Add parentMessageId field as per AG UI spec
              timestamp: Date.now(),
            } as ToolCallStartEvent,
            observer,
            threadId,
            runId
          );

          // Emit tool arguments as JSON string
          this.emitAndAuditEvent(
            {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: toolUseId,
              delta: JSON.stringify(input),
              timestamp: Date.now(),
            } as ToolCallArgsEvent,
            observer,
            threadId,
            runId
          );

          // Emit TOOL_CALL_END immediately after args (tool call definition complete)
          this.emitAndAuditEvent(
            {
              type: EventType.TOOL_CALL_END,
              toolCallId: toolUseId,
              timestamp: Date.now(),
            } as ToolCallEndEvent,
            observer,
            threadId,
            runId
          );
        },
        onToolResult: (toolName: string, toolUseId: string, result: any) => {
          // Update tool completion tracking
          this.toolCallsCompleted++;
          this.toolCallsPending = Math.max(0, this.toolCallsPending - 1);

          const actualToolName = toolName.split('__')[1] || toolName;

          // 1. End current text message if still active (should not be active due to interruption)
          if (this.textMessageManager.isMessageActive()) {
            this.textMessageManager.endMessage(observer, threadId, runId);
          }

          // 2. Emit TOOL_CALL_RESULT event
          this.emitAndAuditEvent(
            {
              type: EventType.TOOL_CALL_RESULT,
              toolCallId: toolUseId,
              content: JSON.stringify(result),
              messageId: uuidv4(),
              timestamp: Date.now(),
            } as ToolCallResultEvent,
            observer,
            threadId,
            runId
          );

          // 3. Resume text message if there are more tools pending or if this is the last tool
          if (this.toolCallsPending === 0) {
            // All tools completed - start new text message for continuation
            this.textMessageManager.resumeAfterTools(observer, threadId, runId);
          }
        },
        onToolError: (toolName: string, toolUseId: string, error: string) => {
          // Emit RUN_ERROR for tool failures
          const actualToolName = toolName.split('__')[1] || toolName;

          this.emitAndAuditEvent(
            {
              type: EventType.RUN_ERROR,
              message: `Tool ${actualToolName} failed: ${error}`,
              code: 'TOOL_ERROR',
              timestamp: Date.now(),
            } as RunErrorEvent,
            observer,
            threadId,
            runId
          );

          // Also add a text message for visibility in the chat
          const errorText = `\n\n❌ Tool ${actualToolName} error: ${error}`;
          this.emitAndAuditEvent(
            {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: errorText,
              timestamp: Date.now(),
            } as TextMessageContentEvent,
            observer,
            threadId,
            runId
          );
        },
        onTurnComplete: () => {
          // Turn completed - emit any pending state deltas before message ends
          if (this.pendingStateDeltas.length > 0) {
            this.logger.debug('Emitting pending STATE_DELTA events', {
              count: this.pendingStateDeltas.length,
            });

            // Combine all pending deltas into one
            const combinedDelta: any = {};
            for (const delta of this.pendingStateDeltas) {
              Object.assign(combinedDelta, delta);
            }

            // Emit STATE_DELTA event
            this.emitAndAuditEvent(
              {
                type: EventType.STATE_DELTA,
                delta: combinedDelta,
                timestamp: Date.now(),
              } as StateDeltaEvent,
              observer,
              threadId,
              runId
            );

            // Clear pending deltas
            this.pendingStateDeltas = [];
          }
        },
        onError: (error: string) => {
          // Emit error as text content
          this.emitAndAuditEvent(
            {
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId,
              delta: `\n\nError: ${error}`,
              timestamp: Date.now(),
            } as TextMessageContentEvent,
            observer,
            threadId,
            runId
          );
        },
      };

      // Use agent's callback-based processing
      // Pass the messages array directly as the first parameter
      // Pass additional inputs if agent supports it (check parameter count)
      // Extract modelId from forwardedProps if it exists
      if (this.agent.processMessageWithCallbacks.length >= 3) {
        await this.agent.processMessageWithCallbacks(messages, callbacks, {
          state: fullInput?.state,
          context: fullInput?.context,
          tools: fullInput?.tools, // Pass client tools from AG UI
          threadId: fullInput?.threadId,
          runId: fullInput?.runId,
          requestId, // Pass request ID for logging correlation
          modelId: fullInput?.forwardedProps?.modelId, // Extract modelId from forwardedProps
        });
      } else {
        await this.agent.processMessageWithCallbacks(messages, callbacks);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error in agent streaming', {
        error: errorMessage,
        messageId,
        agentType,
      });

      // Emit error as text content
      this.emitAndAuditEvent(
        {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId,
          delta: `Error: ${errorMessage}`,
          timestamp: Date.now(),
        } as TextMessageContentEvent,
        observer,
        threadId,
        runId
      );
    }
  }

  /**
   * Get available tools in AG UI format
   */
  async getTools(): Promise<Tool[]> {
    const agentTools = this.agent.getAllTools();

    return agentTools.map((tool) => ({
      name: tool.toolSpec.name,
      description: tool.toolSpec.description,
      parameters: tool.toolSpec.inputSchema.json,
    }));
  }

  /**
   * Get current tool execution metrics
   */
  getToolMetrics(): { pending: number; completed: number } {
    return {
      pending: this.toolCallsPending,
      completed: this.toolCallsCompleted,
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.agent.cleanup();
    const agentType = this.agent.getAgentType();
    this.logger.info(`${agentType} AG UI Adapter cleanup completed`);
  }
}
