/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../core/server';

export interface CorrelatedLogContext {
  correlationId?: string;
  requestId?: string;
  conversationId?: string;
  [key: string]: unknown;
}

export class StructuredLogger {
  private logger: Logger;
  private debugEnabled: boolean;

  constructor(logger: Logger, debugEnabled: boolean = false) {
    this.logger = logger;
    this.debugEnabled = debugEnabled;
  }

  public debug(message: string, context?: CorrelatedLogContext): void {
    if (this.debugEnabled) {
      this.logger.debug(message, context);
    }
  }

  public info(message: string, context?: CorrelatedLogContext): void {
    this.logger.info(message, context);
  }

  public warn(message: string, context?: CorrelatedLogContext): void {
    this.logger.warn(message, context);
  }

  public error(message: string, error?: Error, context?: CorrelatedLogContext): void {
    const errorContext = {
      ...context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };
    this.logger.error(message, errorContext);
  }

  public logRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: unknown,
    context?: CorrelatedLogContext
  ): void {
    const logContext = {
      ...context,
      http: {
        method,
        url,
        headers: this.sanitizeHeaders(headers),
        bodySize: body ? JSON.stringify(body).length : 0,
      },
    };

    if (this.debugEnabled && body) {
      logContext.http = {
        ...logContext.http,
        body: this.sanitizeBody(body),
      };
    }

    this.debug('HTTP Request', logContext);
  }

  public logResponse(
    status: number,
    headers: Record<string, string>,
    body?: unknown,
    duration?: number,
    context?: CorrelatedLogContext
  ): void {
    const logContext = {
      ...context,
      http: {
        status,
        headers: this.sanitizeHeaders(headers),
        duration,
        bodySize: body ? JSON.stringify(body).length : 0,
      },
    };

    if (this.debugEnabled && body) {
      logContext.http = {
        ...logContext.http,
        body: this.sanitizeBody(body),
      };
    }

    if (status >= 400) {
      this.error('HTTP Response Error', undefined, logContext);
    } else {
      this.debug('HTTP Response', logContext);
    }
  }

  public logStreamEvent(event: string, data: unknown, context?: CorrelatedLogContext): void {
    const logContext = {
      ...context,
      stream: {
        event,
        dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
      },
    };

    if (this.debugEnabled) {
      logContext.stream = {
        ...logContext.stream,
        data: this.sanitizeBody(data),
      };
    }

    this.debug('Stream Event', logContext);
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };

    // Redact sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
      if (sanitized[header.toLowerCase()]) {
        sanitized[header.toLowerCase()] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: unknown): unknown {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return this.sanitizeObject(parsed);
      } catch {
        return body.length > 1000 ? `${body.substring(0, 1000)}... [truncated]` : body;
      }
    }
    return this.sanitizeObject(body);
  }

  private sanitizeObject(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized = { ...(obj as Record<string, unknown>) };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    });

    return sanitized;
  }

  public createCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
