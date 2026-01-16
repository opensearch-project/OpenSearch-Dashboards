/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgUiTool } from './agui_types';

/**
 * Frontend tools for PromQL query generation
 * These tools allow the agent to search Prometheus metadata
 * before generating a PromQL query.
 */
const PROMQL_FRONTEND_TOOLS_INTERNAL = [
  {
    name: 'search_metrics',
    description:
      'Search for available Prometheus metrics. Returns a list of metrics with their type and description. Use this to find relevant metrics for the user query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Optional search pattern to filter metrics. Supports substring matching. Leave empty to get all available metrics.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of metrics to return. Defaults to 100.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_labels',
    description:
      'Search for available Prometheus labels. Labels are used to filter and group metrics in PromQL queries. Optionally filter by a specific metric.',
    parameters: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          description:
            'Optional metric name to get labels for. If provided, returns only labels available for that metric. Leave empty to get all labels.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_label_values',
    description:
      'Search for possible values of a specific Prometheus label. Use this to find valid filter values for label selectors in PromQL queries.',
    parameters: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'The label name to get values for (e.g., "instance", "job", "namespace").',
        },
        metric: {
          type: 'string',
          description:
            'Optional metric name to filter label values by. If provided, returns only values that exist for this metric.',
        },
      },
      required: ['label'],
    },
  },
] as const;

export const PROMQL_FRONTEND_TOOLS = (PROMQL_FRONTEND_TOOLS_INTERNAL as unknown) as AgUiTool[];
export const PROMQL_TOOL_NAMES = PROMQL_FRONTEND_TOOLS_INTERNAL.map((tool) => tool.name);
export type PromQLToolName = typeof PROMQL_TOOL_NAMES[number];

export const isPromQLMetadataTool = (toolName: string): toolName is PromQLToolName =>
  PROMQL_TOOL_NAMES.includes(toolName as PromQLToolName);
