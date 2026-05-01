/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { builderReducer, buildPromQL, emptyFilter, BuilderAction } from './build_promql';
import { BuilderState } from './promql_parser';

const baseState = (): BuilderState => ({
  metric: 'http_requests_total',
  labelFilters: [emptyFilter()],
  operations: [],
});

describe('builderReducer', () => {
  it('sets metric', () => {
    const state = builderReducer(baseState(), { type: 'SET_METRIC', metric: 'up' });
    expect(state.metric).toBe('up');
  });

  it('sets label filter', () => {
    const state = builderReducer(baseState(), {
      type: 'SET_LABEL_FILTER',
      index: 0,
      filter: { label: 'job', value: 'api' },
    });
    expect(state.labelFilters[0].label).toBe('job');
    expect(state.labelFilters[0].value).toBe('api');
  });

  it('adds and removes label filter', () => {
    let state = builderReducer(baseState(), { type: 'ADD_LABEL_FILTER' });
    expect(state.labelFilters).toHaveLength(2);
    state = builderReducer(state, { type: 'REMOVE_LABEL_FILTER', index: 1 });
    expect(state.labelFilters).toHaveLength(1);
  });

  it('adds and removes operation', () => {
    let state = builderReducer(baseState(), {
      type: 'ADD_OPERATION',
      operation: { id: 'sum', name: 'sum', params: [] },
    });
    expect(state.operations).toHaveLength(1);
    state = builderReducer(state, { type: 'REMOVE_OPERATION', index: 0 });
    expect(state.operations).toHaveLength(0);
  });

  it('replaces operation', () => {
    let state = builderReducer(baseState(), {
      type: 'ADD_OPERATION',
      operation: { id: 'sum', name: 'sum', params: [] },
    });
    state = builderReducer(state, {
      type: 'REPLACE_OPERATION',
      index: 0,
      operation: { id: 'avg', name: 'avg', params: [] },
    });
    expect(state.operations[0].id).toBe('avg');
  });

  it('sets operation param', () => {
    let state = builderReducer(baseState(), {
      type: 'ADD_OPERATION',
      operation: { id: 'topk', name: 'topk', params: ['5'] },
    });
    state = builderReducer(state, {
      type: 'SET_OPERATION_PARAM',
      index: 0,
      paramIndex: 0,
      value: '10',
    });
    expect(state.operations[0].params[0]).toBe('10');
  });

  it('sets and removes range', () => {
    let state = builderReducer(baseState(), { type: 'SET_RANGE', range: '5m' });
    expect(state.range).toBe('5m');
    state = builderReducer(state, { type: 'REMOVE_RANGE' });
    expect(state.range).toBeUndefined();
  });

  it('resets state', () => {
    const state = builderReducer(
      { ...baseState(), operations: [{ id: 'sum', name: 'sum', params: [] }] },
      { type: 'RESET' }
    );
    expect(state.metric).toBe('');
    expect(state.operations).toHaveLength(0);
  });

  it('inits state', () => {
    const newState = { ...baseState(), metric: 'up' };
    const state = builderReducer(baseState(), { type: 'INIT', state: newState });
    expect(state.metric).toBe('up');
  });

  it('sets operation grouping', () => {
    let state = builderReducer(baseState(), {
      type: 'ADD_OPERATION',
      operation: { id: 'sum', name: 'sum', params: [] },
    });
    state = builderReducer(state, {
      type: 'SET_OPERATION_GROUPING',
      index: 0,
      grouping: { mode: 'by', labels: ['job'] },
    });
    expect(state.operations[0].grouping).toEqual({ mode: 'by', labels: ['job'] });
  });
});

describe('buildPromQL', () => {
  it('returns empty string for no metric', () => {
    expect(buildPromQL({ metric: '', labelFilters: [emptyFilter()], operations: [] })).toBe('');
  });

  it('builds simple metric', () => {
    expect(buildPromQL(baseState())).toBe('http_requests_total');
  });

  it('builds metric with label filters', () => {
    const state: BuilderState = {
      metric: 'http_requests_total',
      labelFilters: [{ id: 'f1', label: 'job', op: '=', value: 'api' }],
      operations: [],
    };
    expect(buildPromQL(state)).toBe('http_requests_total{job="api"}');
  });

  it('builds metric with range', () => {
    expect(buildPromQL({ ...baseState(), range: '5m' })).toBe('http_requests_total[5m]');
  });

  it('builds aggregation', () => {
    const state: BuilderState = {
      ...baseState(),
      operations: [{ id: 'sum', name: 'sum', params: [] }],
    };
    expect(buildPromQL(state)).toBe('sum(http_requests_total)');
  });

  it('builds aggregation with grouping', () => {
    const state: BuilderState = {
      ...baseState(),
      operations: [
        { id: 'sum', name: 'sum', params: [], grouping: { mode: 'by', labels: ['job'] } },
      ],
    };
    expect(buildPromQL(state)).toBe('sum by (job)(http_requests_total)');
  });

  it('builds rate with range', () => {
    const state: BuilderState = {
      ...baseState(),
      range: '5m',
      operations: [{ id: 'rate', name: 'rate', params: [''] }],
    };
    expect(buildPromQL(state)).toBe('rate(http_requests_total[5m])');
  });

  it('builds binary operation', () => {
    const state: BuilderState = {
      ...baseState(),
      operations: [{ id: 'mul', name: '*', params: ['100'] }],
    };
    expect(buildPromQL(state)).toBe('http_requests_total * 100');
  });

  it('builds topk', () => {
    const state: BuilderState = {
      ...baseState(),
      operations: [{ id: 'topk', name: 'topk', params: ['10'] }],
    };
    expect(buildPromQL(state)).toBe('topk(10, http_requests_total)');
  });

  it('builds histogram_quantile', () => {
    const state: BuilderState = {
      ...baseState(),
      operations: [{ id: 'histogram_quantile', name: 'histogram_quantile', params: ['0.99'] }],
    };
    expect(buildPromQL(state)).toBe('histogram_quantile(0.99, http_requests_total)');
  });

  it('chains multiple operations', () => {
    const state: BuilderState = {
      ...baseState(),
      range: '5m',
      operations: [
        { id: 'rate', name: 'rate', params: [''] },
        { id: 'sum', name: 'sum', params: [], grouping: { mode: 'by', labels: ['job'] } },
      ],
    };
    expect(buildPromQL(state)).toBe('sum by (job)(rate(http_requests_total[5m]))');
  });
});
