/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationFullMetadata, VisualizationRegistry } from '../visualization_registry';
import { getAllTransformationDefinitions } from '../../data_transformations';

export const AUTO_VISUALIZATION_TOOL_NAME = 'auto_create_visualization';
export const GET_TRANSFORMATION_SCHEMA_TOOL_NAME = 'get_transformation_schema';

type AvailableTransformationDefinition = ReturnType<typeof getAllTransformationDefinitions>[number];

function buildChartTypeGuide(visualizationFullMetadata: VisualizationFullMetadata[]): string {
  return visualizationFullMetadata
    .map(({ type, name, description }) => `\n"${type}" (${name}) - ${description}`)
    .join('');
}

function buildChartGuide(visualizationFullMetadata: VisualizationFullMetadata[]): string {
  return (
    '\n\nCHART TYPE GUIDE (choose based on user intent and data shape):' +
    buildChartTypeGuide(visualizationFullMetadata)
  );
}

function buildTransformationIdList(definitions: AvailableTransformationDefinition[]): string {
  return definitions.map(({ id }) => `"${id}"`).join(', ');
}

function buildTransformationBrief(definitions: AvailableTransformationDefinition[]): string {
  return definitions.map(({ id, description }) => `\n"${id}" - ${description}`).join('');
}

function buildChartAndTransformationGuide(
  chartTypes: VisualizationFullMetadata[],
  transformations: AvailableTransformationDefinition[]
): string {
  return (
    buildChartGuide(chartTypes) +
    '\n\nAVAILABLE TRANSFORMATION TYPES (pick needed types, then call get_transformation_schema for details):' +
    buildTransformationBrief(transformations)
  );
}

function buildVisSpecProperties(
  chartTypes: VisualizationFullMetadata[],
  transformations: AvailableTransformationDefinition[]
) {
  return {
    query: {
      type: 'string',
      description:
        'The PPL query to visualize (e.g. "source=flights | stats avg(delay) by carrier"). ' +
        'This must be the same query previously run via pplQueryTool.',
    },
    indexName: {
      type: 'string',
      description: 'The index/dataset name to query',
    },
    potentialChartType: {
      type: 'string',
      description:
        'Optional. The chart type you infer the user most likely wants, based on their input. ' +
        'This is only a hint. Omit it when the user does not imply a specific chart type.',
      enum: chartTypes.map(({ type }) => type),
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
        'Do not pass from/to unless you already have timeFieldName. ',
    },
    transformations: {
      type: 'array',
      description:
        'Optional data transformation pipeline applied to query results before rendering. ' +
        `Each step runs in order. You MUST call ${GET_TRANSFORMATION_SCHEMA_TOOL_NAME} first to ` +
        'get the exact config shape for every transformation type you want to use. ' +
        'Do NOT guess config keys or reuse shapes from other APIs: invalid transformation configs ' +
        'are rejected.',
      items: {
        type: 'object',
        properties: {
          definitionId: {
            type: 'string',
            description: `Transformation type id. One of: ${buildTransformationIdList(
              transformations
            )}.`,
          },
          config: {
            type: 'object',
            description:
              `Config object for this step. You MUST obtain this shape from ` +
              `${GET_TRANSFORMATION_SCHEMA_TOOL_NAME} for the chosen definitionId. ` +
              'Only schema-defined keys are accepted.',
          },
          hide: {
            type: 'boolean',
            description: 'Set to true to disable this step without removing it. Default false.',
          },
        },
        required: ['definitionId', 'config'],
      },
    },
  };
}

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

export function createAutoVisMeta(visualizationRegistry: VisualizationRegistry) {
  const visualizationFullMetadata = visualizationRegistry.getVisualizationsFullMetadata();
  const transformations = getAllTransformationDefinitions();

  return {
    name: AUTO_VISUALIZATION_TOOL_NAME,
    description:
      'Creates a visualization preview from a PPL query and its result column schema. This tool does NOT ' +
      'execute the query itself — it resolves the axes mapping from the provided columns, renders a ' +
      'chart preview, and provides an editor link.' +
      '\n\nWORKFLOW (follow in order):' +
      '\n1. DATA SOURCE: If more than one data source has already appeared in this conversation ' +
      '(check available_data_sources context), call switch_data_source FIRST so the USER can choose the correct data source. ' +
      'This tool then automatically targets the active data source — you do not pass any data source parameter here.' +
      '\n2. timeFieldName is MANDATORY for time-based queries: If the user request ' +
      'involves any time concept (e.g. "last 7 days", "trends", "over time", "history", ' +
      'time ranges, or time-series analysis), you MUST call the index mapping tool to get the timeFieldName \n' +
      '\n3. Call the pplQueryTool tool with the PPL query to run it and obtain the result column schema.' +
      '\n4. the query must NOT contain time filters — use the from/to parameters to specify the time range, and pass the same from/to you passed to pplQueryTool.' +
      '\n5. from, to and timeFieldName go together: passing a time range without timeFieldName is rejected.' +
      buildChartGuide(visualizationFullMetadata) +
      '\n6. (Optional) If the user wants data shaping (filtering, sorting, limiting, etc.), ' +
      `decide which transformation types fit, call ${GET_TRANSFORMATION_SCHEMA_TOOL_NAME} with all ` +
      'needed type ids at once, then pass the filled-in transformations array to this tool. ' +
      `You MUST do this before sending any transformations. Do NOT invent config keys. ` +
      '\n\nAVAILABLE TRANSFORMATION TYPES (pick one, then call get_transformation_schema for details):' +
      buildTransformationBrief(transformations) +
      '\n\nAFTER THIS TOOL RUNS: this tool only renders a chart preview inside the chat and does ' +
      'NOT save the visualization or add a panel to any dashboard. Instead, the user needs to ' +
      'click "Open in Editor" and then "Save and back" in the editor to add the panel manually.',

    parameters: {
      type: 'object',
      properties: {
        ...buildVisSpecProperties(visualizationFullMetadata, transformations),
        ...buildTimeRangeProperties('visualization'),
      },
      required: VIS_SPEC_REQUIRED,
    },
  };
}

export const GetTransformationSchemaMeta = {
  name: GET_TRANSFORMATION_SCHEMA_TOOL_NAME,
  description:
    'Returns the complete config schema for one or more transformation types. ' +
    'Call this after deciding which transformations you need from the AVAILABLE TRANSFORMATION TYPES ' +
    'list in auto_create_visualization. You can request multiple schemas in one call — ' +
    'pass all the types you plan to use at once to minimise round trips. ' +
    'Each schema tells you exactly which config fields are required, what values are valid, ' +
    'and how field type affects available options (e.g. filter operators). ' +
    'Use the returned schemas to construct the config objects for the transformations array. ' +
    'Do not guess or rename fields.',
  parameters: {
    type: 'object',
    properties: {
      definitionIds: {
        type: 'array',
        description:
          'One or more transformation type ids to fetch schemas for. ' +
          `Valid values: ${buildTransformationIdList(getAllTransformationDefinitions())}.`,
        items: {
          type: 'string',
        },
        minItems: 1,
      },
    },
    required: ['definitionIds'],
  },
};

export const T2_DASHBOARD_TOOL_NAME = 'text_to_dashboard';

export function createTextToDashboardMeta(visualizationRegistry: VisualizationRegistry) {
  const chartTypes = visualizationRegistry.getVisualizationsFullMetadata();
  const transformations = getAllTransformationDefinitions();

  return {
    name: T2_DASHBOARD_TOOL_NAME,
    description:
      'Creates multiple visualizations from an array of PPL queries and use them to build an ad-hoc dashboard.' +
      'Use this when the user asks for a dashboard or several charts at once.' +
      'WORKFLOW (follow in order):\n' +
      '1. Call the index mapping tool to get timeFieldName for each relevant index.\n' +
      '2. Call pplQueryTool for each query to obtain the column schema.\n' +
      '3. Call this tool with all visualization columns in a single call.\n' +
      '4. Time range is TOP-LEVEL and SHARED: pass from/to AND timeFieldName at the top level (NOT ' +
      'inside the visualizations array) — one range and one time field apply to every panel. Pass ' +
      'the same from/to you passed to pplQueryTool, and the query itself must NOT contain time ' +
      'filters.\n' +
      '5. from, to and timeFieldName travel together. If you pass from/to you MUST also pass a ' +
      'timeFieldName — put it at the top level for the shared case. Only set a per-visualization ' +
      'timeFieldName to OVERRIDE it when that panel queries a different index with a different time ' +
      'field. A spec that ends up with from/to but no timeFieldName (neither top-level nor its own) ' +
      'is rejected.\n' +
      '6. (Optional) If the user wants data shaping (filtering, sorting, limiting, etc.), ' +
      `decide which transformation types fit, call ${GET_TRANSFORMATION_SCHEMA_TOOL_NAME} with all ` +
      'needed type ids at once, then pass the filled-in transformations array to this tool. ' +
      `You MUST do this before sending any transformations. Do NOT invent config keys. ` +
      buildChartAndTransformationGuide(chartTypes, transformations),
    parameters: {
      type: 'object',
      properties: {
        visualizations: {
          type: 'array',
          description:
            'Array of visualization specs. Each spec produces one chart panel on the dashboard. ' +
            'Minimum 1 item. Each item has the same fields as auto_create_visualization except ' +
            'from/to (those are top-level, since the dashboard has one shared time range), plus ' +
            'a required title.',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              ...buildVisSpecProperties(chartTypes, transformations),
              timeFieldName: {
                type: 'string',
                description:
                  'Optional per-panel OVERRIDE of the top-level timeFieldName. Only set this when ' +
                  "this panel's query targets a different index whose time field differs from the " +
                  'shared one. Otherwise omit it and rely on the top-level timeFieldName.',
              },
              title: {
                type: 'string',
                description: 'Human-readable chart title.',
              },
            },
            required: [...VIS_SPEC_REQUIRED, 'title'],
          },
        },
        ...buildTimeRangeProperties('dashboard'),
        timeFieldName: {
          type: 'string',
          description:
            'The SHARED time field name (e.g. "@timestamp", "timestamp") used to apply the top-level ' +
            'from/to range to every panel. Get it from the index mapping tool. You MUST pass this ' +
            'whenever you pass from/to. When panels query different indices whose time fields differ, ' +
            "set this to the common one and override the odd ones via that visualization's own " +
            'timeFieldName.',
        },
      },
      required: ['visualizations'],
    },
  };
}
