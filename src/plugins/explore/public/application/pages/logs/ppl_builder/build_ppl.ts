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
  WhereFilter,
  emptyState,
  nextAggId,
  nextFilterId,
} from './types';

export type BuilderAction =
  | { type: 'SET_SEARCH_EXPRESSION'; searchExpression: string }
  | { type: 'ADD_FILTER'; filter?: Partial<WhereFilter> }
  | { type: 'SET_FILTER'; index: number; filter: Partial<WhereFilter> }
  | { type: 'REMOVE_FILTER'; index: number }
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
    case 'ADD_FILTER':
      return {
        ...state,
        filters: [
          ...state.filters,
          { id: nextFilterId(), field: '', operator: 'is', values: [], ...action.filter },
        ],
      };
    case 'SET_FILTER': {
      const filters = [...state.filters];
      filters[action.index] = { ...filters[action.index], ...action.filter };
      return { ...state, filters };
    }
    case 'REMOVE_FILTER':
      return {
        ...state,
        filters: state.filters.filter((_, i) => i !== action.index),
      };
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

export function sortableColumns(state: PPLBuilderState): string[] {
  if (state.aggregations.length === 0) return [];
  const metrics = state.aggregations.map(compileAggregation).filter((c): c is string => c !== null);
  return [...metrics, ...state.groupBy.fields.filter(Boolean)];
}

function quoteSortColumn(column: string): string {
  return /[()]/.test(column) ? `\`${column}\`` : column;
}

function compileSort(sort: Sort | undefined): string | null {
  if (!sort) return null;
  const column = sort.column?.trim();
  if (!column) return null;
  const prefix = sort.desc ? '-' : '';
  return `sort ${prefix}${quoteSortColumn(column)}`;
}

function compileValidSort(state: PPLBuilderState): string | null {
  if (!state.sort?.column?.trim()) return null;
  if (state.aggregations.length > 0 && !sortableColumns(state).includes(state.sort.column)) {
    return null;
  }
  return compileSort(state.sort);
}

function whereField(field: string): string {
  return `\`${field.replace(/\.keyword$/, '')}\``;
}

const NUMERIC_LITERAL_RE = /^-?\d+(\.\d+)?$/;

function whereValue(value: string): string {
  const trimmed = value.trim();
  if (NUMERIC_LITERAL_RE.test(trimmed)) return trimmed;
  return `'${trimmed.replace(/'/g, "''")}'`;
}

export function compileWhereFilter(filter: WhereFilter): string | null {
  const field = filter.field?.trim();
  if (!field) return null;
  const fq = whereField(field);
  const vals = (filter.values ?? []).map((v) => (v ?? '').trim());

  switch (filter.operator) {
    // The empty string is a real, indexable value (the value picker surfaces it
    // as "(empty)"), so equality operators guard on a value being present rather
    // than truthy — otherwise selecting (empty) would silently drop the clause.
    case 'is':
      return vals.length > 0 ? `${fq} = ${whereValue(vals[0])}` : null;
    case 'is_not':
      return vals.length > 0 ? `${fq} != ${whereValue(vals[0])}` : null;
    case 'is_one_of': {
      if (vals.length === 0) return null;
      return vals.map((v) => `${fq} = ${whereValue(v)}`).join(' OR ');
    }
    case 'is_not_one_of': {
      if (vals.length === 0) return null;
      return vals.map((v) => `${fq} != ${whereValue(v)}`).join(' AND ');
    }
    case 'is_between': {
      const [gte, lt] = vals;
      const parts: string[] = [];
      if (gte) parts.push(`${fq} >= ${whereValue(gte)}`);
      if (lt) parts.push(`${fq} < ${whereValue(lt)}`);
      return parts.length > 0 ? parts.join(' AND ') : null;
    }
    case 'is_not_between': {
      const [gte, lt] = vals;
      const parts: string[] = [];
      if (gte) parts.push(`${fq} < ${whereValue(gte)}`);
      if (lt) parts.push(`${fq} >= ${whereValue(lt)}`);
      return parts.length > 0 ? parts.join(' OR ') : null;
    }
    case 'exists':
      return `ISNOTNULL(${fq})`;
    case 'not_exists':
      return `ISNULL(${fq})`;
    default:
      return null;
  }
}

export function buildPPL(state: PPLBuilderState): string {
  const searchExpr = (state.searchExpression || '').trim();

  const parts: string[] = searchExpr ? [searchExpr] : [];

  for (const filter of state.filters) {
    const predicate = compileWhereFilter(filter);
    if (predicate) parts.push(`where ${predicate}`);
  }

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

  if (parts.length > 0 && !searchExpr) {
    return `| ${parts.join(' | ')}`;
  }
  return parts.join(' | ');
}
