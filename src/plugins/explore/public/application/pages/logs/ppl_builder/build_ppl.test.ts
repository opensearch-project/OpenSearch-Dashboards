/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildPPL, builderReducer, sortableColumns } from './build_ppl';
import { PPLBuilderState, emptyState } from './types';

describe('buildPPL — source-less output', () => {
  it('returns an empty string when the state is empty', () => {
    expect(buildPPL(emptyState())).toBe('');
  });

  it('emits just the search expression (no source clause)', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      searchExpression: 'service="web-store"',
    };
    expect(buildPPL(state)).toBe('service="web-store"');
  });

  it('emits a boolean search expression verbatim', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      searchExpression: 'status>=500 AND service="web-store"',
    };
    expect(buildPPL(state)).toBe('status>=500 AND service="web-store"');
  });

  it('combines a search expression with a stats clause', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      searchExpression: 'ERROR',
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '1m', auto: true } },
    };
    expect(buildPPL(state)).toBe('ERROR | stats count() by span(@timestamp, 1m)');
  });

  it('leads a stats-only query with a pipe so the source clause prepends cleanly', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
    };
    expect(buildPPL(state)).toBe('| stats count()');
  });

  it('compiles agg with field and group-by fields (stats-only, leading pipe)', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'avg', field: 'bytes' }],
      groupBy: { fields: ['service'] },
    };
    expect(buildPPL(state)).toBe('| stats avg(bytes) by service');
  });

  it('injects the time span into the group-by', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '1m', auto: true } },
    };
    expect(buildPPL(state)).toBe('| stats count() by span(@timestamp, 1m)');
  });

  it('combines fields and span in the group-by', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'], span: { field: '@timestamp', interval: '5m', auto: false } },
    };
    expect(buildPPL(state)).toBe('| stats count() by service, span(@timestamp, 5m)');
  });

  it('compiles percentile', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'percentile', field: 'latency', percentile: 95 }],
    };
    expect(buildPPL(state)).toBe('| stats percentile(latency, 95)');
  });

  it('compiles the expanded aggregation functions', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [
        { id: 'a', fn: 'distinct_count', field: 'user.id' },
        { id: 'b', fn: 'median', field: 'latency' },
        { id: 'c', fn: 'stddev_samp', field: 'bytes' },
        { id: 'd', fn: 'var_pop', field: 'bytes' },
      ],
    };
    expect(buildPPL(state)).toBe(
      '| stats distinct_count(user.id), median(latency), stddev_samp(bytes), var_pop(bytes)'
    );
  });

  it('wraps the field in a single scalar function', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [
        {
          id: 'a',
          fn: 'avg',
          field: 'latency',
          functions: [{ id: 'abs', name: 'abs', params: [] }],
        },
      ],
    };
    expect(buildPPL(state)).toBe('| stats avg(abs(latency))');
  });

  it('nests a scalar chain innermost-first with extra params', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [
        {
          id: 'a',
          fn: 'avg',
          field: 'latency',
          functions: [
            { id: 'round', name: 'round', params: ['1'] },
            { id: 'abs', name: 'abs', params: [] },
          ],
        },
      ],
    };
    expect(buildPPL(state)).toBe('| stats avg(abs(round(latency, 1)))');
  });

  it('drops blank trailing scalar params', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [
        {
          id: 'a',
          fn: 'max',
          field: 'latency',
          functions: [{ id: 'round', name: 'round', params: [''] }],
        },
      ],
    };
    expect(buildPPL(state)).toBe('| stats max(round(latency))');
  });

  it('applies a scalar function to a percentile field argument', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [
        {
          id: 'a',
          fn: 'percentile',
          field: 'latency',
          percentile: 90,
          functions: [{ id: 'round', name: 'round', params: [] }],
        },
      ],
    };
    expect(buildPPL(state)).toBe('| stats percentile(round(latency), 90)');
  });

  it('appends a descending sort on an aggregation column, back-quoted', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'count()', desc: true },
    };
    expect(buildPPL(state)).toBe('| stats count() by service | sort -`count()`');
  });

  it('appends an ascending sort on a bare group-by field', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'service', desc: false },
    };
    expect(buildPPL(state)).toBe('| stats count() by service | sort service');
  });

  it('drops a sort whose column is no longer produced by the query', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      // `avg(bytes)` was removed; the dangling sort must not be emitted.
      sort: { column: 'avg(bytes)', desc: true },
    };
    expect(buildPPL(state)).toBe('| stats count() by service');
  });

  it('sorts raw search rows by a field when the query does not aggregate', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      searchExpression: 'ERROR',
      sort: { column: 'service', desc: true },
    };
    expect(buildPPL(state)).toBe('ERROR | sort -service');
  });

  it('leads a sort-only query with a pipe so the source clause prepends cleanly', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      sort: { column: 'timestamp', desc: false },
    };
    expect(buildPPL(state)).toBe('| sort timestamp');
  });
});

describe('sortableColumns', () => {
  it('is empty when the query does not aggregate', () => {
    expect(sortableColumns({ ...emptyState(), searchExpression: 'ERROR' })).toEqual([]);
  });

  it('lists metrics first, then group-by fields', () => {
    const state: PPLBuilderState = {
      ...emptyState(),
      aggregations: [
        { id: 'a', fn: 'count' },
        { id: 'b', fn: 'avg', field: 'bytes' },
      ],
      groupBy: { fields: ['service'], span: { field: '@timestamp', interval: '1m', auto: true } },
    };
    // The time span is intentionally excluded from sortable columns.
    expect(sortableColumns(state)).toEqual(['count()', 'avg(bytes)', 'service']);
  });
});

describe('builderReducer', () => {
  it('sets the search expression', () => {
    const state = builderReducer(emptyState(), {
      type: 'SET_SEARCH_EXPRESSION',
      searchExpression: 'status>=500',
    });
    expect(state.searchExpression).toBe('status>=500');
  });

  it('adds an aggregation defaulting to count', () => {
    const state = builderReducer(emptyState(), { type: 'ADD_AGGREGATION' });
    expect(state.aggregations[0].fn).toBe('count');
  });

  it('removes an aggregation by index', () => {
    let state = builderReducer(emptyState(), { type: 'ADD_AGGREGATION' });
    state = builderReducer(state, { type: 'ADD_AGGREGATION', agg: { fn: 'avg', field: 'b' } });
    state = builderReducer(state, { type: 'REMOVE_AGGREGATION', index: 0 });
    expect(state.aggregations).toHaveLength(1);
    expect(state.aggregations[0].fn).toBe('avg');
  });

  it('adds, edits, and removes a scalar function on an aggregation', () => {
    let state = builderReducer(emptyState(), {
      type: 'ADD_AGGREGATION',
      agg: { fn: 'avg', field: 'latency' },
    });
    state = builderReducer(state, {
      type: 'ADD_FUNCTION',
      index: 0,
      fn: { id: 'round', name: 'round', params: [''] },
    });
    expect(state.aggregations[0].functions).toEqual([{ id: 'round', name: 'round', params: [''] }]);

    state = builderReducer(state, {
      type: 'SET_FUNCTION_PARAM',
      index: 0,
      fnIndex: 0,
      paramIndex: 0,
      value: '2',
    });
    expect(state.aggregations[0].functions?.[0].params).toEqual(['2']);

    state = builderReducer(state, { type: 'REMOVE_FUNCTION', index: 0, fnIndex: 0 });
    expect(state.aggregations[0].functions).toEqual([]);
  });

  it('ignores function actions targeting a missing aggregation', () => {
    const state = builderReducer(emptyState(), {
      type: 'ADD_FUNCTION',
      index: 5,
      fn: { id: 'abs', name: 'abs', params: [] },
    });
    expect(state.aggregations).toEqual([]);
  });

  it('sets and removes the span', () => {
    let state = builderReducer(emptyState(), {
      type: 'SET_SPAN',
      span: { field: '@timestamp', interval: '1m', auto: true },
    });
    expect(state.groupBy.span?.interval).toBe('1m');
    state = builderReducer(state, { type: 'REMOVE_SPAN' });
    expect(state.groupBy.span).toBeUndefined();
  });

  it('sets and removes the sort', () => {
    let state = builderReducer(emptyState(), {
      type: 'SET_SORT',
      sort: { column: 'count()', desc: true },
    });
    expect(state.sort).toEqual({ column: 'count()', desc: true });
    state = builderReducer(state, { type: 'REMOVE_SORT' });
    expect(state.sort).toBeUndefined();
  });
});
