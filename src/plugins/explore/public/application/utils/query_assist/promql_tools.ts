/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Tool } from '@ag-ui/core';

export enum PromQLToolName {
  SEARCH_PROMETHEUS_METADATA = 'search_prometheus_metadata',
}

export const PROMQL_FRONTEND_TOOLS: Tool[] = [
  {
    name: PromQLToolName.SEARCH_PROMETHEUS_METADATA,
    description:
      // currently multiple tool calls is not supported. see https://github.com/opensearch-project/ml-commons/issues/4548
      'Search Prometheus metadata. Returns matched metrics with their labels and sample label values. Use this to discover available metrics before writing a PromQL query. Only call this tool once.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Pattern to filter metrics by name, supports regex or substring match. Pick the most relevant pattern based on the user question.',
        },
        metricsLimit: {
          type: 'number',
          description: 'Maximum number of metrics to return. Defaults to 20.',
        },
        labelsLimit: {
          type: 'number',
          description: 'Maximum number of labels per metric. Defaults to 20.',
        },
        valuesLimit: {
          type: 'number',
          description: 'Maximum number of sample values per label. Defaults to 5.',
        },
      },
      required: [],
    },
  },
];

export const isPromQLMetadataTool = (toolName: string): toolName is PromQLToolName =>
  Object.values(PromQLToolName).includes(toolName as PromQLToolName);
