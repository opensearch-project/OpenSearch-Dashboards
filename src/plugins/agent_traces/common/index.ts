/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'agentTraces';
export const PLUGIN_NAME = 'Agent Traces';
export const DEFAULT_COLUMNS_SETTING = 'defaultColumns';
export const SAMPLE_SIZE_SETTING = 'discover:sampleSize';
export const SORT_DEFAULT_ORDER_SETTING = 'discover:sort:defaultOrder';
export const DOC_HIDE_TIME_COLUMN_SETTING = 'doc_table:hideTimeColumn';
export const MODIFY_COLUMNS_ON_SWITCH = 'discover:modifyColumnsOnSwitch';
export const DEFAULT_TRACE_COLUMNS_SETTING = 'explore:defaultTraceColumns';
export const DEFAULT_LOGS_COLUMNS_SETTING = 'explore:defaultLogsColumns';
export const AGENT_TRACES_DEFAULT_LANGUAGE = 'PPL';
export const AGENT_TRACES_TRACES_TAB_ID = 'traces';
export const AGENT_TRACES_SPANS_TAB_ID = 'spans';

export enum AgentTracesFlavor {
  Traces = 'traces',
}

/** Hardcoded default columns for agent traces / spans tables. These are always
 *  present and cannot be removed by the user via the fields sidebar. */
export const AGENT_TRACES_DEFAULT_COLUMNS: readonly string[] = [
  'kind',
  'name',
  'status',
  'latency',
  'totalTokens',
  'input',
  'output',
];

/** Map from virtual column key to its user-facing display name. */
export const AGENT_TRACES_COLUMN_DISPLAY_NAMES: Record<string, string> = {
  kind: 'Kind',
  name: 'Name',
  status: 'Status',
  latency: 'Latency',
  totalTokens: 'Tokens',
  input: 'Input',
  output: 'Output',
};

/** Virtual columns that support sorting in the DataTable. */
export const AGENT_TRACES_SORTABLE_COLUMNS = new Set<string>(['kind', 'name', 'status', 'latency']);

/** Map from virtual column key to the underlying source field(s) used for details/filtering. */
export const AGENT_TRACES_VIRTUAL_COLUMN_SOURCE_FIELDS: Record<string, string> = {
  kind: 'attributes.gen_ai.operation.name',
  status: 'status.code',
  latency: 'durationInNanos',
  input: 'attributes.gen_ai.input.messages',
  output: 'attributes.gen_ai.output.messages',
};
