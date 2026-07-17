/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { parsePPL, parseWherePredicate } from './parse_ppl';
import { buildPPL } from './build_ppl';
import { PPLBuilderState, WhereFilter } from './types';

// Normalize away builder-generated ids so round-trip comparisons are stable.
const stripIds = (state: PPLBuilderState) => ({
  searchExpression: state.searchExpression,
  filters: state.filters.map(({ id, ...rest }) => rest),
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

  it.each<[string, string]>([
    // The source clause is always dropped; the search expression is captured verbatim.
    ['a plain source with no search expression', ''],
    ['a field-comparison search expression', 'service="web-store"'],
    ['a boolean search expression', 'status>=500 AND service="web-store"'],
    // The compact `field=value` form emitted by the add-filter path.
    ["the compact field='value' form", "service='web'"],
    ['a full-text search term', 'ERROR'],
  ])('captures %s (source dropped)', (_label, expr) => {
    const result = parsePPL(`source = logs ${expr}`.trim());
    expect(result.canBuild).toBe(true);
    expect(result.state.searchExpression).toBe(expr);
  });

  it('parses stats count by span', () => {
    const result = parsePPL('source = logs | stats count() by span(@timestamp, 1m)');
    expect(result.canBuild).toBe(true);
    expect(stripIds(result.state).aggregations).toEqual([{ fn: 'count' }]);
    expect(result.state.groupBy.span).toEqual({ field: '@timestamp', interval: '1m', auto: false });
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

  it.each<[string, string, PPLBuilderState['sort']]>([
    [
      'a trailing sort on a group-by field (ascending by default)',
      'source = logs | stats count() by service | sort service',
      { column: 'service', desc: false },
    ],
    [
      'a descending sort on a back-quoted aggregation column',
      'source = logs | stats count() by service | sort -`count()`',
      { column: 'count()', desc: true },
    ],
    [
      'a trailing `desc` keyword as descending',
      'source = logs | stats avg(bytes) by service | sort service desc',
      { column: 'service', desc: true },
    ],
  ])('parses %s', (_label, query, sort) => {
    const result = parsePPL(query);
    expect(result.canBuild).toBe(true);
    expect(result.state.sort).toEqual(sort);
  });
});

describe('parseWherePredicate', () => {
  const strip = (p: string) => {
    const f = parseWherePredicate(p);
    return f && { field: f.field, operator: f.operator, values: f.values };
  };

  it.each<[string, Pick<WhereFilter, 'field' | 'operator' | 'values'>]>([
    ["`response` = '200'", { field: 'response', operator: 'is', values: ['200'] }],
    ['`response` != 200', { field: 'response', operator: 'is_not', values: ['200'] }],
    [
      '`status` = 200 OR `status` = 404',
      { field: 'status', operator: 'is_one_of', values: ['200', '404'] },
    ],
    [
      "`m` != 'GET' AND `m` != 'POST'",
      { field: 'm', operator: 'is_not_one_of', values: ['GET', 'POST'] },
    ],
    [
      '`bytes` >= 1 AND `bytes` < 9',
      { field: 'bytes', operator: 'is_between', values: ['1', '9'] },
    ],
    [
      '`bytes` < 1 OR `bytes` >= 9',
      { field: 'bytes', operator: 'is_not_between', values: ['1', '9'] },
    ],
    // A range with only one bound compiles to a lone comparison; it must map
    // back to a partial is_between so the query stays representable in Builder.
    ['`bytes` >= 10', { field: 'bytes', operator: 'is_between', values: ['10', ''] }],
    ['`bytes` < 500', { field: 'bytes', operator: 'is_between', values: ['', '500'] }],
    ['ISNOTNULL(`user`)', { field: 'user', operator: 'exists', values: [] }],
    ['ISNULL(`user`)', { field: 'user', operator: 'not_exists', values: [] }],
    // Back-quoted field names holding characters outside the bare-identifier
    // charset (spaces, dots-with-spaces, #, ...) must parse back — whereField
    // always back-quotes, so these are shapes the builder itself emits.
    ["`geo.city name` = 'NYC'", { field: 'geo.city name', operator: 'is', values: ['NYC'] }],
    [
      '`weird#hash` >= 1 AND `weird#hash` < 9',
      { field: 'weird#hash', operator: 'is_between', values: ['1', '9'] },
    ],
    ['ISNOTNULL(`my field`)', { field: 'my field', operator: 'exists', values: [] }],
    // A back-quoted field name that itself contains AND/OR must not be split as
    // a boolean operator.
    ["`a AND b` = 'x'", { field: 'a AND b', operator: 'is', values: ['x'] }],
  ])('parses %s', (predicate, expected) => {
    expect(strip(predicate)).toEqual(expected);
  });

  it.each([
    // Mixed AND/OR, cross-field comparison, and an arbitrary function.
    ['mixed AND/OR', '`a` = 1 AND `b` = 2 OR `c` = 3'],
    ['cross-field comparison', '`a` = `b`'],
    ['arbitrary function', 'LIKE(`a`, "x%")'],
  ])('returns null for %s (a shape the builder cannot model)', (_label, predicate) => {
    expect(parseWherePredicate(predicate)).toBeNull();
  });
});

describe('parsePPL — where filters', () => {
  it('parses a leading where filter into state.filters', () => {
    const result = parsePPL("source = logs | where `response` = '200'");
    expect(result.canBuild).toBe(true);
    expect(result.state.filters).toHaveLength(1);
    expect(result.state.filters[0]).toMatchObject({
      field: 'response',
      operator: 'is',
      values: ['200'],
    });
  });

  it('parses multiple where filters before a stats clause', () => {
    const result = parsePPL(
      'source = logs | where `response` = 500 | where ISNOTNULL(`user`) | stats count() by service'
    );
    expect(result.canBuild).toBe(true);
    expect(result.state.filters.map((f) => f.operator)).toEqual(['is', 'exists']);
    expect(result.state.aggregations).toHaveLength(1);
  });

  it.each([
    ['a where the builder cannot model', 'source = logs | where `a` = 1 AND `b` = 2 OR `c` = 3'],
    // Post-aggregation filter.
    ['a where after stats', 'source = logs | stats count() by service | where `count()` > 5'],
  ])('falls back to code mode for %s', (_label, query) => {
    expect(parsePPL(query).canBuild).toBe(false);
  });
});

describe('parsePPL / buildPPL round-trip', () => {
  const cases: PPLBuilderState[] = [
    {
      searchExpression: 'service="web-store"',
      filters: [],
      aggregations: [],
      groupBy: { fields: [] },
    },
    {
      searchExpression: 'level!="DEBUG" AND timeout',
      filters: [],
      aggregations: [],
      groupBy: { fields: [] },
    },
    {
      searchExpression: 'status>=500',
      filters: [],
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: [], span: { field: '@timestamp', interval: '1m', auto: false } },
    },
    {
      searchExpression: '',
      filters: [],
      aggregations: [{ id: 'a', fn: 'avg', field: 'bytes' }],
      groupBy: { fields: ['service'] },
    },
    // Expanded aggregation functions.
    {
      searchExpression: '',
      filters: [],
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
      filters: [],
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
      filters: [],
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
      filters: [],
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
      filters: [],
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'count()', desc: true },
    },
    // Ascending sort on a group-by field.
    {
      searchExpression: 'ERROR',
      filters: [],
      aggregations: [{ id: 'a', fn: 'avg', field: 'bytes' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'service', desc: false },
    },
    // Sort on raw rows (no aggregation) — its own pipe operation.
    {
      searchExpression: 'ERROR',
      filters: [],
      aggregations: [],
      groupBy: { fields: [] },
      sort: { column: 'bytes', desc: true },
    },
    // A single `is` filter compiled to a `where` stage.
    {
      searchExpression: '',
      filters: [{ id: 'f1', field: 'response', operator: 'is', values: ['200'] }],
      aggregations: [],
      groupBy: { fields: [] },
    },
    // Multiple filters, string value with a quote to escape.
    {
      searchExpression: 'ERROR',
      filters: [
        { id: 'f1', field: 'service', operator: 'is_not', values: ["o'brien"] },
        { id: 'f2', field: 'status', operator: 'is_one_of', values: ['200', '404'] },
      ],
      aggregations: [],
      groupBy: { fields: [] },
    },
    // is_not_one_of + exists.
    {
      searchExpression: '',
      filters: [
        { id: 'f1', field: 'method', operator: 'is_not_one_of', values: ['GET', 'POST'] },
        { id: 'f2', field: 'user', operator: 'exists', values: [] },
      ],
      aggregations: [],
      groupBy: { fields: [] },
    },
    // Range filters + not_exists.
    {
      searchExpression: '',
      filters: [
        { id: 'f1', field: 'bytes', operator: 'is_between', values: ['100', '500'] },
        { id: 'f2', field: 'latency', operator: 'is_not_between', values: ['10', '20'] },
        { id: 'f3', field: 'agent', operator: 'not_exists', values: [] },
      ],
      aggregations: [],
      groupBy: { fields: [] },
    },
    // Field names with characters outside the bare-identifier charset. These
    // are back-quoted on emit and must parse back across every operator.
    {
      searchExpression: '',
      filters: [
        { id: 'f1', field: 'geo.city name', operator: 'is', values: ['NYC'] },
        { id: 'f2', field: 'field:colon', operator: 'is_not', values: ['x'] },
        { id: 'f3', field: 'req/path', operator: 'is_one_of', values: ['/a', '/b'] },
        { id: 'f4', field: 'weird#hash', operator: 'is_between', values: ['1', '9'] },
        { id: 'f5', field: 'my field', operator: 'exists', values: [] },
      ],
      aggregations: [],
      groupBy: { fields: [] },
    },
    // One-sided range filters: only min set, then only max set. Each compiles
    // to a lone comparison but must round-trip back to a partial is_between.
    {
      searchExpression: '',
      filters: [{ id: 'f1', field: 'bytes', operator: 'is_between', values: ['10', ''] }],
      aggregations: [],
      groupBy: { fields: [] },
    },
    {
      searchExpression: '',
      filters: [{ id: 'f1', field: 'bytes', operator: 'is_between', values: ['', '500'] }],
      aggregations: [],
      groupBy: { fields: [] },
    },
    // Filters combined with a stats + sort.
    {
      searchExpression: 'ERROR',
      filters: [{ id: 'f1', field: 'response', operator: 'is', values: ['500'] }],
      aggregations: [{ id: 'a', fn: 'count' }],
      groupBy: { fields: ['service'] },
      sort: { column: 'count()', desc: true },
    },
    // Aggregation on a dash-bearing field: must back-quote on emit so it does
    // not reparse as `response - time` (subtraction) and disable the builder.
    {
      searchExpression: '',
      filters: [],
      aggregations: [{ id: 'a', fn: 'avg', field: 'response-time' }],
      groupBy: { fields: [] },
    },
    // Dash-bearing field group-by + span, with a scalar-wrapped metric.
    {
      searchExpression: '',
      filters: [],
      aggregations: [
        {
          id: 'a',
          fn: 'max',
          field: 'response-time',
          functions: [{ id: 'abs', name: 'abs', params: [] }],
        },
      ],
      groupBy: {
        fields: ['host-name'],
        span: { field: 'event-time', interval: '1m', auto: false },
      },
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
