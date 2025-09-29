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
} from '../../common/events';
import type { Message, AssistantMessage, ToolMessage, ToolCall } from '../../common/types';
import { AssistantActionService } from '../../../context_provider/public';
import { ToolExecutor } from './tool_executor';
import { ChatService } from './chat_service';

// Error type for timeline (since AG-UI doesn't have error messages)
interface TimelineError {
  type: 'error';
  id: string;
  message: string;
  timestamp: number;
}

// Timeline is now primarily AG-UI Messages
type TimelineItem = Message | TimelineError;

interface PendingToolCall {
  id: string;
  name: string;
  args: string;
  messageId?: string;
}

/**
 * Handles all chat event processing logic
 * Extracts business logic from the UI component
 */
export class ChatEventHandler {
  private processedEventIds = new Set<string>();
  private processedMessageEnds = new Set<string>();
  private pendingToolCalls = new Map<string, ToolCall>();
  private currentStreamingMessage = '';
  private currentAssistantMessage: AssistantMessage | null = null;
  private lastAssistantMessageId: string | null = null;
  private toolExecutor: ToolExecutor;

  constructor(
    private assistantActionService: AssistantActionService,
    private chatService: ChatService | null,
    private onTimelineUpdate: (updater: (prev: Message[]) => Message[]) => void,
    private onStreamingMessageUpdate: (message: string) => void,
    private onStreamingStateChange: (isStreaming: boolean) => void,
    private getTimeline: () => Message[]
  ) {
    this.toolExecutor = new ToolExecutor(assistantActionService);
  }

  /**
   * Main event handler - routes events to appropriate handlers
   */
  async handleEvent(event: ChatEvent): Promise<void> {
    switch (event.type) {
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

      // Add other event types as needed
      case EventType.RUN_ERROR:
        this.handleRunError(event);
        break;
    }
  }

  /**
   * Handle start of a text message
   */
  private handleTextMessageStart(event: TextMessageStartEvent): void {
    // Reset streaming message
    this.currentStreamingMessage = '';
    this.onStreamingMessageUpdate('');
    this.onStreamingStateChange(true);

    // Initialize new assistant message for tracking tool calls
    this.currentAssistantMessage = {
      id: event.messageId,
      role: 'assistant',
      content: '', // Will be populated by TEXT_MESSAGE_CONTENT
      toolCalls: [], // Will be populated by TOOL_CALL events
    };
  }

  /**
   * Handle streaming text content
   */
  private handleTextMessageContent(event: TextMessageContentEvent): void {
    if ('delta' in event && event.delta) {
      this.currentStreamingMessage += event.delta;
      this.onStreamingMessageUpdate(this.currentStreamingMessage);
    }
  }

  /**
   * Handle end of text message
   */
  private handleTextMessageEnd(event: TextMessageEndEvent): void {
    // Skip if we've already processed this message end event
    const messageId = event.messageId;
    if (messageId && this.processedMessageEnds.has(messageId)) {
      return;
    }
    if (messageId) {
      this.processedMessageEnds.add(messageId);
    }

    // Finalize and add the complete assistant message with all tool calls
    if (this.currentAssistantMessage) {
      // Set final content (only if there's actual content)
      if (this.currentStreamingMessage.trim()) {
        this.currentAssistantMessage.content = this.currentStreamingMessage;
      }

      // Remove empty toolCalls array if no tools were called
      if (this.currentAssistantMessage.toolCalls?.length === 0) {
        delete this.currentAssistantMessage.toolCalls;
      }

      // Store this as the last assistant message for tool call association
      this.lastAssistantMessageId = this.currentAssistantMessage.id;

      // Add or update in timeline
      this.onTimelineUpdate((prev) => {
        // Check if already exists (from tool call updates)
        const existingIndex = prev.findIndex((m) => m.id === this.currentAssistantMessage!.id);
        if (existingIndex >= 0) {
          // Update existing
          const updated = [...prev];
          updated[existingIndex] = this.currentAssistantMessage!;
          return updated;
        } else {
          // Add new
          return [...prev, this.currentAssistantMessage!];
        }
      });

      this.currentAssistantMessage = null;
    }

    // Clear streaming state
    this.currentStreamingMessage = '';
    this.onStreamingMessageUpdate('');
    this.onStreamingStateChange(false);
  }

  /**
   * Handle start of a tool call
   */
  private handleToolCallStart(event: ToolCallStartEvent): void {
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

    // Determine which message to associate this tool call with
    let targetMessageId: string | null = null;

    if (parentMessageId) {
      // Use the specified parent message
      targetMessageId = parentMessageId;
    } else if (this.currentAssistantMessage) {
      // Use the current streaming message
      targetMessageId = this.currentAssistantMessage.id;
    } else if (this.lastAssistantMessageId) {
      // Fall back to the last assistant message
      targetMessageId = this.lastAssistantMessageId;
    }

    if (targetMessageId) {
      this.addToolCallToMessage(targetMessageId, toolCall);
    }
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
      // Parse arguments
      const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};

      // Update state to executing
      this.assistantActionService.updateToolCallState(toolCallId, {
        status: 'executing',
        args,
      });

      // Execute the tool
      const result = await this.toolExecutor.executeTool(toolCall.function.name, args);

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

        // Add tool result message to timeline
        const toolMessage: ToolMessage = {
          id: `tool-result-${toolCallId}`,
          role: 'tool',
          content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
          toolCallId,
        };

        this.onTimelineUpdate((prev) => [...prev, toolMessage]);

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
   * Handle run errors
   */
  private handleRunError(event: any): void {
    const errorItem: TimelineError = {
      type: 'error',
      id: `error-${Date.now()}`,
      message: event.message || 'An error occurred',
      timestamp: event.timestamp || Date.now(),
    };

    this.onTimelineUpdate((prev) => [...prev, errorItem]);
    this.onStreamingStateChange(false);
  }

  /**
   * Update assistant message in timeline (for real-time tool call updates)
   */
  private updateAssistantMessageInTimeline(): void {
    if (!this.currentAssistantMessage) return;

    this.onTimelineUpdate((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === this.currentAssistantMessage!.id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = { ...this.currentAssistantMessage! };
        return updated;
      } else {
        // Add new (shouldn't happen but safe fallback)
        return [...prev, { ...this.currentAssistantMessage! }];
      }
    });
  }

  /**
   * Add tool call to a specific message in timeline
   */
  private addToolCallToMessage(messageId: string, toolCall: ToolCall): void {
    // If it's the current streaming message, update it directly
    if (this.currentAssistantMessage && this.currentAssistantMessage.id === messageId) {
      this.currentAssistantMessage.toolCalls = this.currentAssistantMessage.toolCalls || [];
      this.currentAssistantMessage.toolCalls.push(toolCall);
      this.updateAssistantMessageInTimeline();
      return;
    }

    // Otherwise, find and update the message in timeline
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
    // If it's in the current streaming message, update it directly
    if (this.currentAssistantMessage && this.currentAssistantMessage.toolCalls) {
      const toolCallIndex = this.currentAssistantMessage.toolCalls.findIndex(
        (tc) => tc.id === toolCallId
      );
      if (toolCallIndex >= 0) {
        this.currentAssistantMessage.toolCalls[toolCallIndex] = updatedToolCall;
        this.updateAssistantMessageInTimeline();
        return;
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
      const messages = this.getTimeline(); // Now pass timeline directly - no transformation needed
      const { observable } = await (this.chatService as any).sendToolResult(
        toolCallId,
        result,
        messages
      );

      // Set streaming state and subscribe to the response stream
      this.onStreamingStateChange(true);

      const subscription = observable.subscribe({
        next: (event: ChatEvent) => {
          // Handle the assistant's response to the tool result
          this.handleEvent(event);
        },
        error: (error: any) => {
          // eslint-disable-next-line no-console
          console.error('Tool result response error:', error);
          this.onStreamingStateChange(false);
        },
        complete: () => {
          this.onStreamingStateChange(false);
        },
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to send tool result:', error);
      this.onStreamingStateChange(false);
    }
  }

  // timelineToMessages method removed - timeline is now directly AG-UI compatible

  /**
   * Clear all state (useful for resetting)
   */
  clearState(): void {
    this.processedEventIds.clear();
    this.processedMessageEnds.clear();
    this.pendingToolCalls.clear();
    this.toolExecutor.clearAllPendingTools();
    this.currentStreamingMessage = '';
    this.currentAssistantMessage = null;
    this.onStreamingMessageUpdate('');
  }
}
