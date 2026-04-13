/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventType } from '../../common/events';
import type {
  Event as ChatEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  MessagesSnapshotEvent,
} from '../../common/events';
import type {
  Message,
  AssistantMessage,
  ToolMessage,
  ToolCall,
  SystemMessage,
} from '../../common/types';
import type { PluginTelemetryRecorder } from '../../../../core/public';
import { AssistantActionService } from '../../../context_provider/public';
import { ToolExecutor } from './tool_executor';
import { ChatService } from './chat_service';
import { ConfirmationService } from './confirmation_service';

/**
 * Configuration interface for ChatEventHandler
 */
export interface ChatEventHandlerConfig {
  assistantActionService: AssistantActionService;
  chatService: ChatService;
  confirmationService: ConfirmationService;
  telemetryRecorder?: PluginTelemetryRecorder;
  callbacks: {
    onTimelineUpdate: (updater: (prev: Message[]) => Message[]) => void;
    onStreamingStateChange: (isStreaming: boolean) => void;
    onStartResponse: (flag: boolean) => void;
    onSendToolResultStateChange?: (isSending: boolean) => void;
    getTimeline: () => Message[];
  };
}

/**
 * Handles all chat event processing logic
 * Extracts business logic from the UI component
 */
export class ChatEventHandler {
  private activeAssistantMessages = new Map<string, AssistantMessage>();
  private pendingToolCalls = new Map<string, ToolCall>();
  private lastTextMessageStartId: string | null = null;
  private toolExecutor: ToolExecutor;

  private assistantActionService: AssistantActionService;
  private chatService: ChatService;
  private telemetryRecorder?: PluginTelemetryRecorder;
  private onTimelineUpdate: (updater: (prev: Message[]) => Message[]) => void;
  private onStreamingStateChange: (isStreaming: boolean) => void;
  private onStartResponse: (flag: boolean) => void;
  private onSendToolResultStateChange?: (isSending: boolean) => void;
  private getTimeline: () => Message[];

  // Telemetry tracking
  private interactionStartTime: number | null = null;

  constructor(config: ChatEventHandlerConfig) {
    this.assistantActionService = config.assistantActionService;
    this.chatService = config.chatService;
    this.telemetryRecorder = config.telemetryRecorder;
    this.onTimelineUpdate = config.callbacks.onTimelineUpdate;
    this.onStreamingStateChange = config.callbacks.onStreamingStateChange;
    this.onStartResponse = config.callbacks.onStartResponse;
    this.onSendToolResultStateChange = config.callbacks.onSendToolResultStateChange;
    this.getTimeline = config.callbacks.getTimeline;
    this.toolExecutor = new ToolExecutor(config.assistantActionService, config.confirmationService);
  }

  /**
   * Main event handler - routes events to appropriate handlers
   */
  async handleEvent(event: ChatEvent): Promise<void> {
    switch (event.type) {
      case EventType.RUN_STARTED:
        this.handleRunStarted(event);
        break;

      case EventType.RUN_FINISHED:
        this.handleRunFinished(event);
        break;

      case EventType.TEXT_MESSAGE_START:
        this.handleTextMessageStart(event as TextMessageStartEvent);
        break;

      case EventType.TEXT_MESSAGE_CONTENT:
        this.handleTextMessageContent(event as TextMessageContentEvent);
        break;

      case EventType.TEXT_MESSAGE_END:
        this.handleTextMessageEnd(event as TextMessageEndEvent);
        break;

      case EventType.TOOL_CALL_START:
        this.handleToolCallStart(event as ToolCallStartEvent);
        break;

      case EventType.TOOL_CALL_ARGS:
        this.handleToolCallArgs(event as ToolCallArgsEvent);
        break;

      case EventType.TOOL_CALL_END:
        await this.handleToolCallEnd(event as ToolCallEndEvent);
        break;

      case EventType.TOOL_CALL_RESULT:
        this.handleToolCallResult(event as ToolCallResultEvent);
        break;

      case EventType.MESSAGES_SNAPSHOT:
        await this.handleMessagesSnapshot(event as MessagesSnapshotEvent);
        break;

      case EventType.RUN_ERROR:
        this.handleRunError(event);
        break;
    }
  }

  /**
   * Handle run started - set streaming state and start timing
   */
  private handleRunStarted(event: any): void {
    this.onStreamingStateChange(true);

    // Start timing for telemetry
    this.interactionStartTime = Date.now();
  }

  /**
   * Handle run finished - clear streaming state, cleanup, and record success telemetry
   */
  private handleRunFinished(event: any): void {
    this.onStreamingStateChange(false);
    // Clear any remaining active messages (cleanup)
    this.activeAssistantMessages.clear();
    // Reset the connection state to allow new chats
    if (this.chatService && (this.chatService as any).resetConnection) {
      (this.chatService as any).resetConnection();
    }

    // Record success telemetry
    if (this.telemetryRecorder) {
      // Record successful interaction event
      this.telemetryRecorder.recordEvent({
        name: 'chat_interaction_success',
        data: {
          threadId: event.threadId,
          runId: event.runId,
        },
      });

      // Record duration metric if we have a start time
      if (this.interactionStartTime !== null) {
        const duration = Date.now() - this.interactionStartTime;
        this.telemetryRecorder.recordMetric({
          name: 'chat_interaction_duration_ms',
          value: duration,
          unit: 'ms',
          labels: {
            status: 'success',
          },
        });
        this.interactionStartTime = null;
      }
    }
  }

  /**
   * Handle start of a text message
   */
  private handleTextMessageStart(event: TextMessageStartEvent): void {
    this.onStartResponse(true);
    // Track this as the last TEXT_MESSAGE_START for tool call association
    this.lastTextMessageStartId = event.messageId;

    // Create new message
    const newMessage: AssistantMessage = {
      id: event.messageId,
      role: 'assistant',
      toolCalls: [],
    };

    // Track this message
    this.activeAssistantMessages.set(event.messageId, newMessage);

    // Add to timeline immediately so it appears in UI
    this.onTimelineUpdate((prev) => [...prev, newMessage]);
  }

  /**
   * Handle streaming text content
   */
  private handleTextMessageContent(event: TextMessageContentEvent): void {
    if ('delta' in event && event.delta) {
      const messageId = event.messageId;
      const assistantMessage = this.activeAssistantMessages.get(messageId);

      if (assistantMessage) {
        // Append content to this specific message
        assistantMessage.content = (assistantMessage.content || '') + event.delta;

        // Update the timeline with the updated message
        this.onTimelineUpdate((prev) => {
          const index = prev.findIndex((m) => m.id === messageId);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = { ...assistantMessage };
            return updated;
          }
          return prev;
        });
      }
    }
  }

  /**
   * Handle end of text message
   */
  private handleTextMessageEnd(event: TextMessageEndEvent): void {
    const messageId = event.messageId;

    // Get message from active tracking
    const assistantMessage = this.activeAssistantMessages.get(messageId);
    if (!assistantMessage) {
      return; // Already processed or doesn't exist
    }

    // Finalize the message - remove empty content property
    if (!assistantMessage.content?.trim()) {
      delete assistantMessage.content;
    }

    // Remove empty toolCalls array
    if (assistantMessage.toolCalls?.length === 0) {
      delete assistantMessage.toolCalls;
    }

    // @ts-expect-error TS2339 TODO(ts-error): fixme
    this._lastAssistantMessageId = assistantMessage.id;

    // Final update in timeline
    this.onTimelineUpdate((prev) => {
      const index = prev.findIndex((m) => m.id === assistantMessage.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...assistantMessage };
        return updated;
      }
      return [...prev, assistantMessage];
    });

    // Remove from active tracking
    this.activeAssistantMessages.delete(messageId);
  }

  /**
   * Handle start of a tool call
   *
   * This method determines the correct position in the timeline to place tool calls:
   * 1. If parentMessageId is provided, attach to that specific message
   * 2. Otherwise, use a selection strategy to determine placement:
   *    - If the last assistant text message appears after the last user message,
   *      attach the tool call to that assistant message
   *    - If not (e.g., user sent a new message after assistant's response),
   *      create a new fake assistant message to hold the tool calls
   *
   * This ensures tool calls are always associated with the correct assistant response
   * in the conversation timeline, maintaining proper message ordering.
   */
  private handleToolCallStart(event: ToolCallStartEvent): void {
    this.onStartResponse(true);
    const { toolCallId, toolCallName, parentMessageId } = event;

    // Update tool call state in AssistantActionService
    this.assistantActionService.updateToolCallState(toolCallId, {
      id: toolCallId,
      name: toolCallName,
      status: 'pending',
      timestamp: Date.now(),
    });

    // Create tool call structure for AG-UI
    const toolCall: ToolCall = {
      id: toolCallId,
      type: 'function',
      function: {
        name: toolCallName,
        arguments: '', // Will be populated by TOOL_CALL_ARGS
      },
    };

    // Add to pending map for args accumulation
    this.pendingToolCalls.set(toolCallId, toolCall);

    // Strategy 1: Use explicitly provided parent message ID
    // This is the most reliable approach when the backend provides it
    if (parentMessageId) {
      this.addToolCallToMessage(parentMessageId, toolCall);
      return;
    }

    // Strategy 2: Determine placement based on message timeline positions
    // Check if the last assistant message is still the most recent response
    const timelineMessages = this.getTimeline();
    if (this.lastTextMessageStartId) {
      const lastAssistantTextMessageIndex = timelineMessages.findLastIndex(
        (message) => message.id === this.lastTextMessageStartId
      );
      const lastUserMessageIndex = timelineMessages.findLastIndex(
        (message) => message.role === 'user'
      );

      // If the last assistant message appears after the last user message,
      // it means this tool call belongs to the current conversation turn
      if (lastAssistantTextMessageIndex > lastUserMessageIndex) {
        this.addToolCallToMessage(this.lastTextMessageStartId, toolCall);
        return;
      }
    }

    // Strategy 3: Create a new assistant message placeholder
    // This handles the case where the LLM responds with tool calls but without any text message.
    // Since there's no TEXT_MESSAGE_START event, we need to create a fake assistant message
    // to hold the tool calls so they appear in the correct position in the timeline.
    const fakeAssistantMessageId = `fake-assistant-message-` + new Date().getTime();
    this.onTimelineUpdate((prev) => {
      const newMessage: AssistantMessage = {
        id: fakeAssistantMessageId,
        role: 'assistant',
        toolCalls: [toolCall],
      };
      return [...prev, newMessage];
    });
    this.lastTextMessageStartId = fakeAssistantMessageId;
  }

  /**
   * Handle tool call arguments streaming
   */
  private handleToolCallArgs(event: ToolCallArgsEvent): void {
    const { toolCallId, delta } = event;
    const toolCall = this.pendingToolCalls.get(toolCallId);

    if (toolCall && delta) {
      toolCall.function.arguments += delta;

      // Update whichever message contains this tool call
      this.updateToolCallInMessage(toolCallId, toolCall);
    }
  }

  /**
   * Handle end of tool call - execute the tool
   */
  private async handleToolCallEnd(event: ToolCallEndEvent): Promise<void> {
    const { toolCallId } = event;
    const toolCall = this.pendingToolCalls.get(toolCallId);

    if (!toolCall) {
      // eslint-disable-next-line no-console
      console.warn(`Tool call not found: ${toolCallId}`);
      return;
    }

    try {
      const isAgentTool = !this.assistantActionService.hasAction(toolCall.function.name);
      // Parse arguments
      const args =
        toolCall.function.arguments && !isAgentTool ? JSON.parse(toolCall.function.arguments) : {};

      // Update state to executing
      this.assistantActionService.updateToolCallState(toolCallId, {
        status: 'executing',
        args,
      });

      // Execute the tool and update tool execution status
      const result = await this.toolExecutor.executeTool(
        toolCall.function.name,
        args,
        toolCallId,
        await this.chatService?.getCurrentDataSourceId()
      );

      // Check if tool execution was cancelled (e.g., due to cleanup)
      if (result.cancelled) {
        this.pendingToolCalls.delete(toolCallId);
        return;
      }

      if (result.userRejected) {
        // User rejected the tool execution
        this.assistantActionService.updateToolCallState(toolCallId, {
          status: 'failed',
        });

        // Send rejection message back to assistant
        if (this.chatService && (this.chatService as any).sendToolResult) {
          await this.sendToolResultToAssistant(toolCallId, result);
        }

        // Clean up pending tool call
        this.pendingToolCalls.delete(toolCallId);
        return;
      }

      if (result.waitingForAgentResponse) {
        // Agent will handle this tool and send results back via events
        this.toolExecutor.markToolPending(toolCallId, {
          id: toolCallId,
          name: toolCall.function.name,
          args: toolCall.function.arguments,
        });
        // Don't send result back immediately, wait for TOOL_CALL_RESULT event
      } else {
        // Tool was executed locally

        this.assistantActionService.updateToolCallState(toolCallId, {
          status: 'complete',
          result: result.data,
        });

        // Send tool result back to assistant if chatService is available
        if (this.chatService && (this.chatService as any).sendToolResult) {
          await this.sendToolResultToAssistant(toolCallId, result.data);
        }
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error(`Error executing tool ${toolCall.function.name}:`, error);

      // Update state to failed
      this.assistantActionService.updateToolCallState(toolCallId, {
        status: 'failed',
        error: error.message,
      });

      // Add error tool result message to timeline
      const errorToolMessage: ToolMessage = {
        id: `tool-error-${toolCallId}`,
        role: 'tool',
        content: error.message,
        toolCallId,
        error: error.message,
      };

      this.onTimelineUpdate((prev) => [...prev, errorToolMessage]);

      // Send error back to assistant
      if (this.chatService && (this.chatService as any).sendToolResult) {
        await this.sendToolResultToAssistant(toolCallId, { error: error.message });
      }
    } finally {
      // Clean up pending tool call
      this.pendingToolCalls.delete(toolCallId);
    }
  }

  /**
   * Handle tool result from agent-only tools
   */
  private handleToolCallResult(event: ToolCallResultEvent): void {
    const { toolCallId, content } = event;

    let resultContent = content;
    // Try to parse the content if it's JSON stringified
    try {
      const parsed = JSON.parse(content);
      if (parsed.content && Array.isArray(parsed.content)) {
        // Extract text from content array
        resultContent = parsed.content
          .filter((contentItem: any) => contentItem.type === 'text')
          .map((contentItem: any) => contentItem.text)
          .join('\n');
      }
    } catch {
      // If parsing fails, use the raw content
      resultContent = content;
    }

    // Add tool result message to timeline
    const toolMessage: ToolMessage = {
      id: `tool-result-${toolCallId}`,
      role: 'tool',
      content: resultContent,
      toolCallId,
    };

    this.onTimelineUpdate((prev) => [...prev, toolMessage]);

    // Clear pending tool if it was an agent-only tool
    if (this.toolExecutor.isPendingAgentResponse(toolCallId)) {
      this.toolExecutor.clearPendingTool(toolCallId);
    }
  }

  /**
   * Handle run errors and record failure telemetry
   */
  private handleRunError(event: any): void {
    const errorMessage: SystemMessage = {
      id: `error-${Date.now()}`,
      role: 'system',
      content: `Error: ${event.message || 'An error occurred'}`,
    };

    this.onTimelineUpdate((prev) => [...prev, errorMessage]);
    this.onStreamingStateChange(false);

    // Record failure telemetry
    if (this.telemetryRecorder) {
      const eventMessage = event.message || 'An error occurred';

      // Record failed interaction event
      this.telemetryRecorder.recordEvent({
        name: 'chat_interaction_failure',
        data: {
          errorMessage: eventMessage,
          errorCode: event.code,
        },
      });

      // Record error
      this.telemetryRecorder.recordError({
        type: 'ChatInteractionError',
        message: eventMessage,
        context: {
          errorCode: event.code,
        },
      });

      // Record duration metric if we have a start time (with failure status)
      if (this.interactionStartTime !== null) {
        const duration = Date.now() - this.interactionStartTime;
        this.telemetryRecorder.recordMetric({
          name: 'chat_interaction_duration_ms',
          value: duration,
          unit: 'ms',
          labels: {
            status: 'failure',
          },
        });
        this.interactionStartTime = null;
      }
    }
  }

  /**
   * Add tool call to a specific message in timeline
   */
  private addToolCallToMessage(messageId: string, toolCall: ToolCall): void {
    // Check if message is in active messages
    const activeMessage = this.activeAssistantMessages.get(messageId);
    if (activeMessage) {
      activeMessage.toolCalls = activeMessage.toolCalls || [];
      activeMessage.toolCalls.push(toolCall);

      // Update timeline
      this.onTimelineUpdate((prev) => {
        const index = prev.findIndex((m) => m.id === messageId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...activeMessage };
          return updated;
        }
        return prev;
      });
      return;
    }

    // Otherwise find in timeline and update
    this.onTimelineUpdate((prev) => {
      const updated = [...prev];
      const messageIndex = updated.findIndex((m) => m.id === messageId);

      if (messageIndex >= 0) {
        const message = updated[messageIndex];
        if (message.role === 'assistant') {
          const assistantMsg = message as AssistantMessage;
          assistantMsg.toolCalls = assistantMsg.toolCalls || [];
          assistantMsg.toolCalls.push(toolCall);
          updated[messageIndex] = { ...assistantMsg };
        }
      }

      return updated;
    });
  }

  /**
   * Update tool call in whichever message contains it
   */
  private updateToolCallInMessage(toolCallId: string, updatedToolCall: ToolCall): void {
    // First check active messages
    for (const [messageId, activeMessage] of this.activeAssistantMessages) {
      if (activeMessage.toolCalls) {
        const toolCallIndex = activeMessage.toolCalls.findIndex((tc) => tc.id === toolCallId);
        if (toolCallIndex >= 0) {
          activeMessage.toolCalls[toolCallIndex] = updatedToolCall;

          // Update timeline
          this.onTimelineUpdate((prev) => {
            const index = prev.findIndex((m) => m.id === messageId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...activeMessage };
              return updated;
            }
            return prev;
          });
          return;
        }
      }
    }

    // Otherwise, find and update the tool call in timeline
    this.onTimelineUpdate((prev) => {
      const updated = [...prev];

      for (let i = 0; i < updated.length; i++) {
        const message = updated[i];
        if (message.role === 'assistant') {
          const assistantMsg = message as AssistantMessage;
          if (assistantMsg.toolCalls) {
            const toolCallIndex = assistantMsg.toolCalls.findIndex((tc) => tc.id === toolCallId);
            if (toolCallIndex >= 0) {
              assistantMsg.toolCalls[toolCallIndex] = updatedToolCall;
              updated[i] = { ...assistantMsg };
              break;
            }
          }
        }
      }

      return updated;
    });
  }

  /**
   * Send tool result back to assistant
   */
  private async sendToolResultToAssistant(toolCallId: string, result: any): Promise<void> {
    try {
      // Notify that we're starting to send tool result
      this.onSendToolResultStateChange?.(true);

      const messages = this.getTimeline();

      const { observable, toolMessage } = await this.chatService.sendToolResult(
        toolCallId,
        result,
        messages
      );

      // Notify that sending tool result is complete
      this.onSendToolResultStateChange?.(false);

      this.onTimelineUpdate((prev) => [...prev, toolMessage]);

      // Set streaming state and subscribe to the response stream
      this.onStreamingStateChange(true);

      observable.subscribe({
        next: (event: ChatEvent) => {
          // Handle the assistant's response to the tool result
          this.handleEvent(event);
        },
        error: (error: any) => {
          // eslint-disable-next-line no-console
          console.error('Tool result response error:', error);
          this.onStreamingStateChange(false);
          this.onStartResponse(false);
        },
        complete: () => {
          this.onStreamingStateChange(false);
          this.onStartResponse(false);
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send tool result:', error);
      this.onSendToolResultStateChange?.(false);
      this.onStreamingStateChange(false);
    }
  }

  // timelineToMessages method removed - timeline is now directly AG-UI compatible

  /**
   * Handle messages snapshot - restore conversation state from saved messages
   * Simply sets the timeline to the saved messages
   */
  private async handleMessagesSnapshot(event: MessagesSnapshotEvent): Promise<void> {
    // Set timeline to snapshot messages
    this.onTimelineUpdate(() => event.messages || []);

    // Reset streaming state
    this.onStreamingStateChange(false);
  }

  /**
   * Clear all state (useful for resetting)
   */
  clearState(): void {
    this.activeAssistantMessages.clear();
    this.pendingToolCalls.clear();
    this.toolExecutor.clearAllPendingTools();
    this.lastTextMessageStartId = null;
    // @ts-expect-error TS2339 TODO(ts-error): fixme
    this._lastAssistantMessageId = null;
  }
}
