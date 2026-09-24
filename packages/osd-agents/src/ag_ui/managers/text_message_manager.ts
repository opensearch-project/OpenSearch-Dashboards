/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TextMessageManager
 *
 * Manages text message lifecycle with tool call interruption support per AG UI specification.
 *
 * ## Event Flow Management:
 * 1. TEXT_MESSAGE_START → TEXT_MESSAGE_CONTENT → [interrupt for tools] → TEXT_MESSAGE_END
 * 2. [tool events with parentMessageId referencing interrupted message]
 * 3. [resume with new TEXT_MESSAGE_START for continuation]
 *
 * ## Key Features:
 * - Generates unique message IDs for each text message
 * - Tracks active message state to prevent invalid operations
 * - Supports message interruption when tools are called
 * - Enables message resumption with new IDs after tool execution
 * - Provides message ID for use as parentMessageId in tool events
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EventType,
  BaseEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
} from '@ag-ui/core';
import { AGUIAuditLogger } from '../../utils/ag_ui_audit_logger';

export class TextMessageManager {
  private currentMessageId?: string;
  private isActive = false;
  private auditLogger?: AGUIAuditLogger;

  constructor(auditLogger?: AGUIAuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * Start a new text message stream
   */
  startMessage(observer: any, threadId: string, runId: string): string {
    const messageId = uuidv4();
    this.currentMessageId = messageId;
    this.isActive = true;

    const event: TextMessageStartEvent = {
      type: EventType.TEXT_MESSAGE_START,
      messageId,
      role: 'assistant',
      timestamp: Date.now(),
    };

    this.emitAndAuditEvent(event, observer, threadId, runId);
    return messageId;
  }

  /**
   * Emit text content for the current message
   */
  emitContent(content: string, observer: any, threadId: string, runId: string): void {
    if (!this.isActive || !this.currentMessageId) {
      throw new Error('No active text message to emit content for');
    }

    const event: TextMessageContentEvent = {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: this.currentMessageId,
      delta: content,
      timestamp: Date.now(),
    };

    this.emitAndAuditEvent(event, observer, threadId, runId);
  }

  /**
   * Interrupt the current message (emit TEXT_MESSAGE_END before tool calls)
   * Returns the messageId that was ended for use as parentMessageId in tool events
   */
  interruptForTools(observer: any, threadId: string, runId: string): string {
    if (!this.isActive || !this.currentMessageId) {
      throw new Error('No active text message to interrupt');
    }

    const endedMessageId = this.currentMessageId;

    const event: TextMessageEndEvent = {
      type: EventType.TEXT_MESSAGE_END,
      messageId: endedMessageId,
      timestamp: Date.now(),
    };

    this.emitAndAuditEvent(event, observer, threadId, runId);

    this.isActive = false;
    this.currentMessageId = undefined;

    return endedMessageId; // Return for use as parentMessageId in tool events
  }

  /**
   * Resume text message stream after tool execution (start new message)
   */
  resumeAfterTools(observer: any, threadId: string, runId: string): string {
    // Start a completely new text message for the continuation
    return this.startMessage(observer, threadId, runId);
  }

  /**
   * Get current message ID (if active)
   */
  getCurrentMessageId(): string | undefined {
    return this.isActive ? this.currentMessageId : undefined;
  }

  /**
   * Check if text message is currently active
   */
  isMessageActive(): boolean {
    return this.isActive;
  }

  /**
   * End the current message (for final completion)
   */
  endMessage(observer: any, threadId: string, runId: string): void {
    if (!this.isActive || !this.currentMessageId) {
      return; // Already ended or no active message
    }

    const event: TextMessageEndEvent = {
      type: EventType.TEXT_MESSAGE_END,
      messageId: this.currentMessageId,
      timestamp: Date.now(),
    };

    this.emitAndAuditEvent(event, observer, threadId, runId);

    this.isActive = false;
    this.currentMessageId = undefined;
  }

  /**
   * Emit event to observer and audit logger (copied from BaseAGUIAdapter)
   */
  private emitAndAuditEvent(
    event: BaseEvent,
    observer: any,
    threadId: string,
    runId: string
  ): void {
    observer.next(event);
    this.auditLogger?.logEvent(threadId, runId, event);
  }
}
