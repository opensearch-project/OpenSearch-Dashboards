/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parsePPL } from './parse_ppl';
import { buildPPL } from './build_ppl';
import { PPLBuilderState } from './types';

// Normalize away builder-generated ids so round-trip comparisons are stable.
const stripIds = (state: PPLBuilderState) => ({
  searchExpression: state.searchExpression,
  aggregations: state.aggregations.map(({ id, ...rest }) => rest),
  groupBy: state.groupBy,
  sort: state.sort,
});

describe('parsePPL — canBuild gating', () => {
  it('treats an empty query as buildable/empty', () => {
    const result = parsePPL('');
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe('');
  });

  it('parses a plain source with no search expression', () => {
    const result = parsePPL('source = logs');
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe('');
  });

  it('captures a field-comparison search expression verbatim (source dropped)', () => {
    const result = parsePPL('source = logs service="web-store"');
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe('service="web-store"');
  });

  it('captures a boolean search expression verbatim (source dropped)', () => {
    const result = parsePPL('source = logs status>=500 AND service="web-store"');
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe('status>=500 AND service="web-store"');
  });

  it('round-trips the compact `field=value` form emitted by the add-filter path', () => {
    const result = parsePPL("source = logs service='web'");
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe("service='web'");
  });

  it('captures a full-text search term', () => {
    const result = parsePPL('source = logs ERROR');
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe('ERROR');
  });

  it('parses stats count by span', () => {
    const result = parsePPL('source = logs | stats count() by span(@timestamp, 1m)');
    expect(result.canBuild).toBe(true);
    expect(stripIds(result.state).aggregations).toEqual([{ fn: 'count' }]);
    expect(result.state.groupBy.span).toEqual({
      field: '@timestamp',
      interval: '1m',
      auto: false,
    });
  });

  it('parses a search expression combined with stats', () => {
    const result = parsePPL('source = logs ERROR | stats count() by span(@timestamp, 1m)');
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe('ERROR');
    expect(stripIds(result.state).aggregations).toEqual([{ fn: 'count' }]);
  });

  it('parses avg with a group-by field', () => {
    const result = parsePPL('source = logs | stats avg(bytes) by service');
    expect(result.canBuild).toBe(true);
    expect(stripIds(result.state).aggregations).toEqual([{ fn: 'avg', field: 'bytes' }]);
    expect(result.state.groupBy.fields).toEqual(['service']);
  });

  it('parses percentile', () => {
    const result = parsePPL('source = logs | stats percentile(latency, 95)');
    expect(result.canBuild).toBe(true);
    expect(stripIds(result.state).aggregations).toEqual([
      { fn: 'percentile', field: 'latency', percentile: 95 },
    ]);
  });

  it.each([
    ['sort with a result limit', 'source = logs | stats count() by a | sort 5 a'],
    ['multi-column sort', 'source = logs | stats count() by a, b | sort a, b'],
    ['two sort clauses', 'source = logs | stats count() by a | sort a | sort b'],
    ['dedup command', 'source = logs | dedup field'],
    ['head command', 'source = logs | head 10'],
    ['eval command', 'source = logs | eval x = a + b'],
    ['where command', "source = logs | where a = '1'"],
    ['aliased agg', 'source = logs | stats count() as total'],
    ['stats then more', 'source = logs | stats count() | head 1'],
    // A scalar function the builder doesn't model (multi-field concat) can't be
    // represented as a single-field wrap, so it falls back to code mode.
    ['unmodeled scalar fn', 'source = logs | stats avg(concat(a, b))'],
    ['arithmetic field expr', 'source = logs | stats avg(latency / 1000)'],
  ])('sets canBuild=false for %s', (_label, query) => {
    expect(parsePPL(query).canBuild).toBe(false);
  });

  it('parses the dc alias into distinct_count', () => {
    const result = parsePPL('source = logs | stats dc(user.id)');
    expect(result.canBuild).toBe(true);
    expect(result.state.aggregations[0]).toMatchObject({ fn: 'distinct_count', field: 'user.id' });
  });

  it('parses a bare sort on raw rows (no preceding stats)', () => {
    const result = parsePPL('source = logs ERROR | sort -bytes');
    expect(result.canBuild).toBe(true);
    expect(result.state.aggregations).toEqual([]);
    expect(result.state.searchExpression).toBe('ERROR');
    expect(result.state.sort).toEqual({ column: 'bytes', desc: true });
  });

  it('parses a trailing sort on a group-by field (ascending by default)', () => {
    const result = parsePPL('source = logs | stats count() by service | sort service');
    expect(result.canBuild).toBe(true);
    expect(result.state.sort).toEqual({ column: 'service', desc: false });
  });

  it('parses a descending sort on a back-quoted aggregation column', () => {
    const result = parsePPL('source = logs | stats count() by service | sort -`count()`');
    expect(result.canBuild).toBe(true);
    expect(result.state.sort).toEqual({ column: 'count()', desc: true });
  });

  it('parses a trailing `desc` keyword as descending', () => {
    const result = parsePPL('source = logs | stats avg(bytes) by service | sort service desc');
    expect(result.canBuild).toBe(true);
    expect(result.state.sort).toEqual({ column: 'service', desc: true });
  });
});

describe('parsePPL / buildPPL round-trip', () => {
  const cases: PPLBuilderState[] = [
    {
      searchExpression: 'service="web-store"',
      aggregations: [],
      groupBy: { fields: [] },
    },
    {
      searchExpression: 'level!="DEBUG" AND timeout',
      aggregations: [],
      groupBy: { fields: [] },
    },
    {
      searchExpression: 'status>=500',
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '1m', auto: false } },
    },
    {
      searchExpression: '',
      aggregations: [{ id: 'a', fn: 'avg', field: 'bytes' }],
      groupBy: { fields: ['service'] },
    },
    // Expanded aggregation functions.
    {
      searchExpression: '',
      aggregations: [
        { id: 'a', fn: 'distinct_count', field: 'user.id' },
        { id: 'b', fn: 'median', field: 'latency' },
        { id: 'c', fn: 'stddev_samp', field: 'bytes' },
      ],
      groupBy: { fields: ['service'] },
    },
    // Scalar function wrapping a field.
    {
      searchExpression: '',
      aggregations: [
        {
          id: 'a',
          fn: 'avg',
          field: 'latency',
          functions: [{ id: 'abs', name: 'abs', params: [] }],
        },
      ],
      groupBy: { fields: [] },
    },
    // Scalar chain with an extra param.
    {
      searchExpression: '',
      aggregations: [
        {
          id: 'a',
          fn: 'max',
          field: 'latency',
          functions: [
            { id: 'round', name: 'round', params: ['1'] },
            { id: 'abs', name: 'abs', params: [] },
          ],
        },
      ],
      groupBy: { fields: ['service'] },
    },
    // Scalar function on a percentile field argument.
    {
      searchExpression: '',
      aggregations: [
        {
          id: 'a',
          fn: 'percentile',
          field: 'latency',
          percentile: 90,
          functions: [{ id: 'round', name: 'round', params: [] }],
        },
      ],
      groupBy: { fields: [] },
    },
    // Descending sort on an aggregation column (back-quoted on emit).
    {
      searchExpression: '',
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'count()', desc: true },
    },
    // Ascending sort on a group-by field.
    {
      searchExpression: 'ERROR',
      aggregations: [{ id: 'a', fn: 'avg', field: 'bytes' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'service', desc: false },
    },
    // Sort on raw rows (no aggregation) — its own pipe operation.
    {
      searchExpression: 'ERROR',
      aggregations: [],
      groupBy: { fields: [] },
      sort: { column: 'bytes', desc: true },
    },
  ];

  it.each(cases.map((c, i) => [i, c]))('round-trips case %i', (_i, state) => {
    // buildPPL emits a source-less query; prepend a source clause (as the
    // execution layer does) before reparsing so parsePPL sees a full query.
    const ppl = `source = logs ${buildPPL(state as PPLBuilderState)}`.trim();
    const reparsed = parsePPL(ppl);
    expect(reparsed.canBuild).toBe(true);
    expect(stripIds(reparsed.state)).toEqual(stripIds(state as PPLBuilderState));
  });
});
