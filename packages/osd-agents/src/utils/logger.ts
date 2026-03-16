/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { join } from 'path';
import { BaseLogger } from './base_logger';

// Logger utility with hourly rotation
export class Logger extends BaseLogger {
  private currentLogFile: string = '';
  private threadId?: string;
  private runId?: string;
  private requestId?: string;

  constructor(logDir: string = join(__dirname, '../../logs')) {
    super(logDir);
    this.updateLogFile();
  }

  /**
   * Set thread, run, and request IDs for correlation with AG UI audits
   */
  setContext(threadId?: string, runId?: string, requestId?: string): void {
    this.threadId = threadId;
    this.runId = runId;
    this.requestId = requestId;
  }

  private updateLogFile(): void {
    const timestamp = this.getTimestamp();
    const dateStr = this.getDateString(timestamp.unix);
    // Get hour in PDT timezone to match log entries
    const hour = new Date(timestamp.unix).toLocaleString('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles',
    });
    const newLogFile = join(this.logDir, `ai-agent-${dateStr}-${hour}.log`);

    if (this.currentLogFile !== newLogFile) {
      this.currentLogFile = newLogFile;
      // Log rotation message
      const rotationMsg = `[${timestamp.iso}] INFO: Log file rotated to ${this.currentLogFile}\n`;
      this.writeToFile(this.currentLogFile, rotationMsg);
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    const pdtTime = this.toHumanTimestamp(timestamp.unix);

    // Include thread_id, run_id, and request_id if available
    const context = [];
    if (this.threadId) context.push(`thread_id=${this.threadId}`);
    if (this.runId) context.push(`run_id=${this.runId}`);
    if (this.requestId) context.push(`request_id=${this.requestId}`);
    const contextStr = context.length > 0 ? ` [${context.join(', ')}]` : '';

    const logEntry = `[${pdtTime}] ${contextStr} ${level}: ${message}`;
    return data ? `${logEntry} ${JSON.stringify(data, null, 2)}` : logEntry;
  }

  info(message: string, data?: any): void {
    this.updateLogFile();
    const logEntry = this.formatMessage('INFO', message, data);
    console.log(logEntry);
    this.writeToFile(this.currentLogFile, logEntry + '\n');
  }

  warn(message: string, data?: any): void {
    this.updateLogFile();
    const logEntry = this.formatMessage('WARN', message, data);
    console.warn(logEntry);
    this.writeToFile(this.currentLogFile, logEntry + '\n');
  }

  error(message: string, data?: any): void {
    this.updateLogFile();
    const logEntry = this.formatMessage('ERROR', message, data);
    console.error(logEntry);
    this.writeToFile(this.currentLogFile, logEntry + '\n');
  }

  debug(message: string, data?: any): void {
    this.updateLogFile();
    const logEntry = this.formatMessage('DEBUG', message, data);
    if (process.env.DEBUG) {
      console.log(logEntry);
    }
    this.writeToFile(this.currentLogFile, logEntry + '\n');
  }

  // Specialized debugging for tool parameter streaming
  toolParameterDebug(phase: string, toolName: string, data: any): void {
    const debugData = {
      phase,
      toolName,
      timestamp: Date.now(),
      ...data,
    };

    this.debug(`[TOOL_PARAM_STREAM] ${phase}`, debugData);

    // Always log tool parameter issues to console for immediate visibility
    if (phase === 'VALIDATION_FAILED' || phase === 'CIRCUIT_BREAKER_ACTIVATED') {
      console.log(
        `\n🚨 [TOOL DEBUG] ${phase} for ${toolName}:`,
        JSON.stringify(debugData, null, 2)
      );
    } else if (process.env.DEBUG || process.env.TOOL_DEBUG) {
      console.log(
        `\n🔧 [TOOL DEBUG] ${phase} for ${toolName}:`,
        JSON.stringify(debugData, null, 2)
      );
    }
  }

  // Log streaming agent output
  stream(message: string): void {
    this.updateLogFile();
    const timestamp = this.getTimestamp();
    const pdtTime = this.toHumanTimestamp(timestamp.unix);

    // Include thread_id and run_id if available
    const context = [];
    if (this.threadId) context.push(`thread_id=${this.threadId}`);
    if (this.runId) context.push(`run_id=${this.runId}`);
    const contextStr = context.length > 0 ? ` [${context.join(', ')}]` : '';

    this.writeToFile(this.currentLogFile, `[${pdtTime}] ${contextStr} STREAM: ${message}\n`);
  }
}
