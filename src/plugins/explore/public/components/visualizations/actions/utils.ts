/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const AUTO_VISUALIZATION_TOOL_NAME = 'auto_create_visualization';

const CHART_TYPE_INFO: Record<string, string> = {
  line: 'trends over time. Use when user asks about trends, changes over time, or time-series',
  bar: 'compare values across categories or time buckets. Use for comparisons, rankings, distributions across groups',
  area: 'stacked/cumulative trends over time. Use for cumulative totals, composition over time',
  pie: 'proportional breakdown of a whole. Use when user asks about proportions, shares, percentages, breakdown',
  scatter: 'correlation between two numerical variables. Use color/size to add dimensions',
  heatmap: 'density or intensity across two categorical dimensions',
  metric: 'single aggregated number, optionally with sparkline. Use for KPIs, totals, counts',
  gauge: 'single value against a threshold range',
  bar_gauge: 'progress bars against threshold range',
  histogram: 'frequency distribution of a numerical field (auto-binned)',
  state_timeline: 'discrete status/value changes over time',
  table: 'raw tabular display',
};

function buildChartTypeGuide(): string {
  return Object.entries(CHART_TYPE_INFO)
    .map(([type, desc]) => `\n"${type}" — ${desc}`)
    .join('');
}

export const AutoVisMeta = {
  name: AUTO_VISUALIZATION_TOOL_NAME,
  description:
    'PURPOSE:\n' +
    'Creates a visualization from a PPL query and its result column schema. This tool does NOT ' +
    'execute the query itself — it resolves the axes mapping from the provided columns, renders a ' +
    'chart preview, and provides an editor link.' +
    '\n\nWORKFLOW (follow in order):' +
    '\n1. Always Call the index mapping tool to look up the timeFieldName; if it exists, pass it in.' +
    '\n2. Call the ppl_execute tool with the PPL query to run it and obtain the result column schema.' +
    '\n\nCHART TYPE GUIDE (choose based on user intent and data shape):' +
    buildChartTypeGuide(),

  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The PPL query to visualize (e.g. "source=flights | stats avg(delay) by carrier"). ' +
          'This must be the same query previously run via ppl_execute.',
      },
      indexName: {
        type: 'string',
        description: 'The index/dataset name to query',
      },
      potentialChartType: {
        type: 'string',
        description:
          'Optional. The chart type you infer the user most likely wants, based on their input ' +
          'The chart type must be on one of: "line", "bar", "area", "pie", "scatter", ' +
          '"heatmap", "metric", "gauge", "histogram", "state_timeline", "table". ' +
          'This is only a hint. Omit it when the user does not imply a specific chart type.',
      },
      columns: {
        type: 'array',
        description:
          'The result column schema returned by ppl execution. Each column has a name and type ' +
          '(e.g. "integer", "keyword", "date", "double", "long", "float", "text", "timestamp"). ' +
          'Used to resolve which chart types and axes mappings are compatible.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Field name' },
            type: {
              type: 'string',
              description: 'Field type from the query result schema',
            },
          },
          required: ['name', 'type'],
        },
      },
      splitField: {
        type: 'string',
        description:
          'Optional categorical or numerical field to split/facet the chart by (small multiples)' +
          'Infer the user most likely wants.',
      },
      timeFieldName: {
        type: 'string',
        description:
          'The time field name of the index (e.g. "@timestamp", "timestamp"). ' +
          'Get this from the index mapping.',
      },
    },
    required: ['query', 'indexName', 'columns'],
  },
};
