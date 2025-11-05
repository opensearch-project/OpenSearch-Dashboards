/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Base logger with common file operations and directory management
 */
export abstract class BaseLogger {
  protected logDir: string;

  constructor(logDir: string) {
    this.logDir = logDir;
    // Ensure log directory exists
    mkdirSync(this.logDir, { recursive: true });
  }

  /**
   * Write entry to specified log file
   */
  protected writeToFile(logFile: string, content: string): void {
    try {
      appendFileSync(logFile, content);
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
      console.log('Log content:', content);
    }
  }

  /**
   * Ensure directory exists for a file path
   */
  protected ensureDirectoryExists(filePath: string): void {
    const dir = join(filePath, '..');
    mkdirSync(dir, { recursive: true });
  }

  /**
   * Generate standardized timestamp
   */
  protected getTimestamp(): { unix: number; iso: string } {
    const now = Date.now();
    return {
      unix: now,
      iso: new Date(now).toISOString(),
    };
  }

  /**
   * Convert Unix timestamp to human-readable format in PDT
   */
  protected toHumanTimestamp(unixTimestamp: number): string {
    const dateStr = new Date(unixTimestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles',
      timeZoneName: 'short',
    });

    // Fix potential hour 24 issue (some locales may show midnight as 24:00)
    // Replace 24:xx:xx with 00:xx:xx
    return dateStr.replace(/\b24:(\d{2}:\d{2})\b/, '00:$1');
  }

  /**
   * Generate date string for file naming (YYYY-MM-DD) in PDT timezone
   */
  protected getDateString(timestamp?: number): string {
    const date = timestamp ? new Date(timestamp) : new Date();
    // Use PDT timezone to match log entries
    const pdtDateString = date.toLocaleDateString('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return pdtDateString; // Already in YYYY-MM-DD format
  }
}
