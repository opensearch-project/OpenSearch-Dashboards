/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentStreamEvent, StreamingResponse } from '../../common/types';

export interface SSEParserOptions {
  retry?: number;
  onEvent?: (event: AgentStreamEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class SSEParser {
  private buffer: string = '';
  private options: SSEParserOptions;

  constructor(options: SSEParserOptions = {}) {
    this.options = options;
  }

  public parseChunk(chunk: string): AgentStreamEvent[] {
    this.buffer += chunk;
    const events: AgentStreamEvent[] = [];

    // Split buffer by double newlines (SSE event separator)
    const lines = this.buffer.split('\n');

    // Keep incomplete last line in buffer
    this.buffer = lines.pop() || '';

    let currentEvent: Partial<StreamingResponse> = {};

    for (const line of lines) {
      if (line.trim() === '') {
        // Empty line indicates end of event
        if (Object.keys(currentEvent).length > 0) {
          const parsedEvent = this.parseEvent(currentEvent);
          if (parsedEvent) {
            events.push(parsedEvent);
            this.options.onEvent?.(parsedEvent);
          }
          currentEvent = {};
        }
        continue;
      }

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        continue;
      }

      const field = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      switch (field) {
        case 'event':
          currentEvent.event = value;
          break;
        case 'data':
          currentEvent.data = (currentEvent.data || '') + value;
          break;
        case 'id':
          currentEvent.id = value;
          break;
        case 'retry':
          currentEvent.retry = parseInt(value, 10);
          break;
      }
    }

    return events;
  }

  public flush(): AgentStreamEvent[] {
    const events: AgentStreamEvent[] = [];

    if (this.buffer.trim()) {
      // Try to parse any remaining buffer as a final event
      const lines = this.buffer.split('\n');
      const currentEvent: Partial<StreamingResponse> = {};

      for (const line of lines) {
        if (line.trim() === '') continue;

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const field = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();

        switch (field) {
          case 'event':
            currentEvent.event = value;
            break;
          case 'data':
            currentEvent.data = (currentEvent.data || '') + value;
            break;
          case 'id':
            currentEvent.id = value;
            break;
          case 'retry':
            currentEvent.retry = parseInt(value, 10);
            break;
        }
      }

      if (Object.keys(currentEvent).length > 0) {
        const parsedEvent = this.parseEvent(currentEvent);
        if (parsedEvent) {
          events.push(parsedEvent);
          this.options.onEvent?.(parsedEvent);
        }
      }
    }

    this.buffer = '';
    return events;
  }

  private parseEvent(sseEvent: Partial<StreamingResponse>): AgentStreamEvent | null {
    if (!sseEvent.event || !sseEvent.data) {
      return null;
    }

    try {
      let parsedData: unknown;

      // Try to parse data as JSON
      try {
        parsedData = JSON.parse(sseEvent.data);
      } catch {
        // If not JSON, use as string
        parsedData = sseEvent.data;
      }

      // Map SSE event types to our AgentStreamEvent types
      const eventType = this.mapEventType(sseEvent.event);

      const event: AgentStreamEvent = {
        type: eventType,
        ...(parsedData as any),
      };

      // Handle specific event structures
      switch (eventType) {
        case 'message_start':
          return {
            type: 'message_start',
            message: parsedData as any,
          };

        case 'content_block_delta':
          return {
            type: 'content_block_delta',
            index: (parsedData as any)?.index || 0,
            delta: (parsedData as any)?.delta,
          };

        case 'content_block_stop':
          return {
            type: 'content_block_stop',
            index: (parsedData as any)?.index || 0,
          };

        case 'message_delta':
          return {
            type: 'message_delta',
            delta: parsedData as any,
          };

        case 'message_stop':
          return {
            type: 'message_stop',
          };

        case 'tool_call_start':
          return {
            type: 'tool_call_start',
            index: (parsedData as any)?.index || 0,
          };

        case 'tool_call_delta':
          return {
            type: 'tool_call_delta',
            index: (parsedData as any)?.index || 0,
            delta: (parsedData as any)?.delta,
          };

        case 'tool_call_stop':
          return {
            type: 'tool_call_stop',
            index: (parsedData as any)?.index || 0,
          };

        case 'error':
          return {
            type: 'error',
            error: parsedData as any,
          };

        default:
          return event;
      }
    } catch (error) {
      this.options.onError?.(error as Error);
      return null;
    }
  }

  private mapEventType(sseEventType: string): AgentStreamEvent['type'] {
    // Map common SSE event types to our internal types
    const typeMap: Record<string, AgentStreamEvent['type']> = {
      message_start: 'message_start',
      content_block_delta: 'content_block_delta',
      content_block_stop: 'content_block_stop',
      message_delta: 'message_delta',
      message_stop: 'message_stop',
      tool_use_start: 'tool_call_start',
      tool_use_delta: 'tool_call_delta',
      tool_use_stop: 'tool_call_stop',
      error: 'error',
      // Fallback for unknown types
    };

    return typeMap[sseEventType] || 'content_block_delta';
  }

  public reset(): void {
    this.buffer = '';
  }
}

export function createSSEParser(options?: SSEParserOptions): SSEParser {
  return new SSEParser(options);
}
