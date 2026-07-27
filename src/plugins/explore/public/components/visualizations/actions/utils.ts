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

function buildChartTypeGuide(): string {
  return Object.entries(CHART_TYPE_INFO)
    .map(([type, desc]) => `\n"${type}" — ${desc}`)
    .join('');
}

/**
 * Brief one-liner per transformation type — enough to pick the right one.
 * Full config schema is available on demand via get_transformation_schema.
 */
const TRANSFORMATION_BRIEF: Record<string, string> = {
  limit: 'keep only the first N rows',
  sort_by: 'sort rows by a field ascending or descending',
  filter: 'filter rows where a field matches a condition',
  filter_fields: 'include or exclude specific columns from every row',
  convert_field_type: 'cast one or more fields to a different type',
  group_by: 'group rows by a field and aggregate other fields per group',
  extract_fields: 'flatten a nested object or JSON-string field into top-level columns',
  add_field: 'create a new computed column from existing numerical fields',
};

function buildTransformationBrief(): string {
  return Object.entries(TRANSFORMATION_BRIEF)
    .map(([id, desc]) => `\n"${id}" — ${desc}`)
    .join('');
}

export const AutoVisMeta = {
  name: AUTO_VISUALIZATION_TOOL_NAME,
  description:
    'Creates a visualization from a PPL query and its result column schema. This tool does NOT ' +
    'execute the query itself — it resolves the axes mapping from the provided columns, renders a ' +
    'chart preview, and provides an editor link.' +
    '\n\nWORKFLOW (follow in order):' +
    '\n1. IMPOARTANT: always Call the index mapping tool to look up the timeFieldName; if it exists, pass it in.' +
    '\n2. Call the ppl_execute tool with the PPL query to run it and obtain the result column schema.' +
    '\n3. (Optional) If the user wants data shaping (filtering, sorting, limiting, etc.), ' +
    'decide which transformation types fit, call get_transformation_schema with all needed ' +
    'type ids at once, then pass the filled-in transformations array to this tool.' +
    '\n\nCHART TYPE GUIDE (choose based on user intent and data shape):' +
    buildChartTypeGuide() +
    '\n\nAVAILABLE TRANSFORMATION TYPES (pick one, then call get_transformation_schema for details):' +
    buildTransformationBrief(),

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
          'Optional categorical or numerical field to split/facet the chart by (small multiples). ' +
          'Infer the user most likely wants.',
      },
      timeFieldName: {
        type: 'string',
        description:
          'The time field name of the index (e.g. "@timestamp", "timestamp"). ' +
          'Get this from the index mapping.',
      },
      transformations: {
        type: 'array',
        description:
          'Optional data transformation pipeline applied to query results before rendering. ' +
          'Each step runs in order. Call get_transformation_schema first to get the exact ' +
          'config shape for the transformation type you want to use.',
        items: {
          type: 'object',
          properties: {
            definitionId: {
              type: 'string',
              description:
                'Transformation type id. One of: "limit", "sort_by", "filter", ' +
                '"filter_fields", "convert_field_type", "group_by", "extract_fields", "add_field".',
            },
            config: {
              type: 'object',
              description:
                'Config object for this step. Call get_transformation_schema to get the ' +
                'exact required shape for the chosen definitionId.',
            },
            hide: {
              type: 'boolean',
              description: 'Set to true to disable this step without removing it. Default false.',
            },
          },
          required: ['definitionId', 'config'],
        },
      },
      sampleRow: {
        type: 'object',
        description:
          'Optional. A single data row from the ppl_execute result as a plain key-value object ' +
          '(one entry from the datarows array, with column names as keys). ' +
          'Required when transformations include types that add new columns ' +
          '(for example: add_field, group_by,extract_fields) so the axes mapping can reflect the post-transformation schema. ' +
          'Pass one representative row — the first non-null row is ideal.',
      },
    },
    required: ['query', 'indexName', 'columns'],
  },
};

export const GetTransformationSchemaMeta = {
  name: GET_TRANSFORMATION_SCHEMA_TOOL_NAME,
  description:
    'Returns the complete config schema for one or more transformation types. ' +
    'Call this after deciding which transformations you need from the AVAILABLE TRANSFORMATION TYPES ' +
    'list in auto_create_visualization. You can request multiple schemas in one call — ' +
    'pass all the types you plan to use at once to minimise round trips. ' +
    'Each schema tells you exactly which config fields are required, what values are valid, ' +
    'and how field type affects available options (e.g. filter operators). ' +
    'Use the returned schemas to construct the config objects for the transformations array.',
  parameters: {
    type: 'object',
    properties: {
      definitionIds: {
        type: 'array',
        description:
          'One or more transformation type ids to fetch schemas for. ' +
          'Valid values: "limit", "sort_by", "filter", "filter_fields", ' +
          '"convert_field_type", "group_by", "extract_fields", "add_field".',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
    },
    required: ['definitionIds'],
  },
};
