/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseSSEStream, runHttpRequest } from '@ag-ui/client';
import {
  BaseEvent,
  Context,
  EventType,
  Message,
  RunAgentInput,
  RunErrorEvent,
  Tool,
} from '@ag-ui/core';
import { Observable } from 'rxjs';

/**
 * Default timeout for agent requests (2 minutes)
 */
const DEFAULT_REQUEST_TIMEOUT = 2 * 60 * 1000;

/**
 * Input for running the AG-UI agent
 */
export interface AgUiRunInput {
  /** Messages to send to the agent (system prompt, user message, etc.) */
  messages: Message[];
  /** The data source name/index */
  dataSourceName: string;
  /** The query language */
  language: string;
  /** Frontend tools to provide to the agent */
  tools?: Tool[];
  /** Additional context */
  context?: Context[];
  /** Data source ID for MDS */
  dataSourceId?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Client for communicating with the AG-UI agent endpoint
 */
export class AgUiAgent {
  private abortController?: AbortController;
  private threadId: string;

  constructor() {
    this.threadId = this.generateThreadId();
  }

  private generateThreadId(): string {
    return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateRunId(): string {
    return `run-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  public generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  public getThreadId(): string {
    return this.threadId;
  }

  /**
   * Start a new conversation thread
   */
  public newThread(): void {
    this.threadId = this.generateThreadId();
  }

  private buildRequestBody(messages: Message[], input: AgUiRunInput): RunAgentInput {
    return {
      threadId: this.threadId,
      runId: this.generateRunId(),
      messages,
      tools: input.tools || [],
      context: [
        {
          description: 'Data source name',
          value: input.dataSourceName,
        },
        ...(input.context || []),
      ],
      state: {},
      forwardedProps: {
        queryAssistLanguage: input.language,
      },
    };
  }

  private executeRequest(requestBody: RunAgentInput, input: AgUiRunInput): Observable<BaseEvent> {
    this.abort();

    const basePath = '/api/chat/proxy';
    const url = input.dataSourceId
      ? `${basePath}?dataSourceId=${encodeURIComponent(input.dataSourceId)}`
      : basePath;

    this.abortController = new AbortController();
    const timeout = input.timeout || DEFAULT_REQUEST_TIMEOUT;
    const timeoutId = setTimeout(() => this.abortController?.abort(), timeout);
    this.abortController.signal.addEventListener('abort', () => clearTimeout(timeoutId));

    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'osd-xsrf': 'true',
      },
      body: JSON.stringify(requestBody),
      signal: this.abortController.signal,
    };

    return new Observable<BaseEvent>((observer) => {
      const subscription = runHttpRequest(url, config)
        .pipe(parseSSEStream)
        .subscribe({
          next: (event: BaseEvent) => observer.next(event),
          error: (error: Error) => {
            if (error.name === 'AbortError') {
              observer.complete();
              return;
            }
            const errorEvent: RunErrorEvent = {
              type: EventType.RUN_ERROR,
              message: error.message || 'Unknown error',
            };
            observer.next(errorEvent);
            observer.error(error);
          },
          complete: () => observer.complete(),
        });

      return () => {
        subscription.unsubscribe();
        this.abort();
      };
    });
  }

  /**
   * Run the AG-UI agent using the official parseSSEStream from @ag-ui/client
   * Returns an Observable that emits AG-UI events as they stream from the server
   */
  public runAgent(input: AgUiRunInput): Observable<BaseEvent> {
    const requestBody = this.buildRequestBody(input.messages, input);
    return this.executeRequest(requestBody, input);
  }

  /**
   * Send a tool result back to the agent
   */
  public sendToolResult(
    toolCallId: string,
    result: unknown,
    input: AgUiRunInput
  ): Observable<BaseEvent> {
    const toolMessage: Message = {
      id: this.generateMessageId(),
      role: 'tool',
      content: typeof result === 'string' ? result : JSON.stringify(result),
      toolCallId,
    };

    const requestBody = this.buildRequestBody([...input.messages, toolMessage], input);
    return this.executeRequest(requestBody, input);
  }

  /**
   * Abort the current request
   */
  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }
}
