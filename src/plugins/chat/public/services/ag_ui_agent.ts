/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { HttpSetup } from '../../../../core/public';
import { CHAT_PROXY_PATH } from '../../common';
import { RunAgentInput } from '../../common/types';

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
  private proxyUrl: string;
  private abortController?: AbortController;
  private sseBuffer: string = '';
  private activeConnection: boolean = false;
  private http?: HttpSetup;

  /**
   * Get the full URL with basePath prepended.
   * Uses OSD's http.basePath.prepend() if available, otherwise returns the path as-is.
   * This ensures URLs work correctly in development mode where OSD uses a random basePath.
   *
   * @param path - API path (e.g., CHAT_PROXY_PATH)
   * @returns Full URL with basePath prepended if available, or the original path
   */
  private getUrl(path: string): string {
    if (this.http?.basePath?.prepend) {
      return this.http.basePath.prepend(path);
    }
    return path;
  }

  constructor(proxyUrl: string = CHAT_PROXY_PATH, http?: HttpSetup) {
    this.proxyUrl = proxyUrl;
    this.http = http;
  }

  public runAgent(input: RunAgentInput, dataSourceId?: string): Observable<BaseEvent> {
    return new Observable<BaseEvent>((observer) => {
      // Only abort if we're not in the middle of an active connection
      // This prevents tool result submissions from breaking the main SSE stream
      if (this.abortController && !this.activeConnection) {
        this.abortController.abort();
      }

      // Create new controller if none exists OR if the existing one is aborted
      if (!this.abortController || this.abortController.signal.aborted) {
        this.abortController = new AbortController();
        this.sseBuffer = ''; // Reset buffer for new request
      }

      // Set active connection flag
      this.activeConnection = true;

      // Build URL with optional dataSourceId query parameter
      const baseUrl = this.getUrl(this.proxyUrl);
      const url = dataSourceId
        ? `${baseUrl}?dataSourceId=${encodeURIComponent(dataSourceId)}`
        : baseUrl;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'osd-xsrf': 'true', // Required for OpenSearch Dashboards API calls
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
              if (done) {
                break;
              }

              // Parse Server-Sent Events with proper buffering
              const chunk = new TextDecoder().decode(value);
              const allData = this.sseBuffer + chunk;
              const lines = allData.split('\n');

              // Keep the last incomplete line in buffer
              this.sseBuffer = lines[lines.length - 1];
              const completeLines = lines.slice(0, -1);

              for (const line of completeLines) {
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

            this.activeConnection = false;
            observer.complete();
          } finally {
            reader.releaseLock();
            this.activeConnection = false;
          }
        })
        .catch((error) => {
          this.activeConnection = false;

          if (error.name === 'AbortError') {
            return; // Request was cancelled
          }

          // eslint-disable-next-line no-console
          console.error('Chat proxy request failed:', error.message);

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
      this.abortController = undefined;
      this.activeConnection = false;
    }
  }

  public resetConnection(): void {
    this.activeConnection = false;
    this.abortController = undefined;
    this.sseBuffer = '';
  }
}
