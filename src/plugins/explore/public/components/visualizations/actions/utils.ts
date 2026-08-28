/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const AUTO_VISUALIZATION_TOOL_NAME = 'auto_create_visualization';
export const GET_TRANSFORMATION_SCHEMA_TOOL_NAME = 'get_transformation_schema';

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

function buildChartTypeList(): string {
  return Object.keys(CHART_TYPE_INFO)
    .map((type) => `"${type}"`)
    .join(', ');
}
function buildChartTypeGuide(): string {
  return Object.entries(CHART_TYPE_INFO)
    .map(([type, desc]) => `\n"${type}" — ${desc}`)
    .join('');
}

const CHART_GUIDE =
  '\n\nCHART TYPE GUIDE (choose based on user intent and data shape):' + buildChartTypeGuide();

const VIS_SPEC_PROPERTIES = {
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
      'Optional. The chart type you infer the user most likely wants, based on their input. ' +
      `The chart type must be one of: ${buildChartTypeList()}. ` +
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
      'Optional categorical or numerical field to split/facet the chart by (small multiples). ' +
      'Infer the user most likely wants.',
  },
  timeFieldName: {
    type: 'string',
    description:
      'The time field name of the index (e.g. "@timestamp", "timestamp"). ' +
      'Get this from the index mapping. ' +
      'Required whenever you pass from/to - a time range without it is rejected.',
  },
};

const VIS_SPEC_REQUIRED = ['query', 'indexName', 'columns'];

/**
 * Build the `from`/`to` schema properties for one tool.
 */
const buildTimeRangeProperties = (scope: 'visualization' | 'dashboard') => {
  const placement =
    scope === 'dashboard'
      ? 'Pass this at the top level, NOT inside the visualizations array — one range applies ' +
        'to every panel. '
      : '';

  return {
    from: {
      type: 'string',
      description:
        `${placement}Start of the time range. STRONGLY PREFER OpenSearch date math ` +
        '("now-7d", "now-1h", "now/d") over absolute timestamps: you do not ' +
        'have access to the current date, so any absolute date you compute ' +
        'yourself will be wrong. Map relative phrasing directly — ' +
        '"last 7 days" -> "now-7d", "past hour" -> "now-1h", ' +
        '"yesterday" -> "now-1d/d". Use an ISO 8601 timestamp ONLY when the ' +
        'user states an explicit calendar date. Must be provided together with `to`.',
    },
    to: {
      type: 'string',
      description:
        `${placement}End of the time range. Use "now" for any query about the recent past ` +
        '(this is the common case). Use an ISO 8601 timestamp only when the user ' +
        'states an explicit end date. Must be provided together with `from`.',
    },
  };
};

export const AutoVisMeta = {
  name: AUTO_VISUALIZATION_TOOL_NAME,
  description:
    'Creates a visualization from a PPL query and its result column schema. This tool does NOT ' +
    'execute the query itself — it resolves the axes mapping from the provided columns, renders a ' +
    'chart preview, and provides an editor link.' +
    '\n\nWORKFLOW (follow in order):' +
    '\n1. DATA SOURCE: If more than one data source has already appeared in this conversation ' +
    '(check available_data_sources context), call switch_data_source FIRST so the USER can choose the correct data source. ' +
    'This tool then automatically targets the active data source — you do not pass any data source parameter here.' +
    '\n2. timeFieldName is MANDATORY for time-based queries: If the user request ' +
    'involves any time concept (e.g. "last 7 days", "trends", "over time", "history", ' +
    'time ranges, or time-series analysis), you MUST call the index mapping tool to get the timeFieldName \n' +
    '\n2. Call the pplQueryTool tool with the PPL query to run it and obtain the result column schema.' +
    '\n3. the query must NOT contain time filters — use the from/to parameters to specify the time range, and pass the same from/to you passed to pplQueryTool.' +
    '\n4. from, to and timeFieldName go together: passing a time range without timeFieldName is rejected.' +
    CHART_GUIDE,

  parameters: {
    type: 'object',
    properties: {
      ...VIS_SPEC_PROPERTIES,
      ...buildTimeRangeProperties('visualization'),
    },
    required: VIS_SPEC_REQUIRED,
  },
};
