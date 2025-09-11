/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../../../core/server';
import {
  AgentRequest,
  AgentResponse,
  AgentStreamEvent,
  AgentError,
  AgentClient as IAgentClient,
} from '../../common/types';
import { ConfigService } from './config_service';
import { StructuredLogger, CorrelatedLogContext } from '../utils/logger';
import { SSEParser, createSSEParser } from '../utils/sse_parser';

export interface AgentClientOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class AgentClient implements IAgentClient {
  private configService: ConfigService;
  private logger: StructuredLogger;
  private options: AgentClientOptions;

  constructor(configService: ConfigService, logger: Logger, options: AgentClientOptions = {}) {
    this.configService = configService;
    this.logger = new StructuredLogger(logger, configService.getConfig().agent.debug);
    this.options = {
      maxRetries: configService.getConfig().agent.maxRetries,
      retryDelay: configService.getConfig().agent.retryDelay,
      timeout: configService.getConfig().agent.timeout,
      ...options,
    };
  }

  public async chat(request: AgentRequest): Promise<AgentResponse> {
    const correlationId = this.logger.createCorrelationId();
    const context: CorrelatedLogContext = {
      correlationId,
      conversationId: request.conversationId,
    };

    this.logger.info('Starting chat request', context);

    try {
      const response = await this.makeRequest('/chat', request, context);

      if (!response.ok) {
        throw await this.createErrorFromResponse(response, context);
      }

      const result = (await response.json()) as AgentResponse;
      this.logger.info('Chat request completed successfully', {
        ...context,
        responseId: result.id,
      });

      return result;
    } catch (error) {
      this.logger.error('Chat request failed', error as Error, context);
      throw error;
    }
  }

  public async *chatStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent, void, unknown> {
    const correlationId = this.logger.createCorrelationId();
    const context: CorrelatedLogContext = {
      correlationId,
      conversationId: request.conversationId,
    };

    this.logger.info('Starting streaming chat request', context);

    try {
      const streamRequest = { ...request, stream: true };
      const response = await this.makeRequest('/chat/stream', streamRequest, context, {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      });

      if (!response.ok) {
        throw await this.createErrorFromResponse(response, context);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = createSSEParser({
        onEvent: (event) => {
          this.logger.logStreamEvent(event.type, event, context);
        },
        onError: (error) => {
          this.logger.error('SSE parsing error', error, context);
        },
      });

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            // Flush any remaining events in parser
            const finalEvents = parser.flush();
            for (const event of finalEvents) {
              yield event;
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const events = parser.parseChunk(chunk);

          for (const event of events) {
            if (event.type === 'error') {
              const error = this.createErrorFromStreamEvent(event);
              this.logger.error('Stream error event received', error, context);
              throw error;
            }
            yield event;
          }
        }
      } finally {
        reader.releaseLock();
      }

      this.logger.info('Streaming chat request completed', context);
    } catch (error) {
      this.logger.error('Streaming chat request failed', error as Error, context);
      throw error;
    }
  }

  public async isHealthy(): Promise<boolean> {
    const correlationId = this.logger.createCorrelationId();
    const context: CorrelatedLogContext = { correlationId };

    try {
      const response = await this.makeRequest('/health', {}, context, {}, 'GET');
      const isHealthy = response.ok;

      this.logger.info('Health check completed', {
        ...context,
        healthy: isHealthy,
        status: response.status,
      });

      return isHealthy;
    } catch (error) {
      this.logger.warn('Health check failed', { ...context, error: (error as Error).message });
      return false;
    }
  }

  private async makeRequest(
    path: string,
    body: unknown,
    context: CorrelatedLogContext,
    additionalHeaders: Record<string, string> = {},
    method: string = 'POST'
  ): Promise<Response> {
    const config = this.configService.getConfig();
    const url = `${config.agent.endpoint}${path}`;

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'OpenSearch-Dashboards-Assistant/1.0.0',
      ...this.configService.getAuthHeaders(),
      ...additionalHeaders,
    };

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.options.timeout!),
    };

    if (method !== 'GET' && body) {
      requestOptions.body = JSON.stringify(body);
    }

    this.logger.logRequest(method, url, headers, body, context);

    const startTime = Date.now();

    return await this.retryRequest(async () => {
      const response = await fetch(url, requestOptions);
      const duration = Date.now() - startTime;

      this.logger.logResponse(
        response.status,
        Object.fromEntries(response.headers.entries()),
        undefined, // Don't log response body here for streaming
        duration,
        context
      );

      return response;
    }, context);
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    context: CorrelatedLogContext
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.maxRetries!; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt);
          this.logger.info(`Retrying request (attempt ${attempt + 1})`, {
            ...context,
            retryDelay: delay,
          });
          await this.sleep(delay);
        }

        return await requestFn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.options.maxRetries || !this.isRetryableError(error as Error)) {
          break;
        }

        this.logger.warn(`Request failed, will retry`, {
          ...context,
          attempt: attempt + 1,
          error: (error as Error).message,
        });
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.options.retryDelay!;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private isRetryableError(error: Error): boolean {
    // Retry on network errors, timeouts, and 5xx responses
    if (error.name === 'AbortError') return true; // Timeout
    if (error.name === 'TypeError') return true; // Network error

    // Check if it's an HTTP error with retryable status
    const message = error.message.toLowerCase();
    return (
      message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504') ||
      message.includes('timeout')
    );
  }

  private async createErrorFromResponse(
    response: Response,
    context: CorrelatedLogContext
  ): Promise<AgentError> {
    let errorBody: any = {};

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorBody = await response.json();
      } else {
        errorBody = { message: await response.text() };
      }
    } catch {
      errorBody = { message: `HTTP ${response.status} ${response.statusText}` };
    }

    const agentError: AgentError = {
      type: this.mapHttpStatusToErrorType(response.status),
      message: errorBody.message || `Request failed with status ${response.status}`,
      details: {
        status: response.status,
        statusText: response.statusText,
        ...errorBody,
      },
    };

    this.logger.error('Agent API error', undefined, {
      ...context,
      agentError,
    });

    return agentError;
  }

  private createErrorFromStreamEvent(event: AgentStreamEvent): AgentError {
    if (event.type === 'error' && event.error) {
      return event.error;
    }

    return {
      type: 'api_error',
      message: 'Unknown stream error',
      details: { event },
    };
  }

  private mapHttpStatusToErrorType(status: number): AgentError['type'] {
    if (status === 401) return 'authentication_error';
    if (status === 403) return 'permission_error';
    if (status === 404) return 'not_found_error';
    if (status === 429) return 'rate_limit_error';
    if (status === 422) return 'invalid_request_error';
    if (status >= 500) return 'api_error';
    if (status === 503) return 'overloaded_error';

    return 'api_error';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
