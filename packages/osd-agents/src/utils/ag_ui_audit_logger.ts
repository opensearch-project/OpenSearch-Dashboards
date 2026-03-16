/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { join } from 'path';
import { BaseEvent } from '@ag-ui/core';
import { BaseLogger } from './base_logger';

/**
 * Audit logger for AG UI events - creates request-specific log files
 */
export class AGUIAuditLogger extends BaseLogger {
  private activeRequests = new Map<
    string,
    {
      threadId: string;
      runId: string;
      requestId?: string;
      logFile: string;
      startTime: number;
    }
  >();

  constructor(auditDir: string = join(__dirname, '../../audit-logs')) {
    super(auditDir);
  }

  /**
   * Start audit logging for a request
   */
  startRequest(threadId: string, runId: string, requestId?: string): void {
    const timestamp = this.getTimestamp();
    const dateStr = this.getDateString(timestamp.unix);
    const requestKey = `${threadId}_${runId}`;
    const logFile = join(this.logDir, `ag-ui-audit-${threadId}-${dateStr}.log`);

    this.activeRequests.set(requestKey, {
      threadId,
      runId,
      requestId,
      logFile,
      startTime: timestamp.unix,
    });

    const entry = {
      timestamp: timestamp.unix,
      iso_timestamp: timestamp.iso,
      human_timestamp: this.toHumanTimestamp(timestamp.unix),
      event_type: 'REQUEST_START',
      thread_id: threadId,
      run_id: runId,
      request_id: requestId,
    };

    this.writeToFile(logFile, JSON.stringify(entry) + '\n');
  }

  /**
   * Log an AG UI event
   */
  logEvent(threadId: string, runId: string, event: BaseEvent): void {
    const requestKey = `${threadId}_${runId}`;
    const request = this.activeRequests.get(requestKey);

    if (!request) {
      this.startRequest(threadId, runId);
      return this.logEvent(threadId, runId, event);
    }

    const timestamp = this.getTimestamp();
    const entry = {
      timestamp: timestamp.unix,
      iso_timestamp: timestamp.iso,
      human_timestamp: this.toHumanTimestamp(timestamp.unix),
      event_type: 'AG_UI_EVENT',
      thread_id: threadId,
      run_id: runId,
      request_id: request.requestId,
      ag_ui_event: {
        type: event.type,
        timestamp: event.timestamp,
        timestamp_human: this.toHumanTimestamp(event.timestamp),
        ...this.sanitizeEvent(event),
      },
    };

    this.writeToFile(request.logFile, JSON.stringify(entry) + '\n');
  }

  /**
   * Log HTTP request details
   */
  logHttpRequest(threadId: string, runId: string, requestData: any): void {
    const requestKey = `${threadId}_${runId}`;
    const request = this.activeRequests.get(requestKey);

    if (!request) {
      this.startRequest(threadId, runId);
      return this.logHttpRequest(threadId, runId, requestData);
    }

    const timestamp = this.getTimestamp();
    const entry = {
      timestamp: timestamp.unix,
      iso_timestamp: timestamp.iso,
      human_timestamp: this.toHumanTimestamp(timestamp.unix),
      event_type: 'HTTP_REQUEST',
      thread_id: threadId,
      run_id: runId,
      request_id: request.requestId,
      http_request: requestData,
    };

    this.writeToFile(request.logFile, JSON.stringify(entry) + '\n');
  }

  /**
   * Log validation errors for audit
   */
  logValidationError(threadId: string, runId: string, errors: string[]): void {
    const requestKey = `${threadId}_${runId}`;
    const request = this.activeRequests.get(requestKey);

    if (!request) {
      this.startRequest(threadId, runId);
      return this.logValidationError(threadId, runId, errors);
    }

    const timestamp = this.getTimestamp();
    const entry = {
      timestamp: timestamp.unix,
      iso_timestamp: timestamp.iso,
      human_timestamp: this.toHumanTimestamp(timestamp.unix),
      event_type: 'VALIDATION_ERROR',
      thread_id: threadId,
      run_id: runId,
      validation_errors: errors,
    };

    this.writeToFile(request.logFile, JSON.stringify(entry) + '\n');
  }

  /**
   * End audit logging for a request
   */
  endRequest(
    threadId: string,
    runId: string,
    outcome: 'success' | 'error' | 'cancelled',
    errorMessage?: string
  ): void {
    const requestKey = `${threadId}_${runId}`;
    const request = this.activeRequests.get(requestKey);

    if (!request) return;

    const timestamp = this.getTimestamp();
    const duration = timestamp.unix - request.startTime;

    const entry = {
      timestamp: timestamp.unix,
      iso_timestamp: timestamp.iso,
      human_timestamp: this.toHumanTimestamp(timestamp.unix),
      event_type: 'REQUEST_END',
      thread_id: threadId,
      run_id: runId,
      request_id: request.requestId,
      outcome,
      duration_ms: duration,
      error_message: errorMessage || null,
    };

    this.writeToFile(request.logFile, JSON.stringify(entry) + '\n');
    this.activeRequests.delete(requestKey);
  }

  /**
   * Sanitize event data
   */
  private sanitizeEvent(event: BaseEvent): any {
    const sanitized = { ...event };
    delete (sanitized as any).timestamp; // We add our own

    // Truncate long content
    if ((sanitized as any).delta && typeof (sanitized as any).delta === 'string') {
      const delta = (sanitized as any).delta;
      if (delta.length > 1000) {
        (sanitized as any).delta = delta.substring(0, 1000) + '... [truncated]';
      }
    }

    return sanitized;
  }

  /**
   * Cleanup on shutdown
   */
  cleanup(): void {
    for (const [, request] of this.activeRequests) {
      this.endRequest(request.threadId, request.runId, 'cancelled', 'Server shutdown');
    }
  }
}
