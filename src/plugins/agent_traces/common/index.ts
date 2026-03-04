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
