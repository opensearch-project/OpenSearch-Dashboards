/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildPPL, builderReducer, compileWhereFilter, sortableColumns } from './build_ppl';
import { Aggregation, PPLBuilderState, WhereFilter, emptyState } from './types';

const state = (over: Partial<PPLBuilderState>): PPLBuilderState => ({ ...emptyState(), ...over });
const agg = (over: Partial<Aggregation>): Aggregation => ({ id: 'a', fn: 'count', ...over });

describe('buildPPL', () => {
  it.each<[string, PPLBuilderState, string]>([
    ['returns an empty string when the state is empty', emptyState(), ''],
    [
      'emits just the search expression (no source clause)',
      state({ searchExpression: 'service="web-store"' }),
      'service="web-store"',
    ],
    [
      'emits a boolean search expression verbatim',
      state({ searchExpression: 'status>=500 AND service="web-store"' }),
      'status>=500 AND service="web-store"',
    ],
    [
      'combines a search expression with a stats clause',
      state({
        searchExpression: 'ERROR',
        aggregations: [agg({})],
        groupBy: { fields: [], span: { field: '@timestamp', interval: '1m', auto: true } },
      }),
      'ERROR | stats count() by span(@timestamp, 1m)',
    ],
    [
      'leads a stats-only query with a pipe so the source clause prepends cleanly',
      state({ aggregations: [agg({})] }),
      '| stats count()',
    ],
    [
      'compiles agg with field and group-by fields (stats-only, leading pipe)',
      state({
        aggregations: [agg({ fn: 'avg', field: 'bytes' })],
        groupBy: { fields: ['service'] },
      }),
      '| stats avg(bytes) by service',
    ],
    [
      'injects the time span into the group-by',
      state({
        aggregations: [agg({})],
        groupBy: { fields: [], span: { field: '@timestamp', interval: '1m', auto: true } },
      }),
      '| stats count() by span(@timestamp, 1m)',
    ],
    [
      'combines fields and span in the group-by',
      state({
        aggregations: [agg({})],
        groupBy: {
          fields: ['service'],
          span: { field: '@timestamp', interval: '5m', auto: false },
        },
      }),
      '| stats count() by service, span(@timestamp, 5m)',
    ],
    [
      'compiles percentile',
      state({ aggregations: [agg({ fn: 'percentile', field: 'latency', percentile: 95 })] }),
      '| stats percentile(latency, 95)',
    ],
    [
      'back-quotes an aggregation field with a dash so it does not parse as subtraction',
      state({ aggregations: [agg({ fn: 'avg', field: 'response-time' })] }),
      '| stats avg(`response-time`)',
    ],
    [
      'back-quotes dash-bearing group-by and span fields',
      state({
        aggregations: [agg({})],
        groupBy: {
          fields: ['host-name'],
          span: { field: 'event-time', interval: '5m', auto: false },
        },
      }),
      '| stats count() by `host-name`, span(`event-time`, 5m)',
    ],
    [
      'compiles the expanded aggregation functions',
      state({
        aggregations: [
          agg({ id: 'a', fn: 'distinct_count', field: 'user.id' }),
          agg({ id: 'b', fn: 'median', field: 'latency' }),
          agg({ id: 'c', fn: 'stddev_samp', field: 'bytes' }),
          agg({ id: 'd', fn: 'var_pop', field: 'bytes' }),
        ],
      }),
      '| stats distinct_count(user.id), median(latency), stddev_samp(bytes), var_pop(bytes)',
    ],
    [
      'wraps the field in a single scalar function',
      state({
        aggregations: [
          agg({ fn: 'avg', field: 'latency', functions: [{ id: 'abs', name: 'abs', params: [] }] }),
        ],
      }),
      '| stats avg(abs(latency))',
    ],
    [
      'nests a scalar chain innermost-first with extra params',
      state({
        aggregations: [
          agg({
            fn: 'avg',
            field: 'latency',
            functions: [
              { id: 'round', name: 'round', params: ['1'] },
              { id: 'abs', name: 'abs', params: [] },
            ],
          }),
        ],
      }),
      '| stats avg(abs(round(latency, 1)))',
    ],
    [
      'drops blank trailing scalar params',
      state({
        aggregations: [
          agg({
            fn: 'max',
            field: 'latency',
            functions: [{ id: 'round', name: 'round', params: [''] }],
          }),
        ],
      }),
      '| stats max(round(latency))',
    ],
    [
      'applies a scalar function to a percentile field argument',
      state({
        aggregations: [
          agg({
            fn: 'percentile',
            field: 'latency',
            percentile: 90,
            functions: [{ id: 'round', name: 'round', params: [] }],
          }),
        ],
      }),
      '| stats percentile(round(latency), 90)',
    ],
    [
      'appends a descending sort on an aggregation column, back-quoted',
      state({
        aggregations: [agg({})],
        groupBy: { fields: ['service'] },
        sort: { column: 'count()', desc: true },
      }),
      '| stats count() by service | sort -`count()`',
    ],
    [
      'appends an ascending sort on a bare group-by field',
      state({
        aggregations: [agg({})],
        groupBy: { fields: ['service'] },
        sort: { column: 'service', desc: false },
      }),
      '| stats count() by service | sort service',
    ],
    [
      // `avg(bytes)` was removed; the dangling sort must not be emitted.
      'drops a sort whose column is no longer produced by the query',
      state({
        aggregations: [agg({})],
        groupBy: { fields: ['service'] },
        sort: { column: 'avg(bytes)', desc: true },
      }),
      '| stats count() by service',
    ],
    [
      'sorts raw search rows by a field when the query does not aggregate',
      state({ searchExpression: 'ERROR', sort: { column: 'service', desc: true } }),
      'ERROR | sort -service',
    ],
    [
      'leads a sort-only query with a pipe so the source clause prepends cleanly',
      state({ sort: { column: 'timestamp', desc: false } }),
      '| sort timestamp',
    ],
  ])('%s', (_label, input, expected) => {
    expect(buildPPL(input)).toBe(expected);
  });
});

describe('compileWhereFilter', () => {
  const f = (over: Partial<WhereFilter>): WhereFilter => ({
    id: 'f',
    field: 'response',
    operator: 'is',
    values: [],
    ...over,
  });

  it.each<[string, Partial<WhereFilter>, string | null]>([
    ['is with a quoted string value', { operator: 'is', values: ['ok'] }, "`response` = 'ok'"],
    [
      'is_not with a quoted string value',
      { operator: 'is_not', values: ['ok'] },
      "`response` != 'ok'",
    ],
    ['a bare numeric value unquoted', { operator: 'is', values: ['200'] }, '`response` = 200'],
    [
      'escapes single quotes in a string value',
      { field: 'user', operator: 'is', values: ["o'brien"] },
      "`user` = 'o''brien'",
    ],
    [
      'drops the .keyword suffix from the field',
      { field: 'service.keyword', operator: 'is', values: ['web'] },
      "`service` = 'web'",
    ],
    [
      'is_one_of',
      { operator: 'is_one_of', values: ['200', '404'] },
      '`response` = 200 OR `response` = 404',
    ],
    [
      'is_not_one_of',
      { operator: 'is_not_one_of', values: ['200', '404'] },
      '`response` != 200 AND `response` != 404',
    ],
    [
      'is_between',
      { field: 'bytes', operator: 'is_between', values: ['1', '9'] },
      '`bytes` >= 1 AND `bytes` < 9',
    ],
    [
      'is_not_between',
      { field: 'bytes', operator: 'is_not_between', values: ['1', '9'] },
      '`bytes` < 1 OR `bytes` >= 9',
    ],
    ['exists', { field: 'user', operator: 'exists', values: [] }, 'ISNOTNULL(`user`)'],
    ['not_exists', { field: 'user', operator: 'not_exists', values: [] }, 'ISNULL(`user`)'],
    // Incomplete filters are skipped (like a fieldless metric).
    ['incomplete: empty field', { field: '', operator: 'is', values: ['x'] }, null],
    ['incomplete: no value', { operator: 'is', values: [] }, null],
    ['incomplete: empty is_one_of', { operator: 'is_one_of', values: [] }, null],
    // The empty string is a real, indexable value.
    ['empty-string is', { operator: 'is', values: [''] }, "`response` = ''"],
    ['empty-string is_not', { operator: 'is_not', values: [''] }, "`response` != ''"],
    [
      'empty-string in is_one_of',
      { operator: 'is_one_of', values: ['', '200'] },
      "`response` = '' OR `response` = 200",
    ],
    ['empty-string is_not_one_of', { operator: 'is_not_one_of', values: [''] }, "`response` != ''"],
  ])('compiles %s', (_label, over, expected) => {
    expect(compileWhereFilter(f(over))).toBe(expected);
  });

  describe('type-aware value quoting', () => {
    it('keeps a numeric-looking value quoted on a string field', () => {
      const getType = () => 'string';
      expect(compileWhereFilter(f({ field: 'zip', operator: 'is', values: ['02101'] }), getType)).toBe(
        "`zip` = '02101'"
      );
    });

    it('leaves a numeric value unquoted on a number field', () => {
      const getType = () => 'number';
      expect(
        compileWhereFilter(f({ field: 'response', operator: 'is', values: ['200'] }), getType)
      ).toBe('`response` = 200');
    });

    it('quotes numeric-looking values on a string field across list operators', () => {
      const getType = () => 'string';
      expect(
        compileWhereFilter(f({ field: 'code', operator: 'is_one_of', values: ['200', '404'] }), getType)
      ).toBe("`code` = '200' OR `code` = '404'");
    });

    it('quotes numeric-looking range bounds on a string field', () => {
      const getType = () => 'string';
      expect(
        compileWhereFilter(f({ field: 'code', operator: 'is_between', values: ['1', '9'] }), getType)
      ).toBe("`code` >= '1' AND `code` < '9'");
    });

    it('falls back to value-shaped quoting when the field type is unknown', () => {
      const getType = () => undefined;
      expect(
        compileWhereFilter(f({ field: 'response', operator: 'is', values: ['200'] }), getType)
      ).toBe('`response` = 200');
    });

    it('resolves types by the field name after the .keyword suffix is stripped', () => {
      const getType = (field: string) => (field === 'service' ? 'string' : undefined);
      expect(
        compileWhereFilter(f({ field: 'service.keyword', operator: 'is', values: ['200'] }), getType)
      ).toBe("`service` = '200'");
    });
  });
});

describe('buildPPL — where filters', () => {
  it('emits each filter as its own where stage before stats', () => {
    expect(
      buildPPL(
        state({
          searchExpression: 'ERROR',
          filters: [
            { id: 'f1', field: 'response', operator: 'is', values: ['500'] },
            { id: 'f2', field: 'user', operator: 'exists', values: [] },
          ],
          aggregations: [agg({})],
          groupBy: { fields: ['service'] },
        })
      )
    ).toBe('ERROR | where `response` = 500 | where ISNOTNULL(`user`) | stats count() by service');
  });

  it('leads with a pipe when a where filter has no search expression', () => {
    expect(
      buildPPL(
        state({ filters: [{ id: 'f1', field: 'response', operator: 'is', values: ['200'] }] })
      )
    ).toBe('| where `response` = 200');
  });

  it('skips incomplete filters', () => {
    expect(
      buildPPL(
        state({
          searchExpression: 'ERROR',
          filters: [{ id: 'f1', field: '', operator: 'is', values: [] }],
        })
      )
    ).toBe('ERROR');
  });
});

describe('sortableColumns', () => {
  it('is empty when the query does not aggregate', () => {
    expect(sortableColumns(state({ searchExpression: 'ERROR' }))).toEqual([]);
  });

  it('lists metrics first, then group-by fields (the time span is excluded)', () => {
    expect(
      sortableColumns(
        state({
          aggregations: [agg({ id: 'a' }), agg({ id: 'b', fn: 'avg', field: 'bytes' })],
          groupBy: {
            fields: ['service'],
            span: { field: '@timestamp', interval: '1m', auto: true },
          },
        })
      )
    ).toEqual(['count()', 'avg(bytes)', 'service']);
  });
});

describe('builderReducer', () => {
  it('sets the search expression', () => {
    const next = builderReducer(emptyState(), {
      type: 'SET_SEARCH_EXPRESSION',
      searchExpression: 'status>=500',
    });
    expect(next.searchExpression).toBe('status>=500');
  });

  it('adds an aggregation defaulting to count', () => {
    expect(builderReducer(emptyState(), { type: 'ADD_AGGREGATION' }).aggregations[0].fn).toBe(
      'count'
    );
  });

  it('removes an aggregation by index', () => {
    let next = builderReducer(emptyState(), { type: 'ADD_AGGREGATION' });
    next = builderReducer(next, { type: 'ADD_AGGREGATION', agg: { fn: 'avg', field: 'b' } });
    next = builderReducer(next, { type: 'REMOVE_AGGREGATION', index: 0 });
    expect(next.aggregations).toHaveLength(1);
    expect(next.aggregations[0].fn).toBe('avg');
  });

  it('adds, edits, and removes a scalar function on an aggregation', () => {
    let next = builderReducer(emptyState(), {
      type: 'ADD_AGGREGATION',
      agg: { fn: 'avg', field: 'latency' },
    });
    next = builderReducer(next, {
      type: 'ADD_FUNCTION',
      index: 0,
      fn: { id: 'round', name: 'round', params: [''] },
    });
    expect(next.aggregations[0].functions).toEqual([{ id: 'round', name: 'round', params: [''] }]);

    next = builderReducer(next, {
      type: 'SET_FUNCTION_PARAM',
      index: 0,
      fnIndex: 0,
      paramIndex: 0,
      value: '2',
    });
    expect(next.aggregations[0].functions?.[0].params).toEqual(['2']);

    next = builderReducer(next, { type: 'REMOVE_FUNCTION', index: 0, fnIndex: 0 });
    expect(next.aggregations[0].functions).toEqual([]);
  });

  it('ignores function actions targeting a missing aggregation', () => {
    expect(
      builderReducer(emptyState(), {
        type: 'ADD_FUNCTION',
        index: 5,
        fn: { id: 'abs', name: 'abs', params: [] },
      }).aggregations
    ).toEqual([]);
  });

  it('sets and removes the span', () => {
    let next = builderReducer(emptyState(), {
      type: 'SET_SPAN',
      span: { field: '@timestamp', interval: '1m', auto: true },
    });
    expect(next.groupBy.span?.interval).toBe('1m');
    next = builderReducer(next, { type: 'REMOVE_SPAN' });
    expect(next.groupBy.span).toBeUndefined();
  });

  it('sets and removes the sort', () => {
    let next = builderReducer(emptyState(), {
      type: 'SET_SORT',
      sort: { column: 'count()', desc: true },
    });
    expect(next.sort).toEqual({ column: 'count()', desc: true });
    next = builderReducer(next, { type: 'REMOVE_SORT' });
    expect(next.sort).toBeUndefined();
  });

  it('adds a filter defaulting to an empty `is`', () => {
    const next = builderReducer(emptyState(), { type: 'ADD_FILTER' });
    expect(next.filters).toHaveLength(1);
    expect(next.filters[0]).toMatchObject({ field: '', operator: 'is', values: [] });
    expect(next.filters[0].id).toBeTruthy();
  });

  it('adds a filter with an initial payload', () => {
    const next = builderReducer(emptyState(), {
      type: 'ADD_FILTER',
      filter: { field: 'response', operator: 'is', values: ['200'] },
    });
    expect(next.filters[0]).toMatchObject({ field: 'response', operator: 'is', values: ['200'] });
  });

  it('edits a filter by index without touching its id', () => {
    let next = builderReducer(emptyState(), {
      type: 'ADD_FILTER',
      filter: { field: 'response', operator: 'is', values: ['200'] },
    });
    const { id } = next.filters[0];
    next = builderReducer(next, {
      type: 'SET_FILTER',
      index: 0,
      filter: { operator: 'is_not', values: ['404'] },
    });
    expect(next.filters[0]).toEqual({ id, field: 'response', operator: 'is_not', values: ['404'] });
  });

  it('removes a filter by index', () => {
    let next = builderReducer(emptyState(), {
      type: 'ADD_FILTER',
      filter: { field: 'a', operator: 'is', values: ['1'] },
    });
    next = builderReducer(next, {
      type: 'ADD_FILTER',
      filter: { field: 'b', operator: 'is', values: ['2'] },
    });
    next = builderReducer(next, { type: 'REMOVE_FILTER', index: 0 });
    expect(next.filters).toHaveLength(1);
    expect(next.filters[0].field).toBe('b');
  });
});
