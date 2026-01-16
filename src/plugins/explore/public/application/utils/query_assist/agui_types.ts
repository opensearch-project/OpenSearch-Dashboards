/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Message, Context, Tool, State } from '@ag-ui/core';

/**
 * Request body for the AG-UI streaming endpoint
 */
export interface AgUiRequest {
  threadId: string;
  runId: string;
  messages: Message[];
  tools: Tool[];
  context: Context[];
  state: State;
  forwardedProps: Record<string, unknown>;
}

/**
 * Response from query generation
 */
export interface AgUiResponse {
  query?: string;
  timeRange?: {
    from: string;
    to: string;
  };
}

/**
 * Tool definition for AG-UI protocol
 */
export interface AgUiTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description: string;
      }
    >;
    required: string[];
  };
}
