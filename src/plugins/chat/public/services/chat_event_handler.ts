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
import { AssistantActionService } from '../../../context_provider/public';
import { ToolExecutor } from './tool_executor';
import { ChatService } from './chat_service';

// Timeline types (matching existing types in chat_window.tsx)
interface TimelineMessage {
  type: 'message';
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
}

interface TimelineToolCall {
  type: 'tool_call';
  id: string;
  toolName: string;
  status: 'running' | 'completed' | 'error';
  result?: string;
  timestamp: number;
}

interface TimelineError {
  type: 'error';
  id: string;
  message: string;
  timestamp: number;
}

type TimelineItem = TimelineMessage | TimelineToolCall | TimelineError;

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
  private pendingToolCalls = new Map<string, PendingToolCall>();
  private currentStreamingMessage = '';
  private toolExecutor: ToolExecutor;

  constructor(
    private assistantActionService: AssistantActionService,
    private chatService: ChatService | null,
    private onTimelineUpdate: (updater: (prev: TimelineItem[]) => TimelineItem[]) => void,
    private onStreamingMessageUpdate: (message: string) => void,
    private onStreamingStateChange: (isStreaming: boolean) => void,
    private getTimeline: () => TimelineItem[]
  ) {
    this.toolExecutor = new ToolExecutor(assistantActionService);
  }

  /**
   * Main event handler - routes events to appropriate handlers
   */
  async handleEvent(event: ChatEvent): Promise<void> {
    // Prevent duplicate processing for events with IDs
    if ('messageId' in event && event.messageId) {
      if (this.processedEventIds.has(event.messageId)) return;
      this.processedEventIds.add(event.messageId);
    }

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

    // Only add assistant message if there's actual content
    if (this.currentStreamingMessage.trim()) {
      const assistantMessage: TimelineMessage = {
        type: 'message',
        id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: this.currentStreamingMessage,
        timestamp: event.timestamp || Date.now(),
      };

      this.onTimelineUpdate((prev) => [...prev, assistantMessage]);
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

    // Track pending tool call
    this.pendingToolCalls.set(toolCallId, {
      id: toolCallId,
      name: toolCallName,
      args: '',
      messageId: parentMessageId,
    });

    // Add tool call to timeline
    const toolCallItem: TimelineToolCall = {
      type: 'tool_call',
      id: toolCallId,
      toolName: toolCallName,
      status: 'running',
      timestamp: event.timestamp || Date.now(),
    };

    this.onTimelineUpdate((prev) => [...prev, toolCallItem]);
  }

  /**
   * Handle tool call arguments streaming
   */
  private handleToolCallArgs(event: ToolCallArgsEvent): void {
    const { toolCallId, delta } = event;
    const toolCall = this.pendingToolCalls.get(toolCallId);

    if (toolCall && delta) {
      toolCall.args += delta;
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
      const args = toolCall.args ? JSON.parse(toolCall.args) : {};

      // Update state to executing
      this.assistantActionService.updateToolCallState(toolCallId, {
        status: 'executing',
        args,
      });

      // Execute the tool
      const result = await this.toolExecutor.executeTool(toolCall.name, args);

      if (result.waitingForAgentResponse) {
        // Agent will handle this tool and send results back via events
        this.toolExecutor.markToolPending(toolCallId, toolCall);
        // Don't send result back immediately, wait for TOOL_CALL_RESULT event
      } else {
        // Tool was executed locally
        this.assistantActionService.updateToolCallState(toolCallId, {
          status: 'complete',
          result: result.data,
        });

        // Update timeline with result
        this.updateToolCallInTimeline(toolCallId, {
          status: 'completed',
          result: JSON.stringify(result.data),
        });

        // Send tool result back to assistant if chatService is available
        if (this.chatService && (this.chatService as any).sendToolResult) {
          await this.sendToolResultToAssistant(toolCallId, result.data);
        }
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error(`Error executing tool ${toolCall.name}:`, error);

      // Update state to failed
      this.assistantActionService.updateToolCallState(toolCallId, {
        status: 'failed',
        error: error.message,
      });

      // Update timeline with error
      this.updateToolCallInTimeline(toolCallId, {
        status: 'error',
        result: error.message,
      });

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

    // Update timeline with the result
    this.updateToolCallInTimeline(toolCallId, {
      status: 'completed',
      result: resultContent,
    });

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
   * Update tool call in timeline
   */
  private updateToolCallInTimeline(toolCallId: string, updates: Partial<TimelineToolCall>): void {
    this.onTimelineUpdate((prev) =>
      prev.map((item) =>
        item.type === 'tool_call' && item.id === toolCallId
          ? { ...item, ...updates, timestamp: updates.timestamp || item.timestamp }
          : item
      )
    );
  }

  /**
   * Send tool result back to assistant
   */
  private async sendToolResultToAssistant(toolCallId: string, result: any): Promise<void> {
    try {
      const messages = this.timelineToMessages(this.getTimeline());
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

  /**
   * Convert timeline to messages format (helper function)
   */
  private timelineToMessages(timelineItems: TimelineItem[]): any[] {
    return timelineItems
      .filter((item) => item.type === 'message')
      .map((item) => {
        const msg = item as TimelineMessage;
        return {
          id: msg.id,
          role: msg.role,
          content: msg.content,
        };
      });
  }

  /**
   * Clear all state (useful for resetting)
   */
  clearState(): void {
    this.processedEventIds.clear();
    this.processedMessageEnds.clear();
    this.pendingToolCalls.clear();
    this.toolExecutor.clearAllPendingTools();
    this.currentStreamingMessage = '';
    this.onStreamingMessageUpdate('');
  }
}
