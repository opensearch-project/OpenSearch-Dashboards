/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BuilderState,
  LabelFilter,
  Operation,
  OperationGrouping,
  RANGE_FUNCTIONS,
} from './promql_parser';
import { AGGREGATION_IDS } from './operation_categories';

const BINARY_OP_SYMBOLS: Record<string, string> = {
  add: '+',
  sub: '-',
  mul: '*',
  div: '/',
  mod: '%',
  pow: '^',
  eq: '==',
  neq: '!=',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
};

export type BuilderAction =
  | { type: 'SET_METRIC'; metric: string }
  | { type: 'SET_LABEL_FILTER'; index: number; filter: Partial<LabelFilter> }
  | { type: 'ADD_LABEL_FILTER' }
  | { type: 'REMOVE_LABEL_FILTER'; index: number }
  | { type: 'ADD_OPERATION'; operation: Operation }
  | { type: 'REMOVE_OPERATION'; index: number }
  | { type: 'REPLACE_OPERATION'; index: number; operation: Operation }
  | { type: 'SET_OPERATION_PARAM'; index: number; paramIndex: number; value: string }
  | { type: 'SET_OPERATION_GROUPING'; index: number; grouping: OperationGrouping | undefined }
  | { type: 'INIT'; state: BuilderState }
  | { type: 'SET_RANGE'; range: string }
  | { type: 'REMOVE_RANGE' }
  | { type: 'RESET' };

export const emptyFilter = (): LabelFilter => ({ label: '', op: '=', value: '' });

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'SET_METRIC':
      return { ...state, metric: action.metric };
    case 'SET_LABEL_FILTER': {
      const filters = [...state.labelFilters];
      filters[action.index] = { ...filters[action.index], ...action.filter };
      return { ...state, labelFilters: filters };
    }
    case 'ADD_LABEL_FILTER':
      return { ...state, labelFilters: [...state.labelFilters, emptyFilter()] };
    case 'REMOVE_LABEL_FILTER':
      return { ...state, labelFilters: state.labelFilters.filter((_, i) => i !== action.index) };
    case 'ADD_OPERATION':
      return { ...state, operations: [...state.operations, action.operation] };
    case 'REMOVE_OPERATION':
      return { ...state, operations: state.operations.filter((_, i) => i !== action.index) };
    case 'REPLACE_OPERATION': {
      const ops = [...state.operations];
      ops[action.index] = action.operation;
      return { ...state, operations: ops };
    }
    case 'SET_OPERATION_PARAM': {
      const ops = [...state.operations];
      const params = [...ops[action.index].params];
      params[action.paramIndex] = action.value;
      ops[action.index] = { ...ops[action.index], params };
      return { ...state, operations: ops };
    }
    case 'SET_OPERATION_GROUPING': {
      const ops = [...state.operations];
      ops[action.index] = { ...ops[action.index], grouping: action.grouping };
      return { ...state, operations: ops };
    }
    case 'INIT':
      return action.state;
    case 'SET_RANGE':
      return { ...state, range: action.range };
    case 'REMOVE_RANGE': {
      const { range: _, ...rest } = state;
      return rest as BuilderState;
    }
    case 'RESET':
      return { metric: '', labelFilters: [emptyFilter()], operations: [] };
    default:
      return state;
  }
}

function groupingClause(op: Operation): string {
  return op.grouping?.labels?.length
    ? ` ${op.grouping.mode} (${op.grouping.labels.join(', ')})`
    : '';
}

export function buildPromQL(state: BuilderState): string {
  if (!state.metric) return '';

  const matchers = state.labelFilters
    .filter((f) => f.label && f.value)
    .map((f) => `${f.label}${f.op}"${f.value}"`);

  let selector = state.metric;
  if (matchers.length > 0) {
    selector = `${state.metric}{${matchers.join(', ')}}`;
  }

  let expr = selector;
  const hasRangeFunction = state.operations.some((op) => RANGE_FUNCTIONS.has(op.id));
  if (state.range && !hasRangeFunction) {
    expr = `${expr}[${state.range}]`;
  }

  for (const op of state.operations) {
    const rangeInterval = state.range || '';
    if (RANGE_FUNCTIONS.has(op.id)) {
      if (op.id === 'holt_winters') {
        const interval = rangeInterval || op.params[0] || '5m';
        const sf = op.params[1] || '0.5';
        const tf = op.params[2] || '0.5';
        expr = `holt_winters(${expr}[${interval}], ${sf}, ${tf})`;
      } else if (op.id === 'predict_linear') {
        const interval = rangeInterval || op.params[0] || '5m';
        const t = op.params[1] || '3600';
        expr = `predict_linear(${expr}[${interval}], ${t})`;
      } else if (op.id === 'quantile_over_time') {
        const q = op.params[0] || '0.95';
        const interval = rangeInterval || op.params[1] || '5m';
        expr = `quantile_over_time(${q}, ${expr}[${interval}])`;
      } else {
        const interval = rangeInterval || op.params[0] || '5m';
        expr = `${op.id}(${expr}[${interval}])`;
      }
    } else if (op.id === 'label_join') {
      const [dst = '', sep = '', ...srcs] = op.params;
      const srcStr = srcs
        .filter(Boolean)
        .map((s) => `"${s}"`)
        .join(', ');
      expr = `label_join(${expr}, "${dst}", "${sep}"${srcStr ? ', ' + srcStr : ''})`;
    } else if (op.id === 'histogram_fraction') {
      const lower = op.params[0] || '0';
      const upper = op.params[1] || '0.2';
      expr = `histogram_fraction(${lower}, ${upper}, ${expr})`;
    } else if (AGGREGATION_IDS.has(op.id)) {
      expr = `${op.id}${groupingClause(op)}(${expr})`;
    } else if (['topk', 'bottomk'].includes(op.id)) {
      expr = `${op.id}${groupingClause(op)}(${op.params[0] || '5'}, ${expr})`;
    } else if (op.id === 'count_values') {
      expr = `count_values${groupingClause(op)}("${op.params[0] || 'value'}", ${expr})`;
    } else if (op.id === 'quantile') {
      expr = `quantile${groupingClause(op)}(${op.params[0] || '0.95'}, ${expr})`;
    } else if (op.id === 'histogram_quantile') {
      expr = `histogram_quantile(${op.params[0] || '0.95'}, ${expr})`;
    } else if (BINARY_OP_SYMBOLS[op.id]) {
      expr = `${expr} ${BINARY_OP_SYMBOLS[op.id]} ${op.params[0] || '0'}`;
    } else if (op.id === 'label_replace') {
      const [dst = '', replacement = '', src = '', regex = ''] = op.params;
      expr = `label_replace(${expr}, "${dst}", "${replacement}", "${src}", "${regex}")`;
    } else if (op.id === 'literal') {
      expr = op.params[0] || '0';
    } else {
      const paramStr = op.params.length > 0 ? ', ' + op.params.join(', ') : '';
      expr = `${op.id}(${expr}${paramStr})`;
    }
  }

  return expr;
}
