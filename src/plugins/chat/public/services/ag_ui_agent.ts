/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';

// Temporary types to replace @ag-ui/client imports
export interface RunAgentInput {
  threadId: string;
  runId: string;
  messages: Array<{ role: string; content: string }>;
  tools?: any[];
  state?: any;
}

export interface BaseEvent {
  type: string;
  threadId?: string;
  runId?: string;
  message?: string;
}

export enum EventType {
  RUN_STARTED = 'RUN_STARTED',
  RUN_FINISHED = 'RUN_FINISHED',
  RUN_ERROR = 'RUN_ERROR',
}

export class AgUiAgent {
  private serverUrl: string;
  private abortController?: AbortController;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
  }

  public runAgent(input: RunAgentInput, handlers?: any): Observable<BaseEvent> {
    return new Observable<BaseEvent>((observer) => {
      this.abortController = new AbortController();

      // Emit RUN_STARTED event
      observer.next({
        type: EventType.RUN_STARTED,
        threadId: input.threadId,
        runId: input.runId,
      } as any);

      // Make request to AG-UI server
      fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(input),
        signal: this.abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body reader available');
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Parse Server-Sent Events
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    observer.next(data);
                  } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn('Failed to parse SSE data:', line, e);
                  }
                }
              }
            }

            // Emit RUN_FINISHED event
            observer.next({
              type: EventType.RUN_FINISHED,
              threadId: input.threadId,
              runId: input.runId,
            } as any);

            observer.complete();
          } finally {
            reader.releaseLock();
          }
        })
        .catch((error) => {
          if (error.name === 'AbortError') {
            return; // Request was cancelled
          }

          observer.next({
            type: EventType.RUN_ERROR,
            message: error.message,
          } as any);

          observer.error(error);
        });
    });
  }

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
