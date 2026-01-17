/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Tool } from '@ag-ui/core';

export enum PromQLToolName {
  SEARCH_PROMETHEUS_METADATA = 'search_prometheus_metadata',
  SEARCH_PROMETHEUS_LABELS = 'search_prometheus_labels',
}

export const PROMQL_FRONTEND_TOOLS: Tool[] = [
  {
    name: PromQLToolName.SEARCH_PROMETHEUS_METADATA,
    description:
      'Search Prometheus metadata. Returns matched metrics with up to 5 label names each. Use this to discover available metrics before writing a PromQL query.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Regex pattern to filter metrics by name.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of metrics to return. Defaults to 20.',
        },
      },
      required: [],
    },
  },
  {
    name: PromQLToolName.SEARCH_PROMETHEUS_LABELS,
    description:
      'Get labels with sample values for specific metrics. Use this tool only if necessary.',
    parameters: {
      type: 'object',
      properties: {
        metricNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of metric names to get labels for.',
        },
      },
      required: ['metricNames'],
    },
  },
];

export const isPromQLMetadataTool = (toolName: string): toolName is PromQLToolName =>
  Object.values(PromQLToolName).includes(toolName as PromQLToolName);
