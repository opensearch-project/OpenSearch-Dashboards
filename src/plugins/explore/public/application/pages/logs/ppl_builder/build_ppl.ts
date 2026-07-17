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

// Return a copy of `arr` with the element at `index` replaced by `patch(current)`.
// Returns the original array unchanged when `patch` yields null (missing target).
function updateAt<T>(arr: T[], index: number, patch: (current: T) => T | null): T[] {
  const next = patch(arr[index]);
  if (next === null) return arr;
  const copy = [...arr];
  copy[index] = next;
  return copy;
}

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
    case 'SET_FILTER':
      return {
        ...state,
        filters: updateAt(state.filters, action.index, (f) => ({ ...f, ...action.filter })),
      };
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
    case 'SET_AGGREGATION':
      return {
        ...state,
        aggregations: updateAt(state.aggregations, action.index, (a) => ({ ...a, ...action.agg })),
      };
    case 'REMOVE_AGGREGATION':
      return {
        ...state,
        aggregations: state.aggregations.filter((_, i) => i !== action.index),
      };
    case 'ADD_FUNCTION':
      return {
        ...state,
        aggregations: updateAt(state.aggregations, action.index, (agg) =>
          agg ? { ...agg, functions: [...(agg.functions ?? []), action.fn] } : null
        ),
      };
    case 'SET_FUNCTION_PARAM':
      return {
        ...state,
        aggregations: updateAt(state.aggregations, action.index, (agg) => {
          if (!agg?.functions?.[action.fnIndex]) return null;
          const functions = updateAt(agg.functions, action.fnIndex, (fn) => {
            const params = [...fn.params];
            params[action.paramIndex] = action.value;
            return { ...fn, params };
          });
          return { ...agg, functions };
        }),
      };
    case 'REMOVE_FUNCTION':
      return {
        ...state,
        aggregations: updateAt(state.aggregations, action.index, (agg) =>
          agg?.functions
            ? { ...agg, functions: agg.functions.filter((_, i) => i !== action.fnIndex) }
            : null
        ),
      };
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

// A bare PPL identifier is a leading letter/underscore/@ followed by word chars,
// dots, or @ (e.g. user.id, @timestamp). Anything else — a dash, a space — would
// parse as an expression (`response-time` reads as subtraction), so back-quote
// it. WHERE fields go through whereField which always back-quotes; aggregation
// and group-by fields quote only when needed so common fields stay unadorned.
const BARE_FIELD_RE = /^[a-zA-Z_@][\w.@]*$/;

function quoteFieldExpr(field: string): string {
  return BARE_FIELD_RE.test(field) ? field : `\`${field}\``;
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
  const arg = applyFunctions(quoteFieldExpr(agg.field), agg.functions);
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
  const parts: string[] = groupBy.fields.filter(Boolean).map(quoteFieldExpr);
  if (groupBy.span) {
    parts.push(`span(${quoteFieldExpr(groupBy.span.field)}, ${groupBy.span.interval})`);
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

function compileValidSort(state: PPLBuilderState): string | null {
  const { sort } = state;
  const column = sort?.column?.trim();
  if (!sort || !column) return null;
  if (state.aggregations.length > 0 && !sortableColumns(state).includes(sort.column)) {
    return null;
  }
  const prefix = sort.desc ? '-' : '';
  return `sort ${prefix}${quoteSortColumn(column)}`;
}

function whereField(field: string): string {
  return `\`${field.replace(/\.keyword$/, '')}\``;
}

// Resolves a filter field name to its OpenSearch type ('number', 'string',
// 'date', ...) so value quoting can respect the mapping. Optional throughout:
// callers that omit it (e.g. round-trip tests) fall back to value-shaped
// quoting, preserving the resolver-free behavior.
export type FieldTypeResolver = (field: string) => string | undefined;

const NUMERIC_LITERAL_RE = /^-?\d+(\.\d+)?$/;

// A bare numeric literal is only safe when the field is actually numeric.
// Emitting `zip = 02101` against a keyword field drops the leading zero and
// compares as a number, matching nothing; quoting keeps it a string literal.
// When the type is unknown (no resolver, or field not in the mapping) we keep
// the legacy value-shaped behavior so nothing regresses.
function whereValue(value: string, fieldType?: string): string {
  const trimmed = value.trim();
  const numericAllowed = fieldType === undefined || fieldType === 'number';
  if (numericAllowed && NUMERIC_LITERAL_RE.test(trimmed)) return trimmed;
  // Double-quote string literals to match the PPL code editor's insert
  // convention (getInsertText in the data plugin), so a value built here reads
  // identically to one completed in code mode. parse_ppl's unquoteValue accepts
  // both quote styles and un-doubles "" → ", keeping the round-trip lossless.
  return `"${trimmed.replace(/"/g, '""')}"`;
}

export function compileWhereFilter(
  filter: WhereFilter,
  getFieldType?: FieldTypeResolver
): string | null {
  const field = filter.field?.trim();
  if (!field) return null;
  const fq = whereField(field);
  // Resolve on the base name (matching whereField's .keyword stripping) so a
  // `service.keyword` filter picks up the `service` mapping type.
  const fieldType = getFieldType?.(field.replace(/\.keyword$/, ''));
  const val = (v: string) => whereValue(v, fieldType);
  const vals = (filter.values ?? []).map((v) => (v ?? '').trim());

  switch (filter.operator) {
    // The empty string is a real, indexable value (the value picker surfaces it
    // as "(empty)"), so equality operators guard on a value being present rather
    // than truthy — otherwise selecting (empty) would silently drop the clause.
    case 'is':
      return vals.length > 0 ? `${fq} = ${val(vals[0])}` : null;
    case 'is_not':
      return vals.length > 0 ? `${fq} != ${val(vals[0])}` : null;
    case 'is_one_of': {
      if (vals.length === 0) return null;
      return vals.map((v) => `${fq} = ${val(v)}`).join(' OR ');
    }
    case 'is_not_one_of': {
      if (vals.length === 0) return null;
      return vals.map((v) => `${fq} != ${val(v)}`).join(' AND ');
    }
    case 'is_between': {
      const [gte, lt] = vals;
      const parts: string[] = [];
      if (gte) parts.push(`${fq} >= ${val(gte)}`);
      if (lt) parts.push(`${fq} < ${val(lt)}`);
      return parts.length > 0 ? parts.join(' AND ') : null;
    }
    case 'is_not_between': {
      const [gte, lt] = vals;
      const parts: string[] = [];
      if (gte) parts.push(`${fq} < ${val(gte)}`);
      if (lt) parts.push(`${fq} >= ${val(lt)}`);
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

export function buildPPL(state: PPLBuilderState, getFieldType?: FieldTypeResolver): string {
  const searchExpr = (state.searchExpression || '').trim();

  const parts: string[] = searchExpr ? [searchExpr] : [];

  for (const filter of state.filters) {
    const predicate = compileWhereFilter(filter, getFieldType);
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
