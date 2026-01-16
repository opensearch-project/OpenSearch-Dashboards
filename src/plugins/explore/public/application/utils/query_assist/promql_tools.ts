/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgUiTool } from './agui_types';

/**
 * Frontend tools for PromQL query generation
 * Single consolidated tool that returns metrics with their labels and sample values
 * in one call to reduce agent round trips and prevent infinite loops.
 */
const PROMQL_FRONTEND_TOOLS_INTERNAL = [
  {
    name: 'search_prometheus_metadata',
    description:
      'Search Prometheus metadata. Returns matched metrics with their labels and metadata in a single call. Use this to understand available metrics and their filtering options before writing a PromQL query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search pattern to filter metrics by name. Supports regex (e.g., "cpu|memory" to match both) or substring matching.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of metrics to return. Defaults to 20.',
        },
      },
      required: [],
    },
  },
] as const;

export const PROMQL_FRONTEND_TOOLS = (PROMQL_FRONTEND_TOOLS_INTERNAL as unknown) as AgUiTool[];
export const PROMQL_TOOL_NAMES = PROMQL_FRONTEND_TOOLS_INTERNAL.map((tool) => tool.name);
export type PromQLToolName = typeof PROMQL_TOOL_NAMES[number];

export const isPromQLMetadataTool = (toolName: string): toolName is PromQLToolName =>
  PROMQL_TOOL_NAMES.includes(toolName as PromQLToolName);
