/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FieldSchema, NormalizedRow } from '../../../components/data_transformations/types';
import type {
  QueryBuilder,
  QueryEditorState,
  QueryResultState,
  QueryState,
} from '../query_builder/query_builder';
import type {
  QueryExecutionStatus,
  QueryResultStatus,
} from '../../../application/utils/state_management/types';

// One row's result in the shape for Visualization
export interface SeriesResult {
  refId: string;
  rows: NormalizedRow[];
  fieldSchema: FieldSchema[];
  seriesDisplayNames?: Record<string, string>;
}

// One visible row's execution status and results
export interface RowExecutionState {
  refId: string;
  status: QueryResultStatus;
  result: QueryResultState;
}

// `_e`: container-level editor state plus each row's editor state.
export interface UrlMultiEditorState {
  selectedRowRefId?: string;
  maxDataPoints?: number;
  rows: Array<UrlRowEntry<UrlRowEditorState>>;
}

export type QueryRows = QueryBuilder[];
export type UrlRowEntry<T> = [refId: string, state: T];
export type UrlRowEditorState = Partial<Pick<QueryEditorState, 'isHidden'>>;

// One row as a list item: hidden / valid per row. for UI display
export interface RowListItem {
  refId: string;
  isHidden: boolean;
  isValid: boolean;
}

export interface AggregateStatus {
  status: QueryExecutionStatus;
  /** Rows that errored; with a READY status the vis still renders the others. */
  failedQueries: Array<{ refId: string; error?: QueryResultStatus['error'] }>;
}

/**
 * A saved row: its query plus whether it's hidden. The saved explore's `queries` attribute is a list of these.
 */
export interface SavedQueryRow {
  refId: string;
  query: QueryState;
  isHidden?: boolean;
}

/**
 * The rows and editor state as saved, reduced so two snapshots compare equal exactly when there's
 * nothing new to save. The vis has its own (see components/visualizations/vis_snapshot).
 */
export type QueriesSnapshot = Record<string, unknown>;
