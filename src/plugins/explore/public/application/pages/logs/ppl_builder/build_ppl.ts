/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Aggregation,
  GroupBy,
  PPLBuilderState,
  ScalarCall,
  Sort,
  TimeBucket,
  emptyState,
  nextAggId,
} from './types';

export type BuilderAction =
  | { type: 'SET_SEARCH_EXPRESSION'; searchExpression: string }
  | { type: 'ADD_AGGREGATION'; agg?: Partial<Aggregation> }
  | { type: 'SET_AGGREGATION'; index: number; agg: Partial<Aggregation> }
  | { type: 'REMOVE_AGGREGATION'; index: number }
  | { type: 'ADD_FUNCTION'; index: number; fn: ScalarCall }
  | {
      type: 'SET_FUNCTION_PARAM';
      index: number;
      fnIndex: number;
      paramIndex: number;
      value: string;
    }
  | { type: 'REMOVE_FUNCTION'; index: number; fnIndex: number }
  | { type: 'SET_GROUPBY_FIELDS'; fields: string[] }
  | { type: 'SET_SPAN'; span: TimeBucket }
  | { type: 'REMOVE_SPAN' }
  | { type: 'SET_SORT'; sort: Sort }
  | { type: 'REMOVE_SORT' }
  | { type: 'INIT'; state: PPLBuilderState }
  | { type: 'RESET' };

export function builderReducer(state: PPLBuilderState, action: BuilderAction): PPLBuilderState {
  switch (action.type) {
    case 'SET_SEARCH_EXPRESSION':
      return { ...state, searchExpression: action.searchExpression };
    case 'ADD_AGGREGATION':
      return {
        ...state,
        aggregations: [...state.aggregations, { id: nextAggId(), fn: 'count', ...action.agg }],
      };
    case 'SET_AGGREGATION': {
      const aggregations = [...state.aggregations];
      aggregations[action.index] = { ...aggregations[action.index], ...action.agg };
      return { ...state, aggregations };
    }
    case 'REMOVE_AGGREGATION':
      return {
        ...state,
        aggregations: state.aggregations.filter((_, i) => i !== action.index),
      };
    case 'ADD_FUNCTION': {
      const aggregations = [...state.aggregations];
      const agg = aggregations[action.index];
      if (!agg) return state;
      aggregations[action.index] = {
        ...agg,
        functions: [...(agg.functions ?? []), action.fn],
      };
      return { ...state, aggregations };
    }
    case 'SET_FUNCTION_PARAM': {
      const aggregations = [...state.aggregations];
      const agg = aggregations[action.index];
      if (!agg?.functions?.[action.fnIndex]) return state;
      const functions = [...agg.functions];
      const params = [...functions[action.fnIndex].params];
      params[action.paramIndex] = action.value;
      functions[action.fnIndex] = { ...functions[action.fnIndex], params };
      aggregations[action.index] = { ...agg, functions };
      return { ...state, aggregations };
    }
    case 'REMOVE_FUNCTION': {
      const aggregations = [...state.aggregations];
      const agg = aggregations[action.index];
      if (!agg?.functions) return state;
      aggregations[action.index] = {
        ...agg,
        functions: agg.functions.filter((_, i) => i !== action.fnIndex),
      };
      return { ...state, aggregations };
    }
    case 'SET_GROUPBY_FIELDS':
      return { ...state, groupBy: { ...state.groupBy, fields: action.fields } };
    case 'SET_SPAN':
      return { ...state, groupBy: { ...state.groupBy, span: action.span } };
    case 'REMOVE_SPAN': {
      const { span: _span, ...rest } = state.groupBy;
      return { ...state, groupBy: rest };
    }
    case 'SET_SORT':
      return { ...state, sort: action.sort };
    case 'REMOVE_SORT': {
      const { sort: _sort, ...rest } = state;
      return rest;
    }
    case 'INIT':
      return action.state;
    case 'RESET':
      return emptyState();
    default:
      return state;
  }
}

/**
 * Wrap a field expression in its ordered scalar-function chain, innermost first.
 * `functions: [round, abs]` on `latency` -> `abs(round(latency))`. Extra params
 * (e.g. round's decimals) are appended after the wrapped expression. Blank
 * trailing params are dropped so `round(latency)` (no decimals) stays clean.
 */
function applyFunctions(fieldExpr: string, functions?: ScalarCall[]): string {
  let expr = fieldExpr;
  for (const fn of functions ?? []) {
    const extra = fn.params.map((p) => p.trim());
    while (extra.length > 0 && extra[extra.length - 1] === '') extra.pop();
    expr = extra.length > 0 ? `${fn.id}(${expr}, ${extra.join(', ')})` : `${fn.id}(${expr})`;
  }
  return expr;
}

export function compileAggregation(agg: Aggregation): string | null {
  if (agg.fn === 'count') {
    return 'count()';
  }
  if (!agg.field) return null;
  const arg = applyFunctions(agg.field, agg.functions);
  switch (agg.fn) {
    case 'percentile':
      return `percentile(${arg}, ${agg.percentile ?? 95})`;
    case 'distinct_count':
      return `distinct_count(${arg})`;
    default:
      return `${agg.fn}(${arg})`;
  }
}

function compileGroupBy(groupBy: GroupBy): string {
  const parts: string[] = [...groupBy.fields.filter(Boolean)];
  if (groupBy.span) {
    parts.push(`span(${groupBy.span.field}, ${groupBy.span.interval})`);
  }
  return parts.join(', ');
}

/**
 * The output columns of an aggregated query, in display order — the columns a
 * `sort` can target. Metrics come first (their compiled expression, e.g.
 * `count()` / `avg(bytes)` — the exact header PPL emits), then the group-by
 * fields; the time `span` is intentionally omitted (sorting by the time bucket
 * is what the histogram's x-axis already does). Returns `[]` when the query
 * doesn't aggregate, since there's nothing meaningful to sort.
 */
export function sortableColumns(state: PPLBuilderState): string[] {
  if (state.aggregations.length === 0) return [];
  const metrics = state.aggregations.map(compileAggregation).filter((c): c is string => c !== null);
  return [...metrics, ...state.groupBy.fields.filter(Boolean)];
}

/**
 * A sort column that is an aggregation expression (`count()`, `avg(bytes)`)
 * isn't a bare identifier, so PPL's `sort` can only accept it back-quoted — the
 * whole expression read as one column name (which is how it appears in the
 * result header). A plain group-by field is a valid identifier and stays bare.
 */
function quoteSortColumn(column: string): string {
  return /[()]/.test(column) ? `\`${column}\`` : column;
}

/** Compile the trailing `| sort` clause, or null when it targets no column. */
function compileSort(sort: Sort | undefined): string | null {
  const column = sort?.column?.trim();
  if (!column) return null;
  const prefix = sort!.desc ? '-' : '';
  return `sort ${prefix}${quoteSortColumn(column)}`;
}

/**
 * Compile the sort stage only when it targets a valid column. Sort is an
 * independent pipe operation: it can follow a `stats` (sorting the aggregated
 * output) or a bare search (sorting raw rows). When the query aggregates the
 * sort may only reference a produced output column — a stale reference (its
 * metric/field was removed) is dropped rather than emitting an invalid column.
 * Without aggregation any field is a valid sort key.
 */
function compileValidSort(state: PPLBuilderState): string | null {
  if (!state.sort?.column?.trim()) return null;
  if (state.aggregations.length > 0 && !sortableColumns(state).includes(state.sort.column)) {
    return null;
  }
  return compileSort(state.sort);
}

/**
 * Serialize builder state to a **source-less** PPL query — just the user's
 * search expression plus any trailing `| stats … by …`. The leading
 * `source = <index>` clause is deliberately omitted: it is the dataset's
 * concern, hidden from the builder UI, and prepended automatically by the
 * execution layer (`addPPLSourceClause`) when the query is run. This keeps the
 * builder preview and the Code editor showing only what the user typed
 * (e.g. `event.dataset=sample_web_logs`), mirroring how a user types in Code
 * mode.
 */
export function buildPPL(state: PPLBuilderState): string {
  const searchExpr = (state.searchExpression || '').trim();

  const parts: string[] = searchExpr ? [searchExpr] : [];

  if (state.aggregations.length > 0) {
    const aggStr = state.aggregations
      .map(compileAggregation)
      .filter((c): c is string => c !== null)
      .join(', ');
    if (aggStr) {
      let statsClause = `stats ${aggStr}`;
      const by = compileGroupBy(state.groupBy);
      if (by) {
        statsClause += ` by ${by}`;
      }
      parts.push(statsClause);
    }
  }

  const sortClause = compileValidSort(state);
  if (sortClause) parts.push(sortClause);

  // A stats clause with no leading search expression must start with a pipe so
  // that the auto-prepended source clause produces valid PPL
  // (`source = <index> | stats …`, not `source = <index> stats …`).
  if (parts.length > 0 && !searchExpr) {
    return `| ${parts.join(' | ')}`;
  }
  return parts.join(' | ');
}
