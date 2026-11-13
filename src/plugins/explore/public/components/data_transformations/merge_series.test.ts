/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// import { mergeSeries, mergeSeries, SeriesInput } from './merge_series';
import { mergeSeries } from './merge_series';

// const hit = (source: Record<string, unknown>) =>
//   ({ _index: 'i', _id: 'id', _source: source }) as any;
//
// const series = (
//   refId: string,
//   fieldSchema: SeriesInput['fieldSchema'],
//   sources: Array<Record<string, unknown>>,
//   seriesDisplayNames?: Record<string, string>
// ): SeriesInput => ({ refId, fieldSchema, rows: sources.map(hit), seriesDisplayNames });
//
// describe('mergeSeries', () => {
//   it('returns nothing for no series', () => {
//     expect(mergeSeries([])).toEqual({ rows: [], fieldSchema: [] });
//   });
//
//   it('passes a single series through unchanged (no Query column)', () => {
//     const only = series('A', [{ name: 'value', type: 'integer' }], [{ value: 1 }], { a: 'A' });
//     const merged = mergeSeries([only]);
//     expect(merged.rows).toBe(only.rows);
//     expect(merged.fieldSchema).toBe(only.fieldSchema);
//     expect(merged.seriesDisplayNames).toEqual({ a: 'A' });
//   });
//
//   it('stacks rows in query order and tags each with its refId', () => {
//     const schema = [
//       { name: 'timestamp', type: 'timestamp' },
//       { name: 'value', type: 'integer' },
//     ];
//     const merged = mergeSeries([
//       series('A', schema, [{ timestamp: 't1', value: 1 }]),
//       series('B', schema, [
//         { timestamp: 't1', value: 2 },
//         { timestamp: 't2', value: 3 },
//       ]),
//     ]);
//     expect(merged.rows.map((r) => r._source)).toEqual([
//       { timestamp: 't1', value: 1, Query: 'A' },
//       { timestamp: 't1', value: 2, Query: 'B' },
//       { timestamp: 't2', value: 3, Query: 'B' },
//     ]);
//     expect(merged.fieldSchema).toEqual([...schema, { name: 'Query', type: 'string' }]);
//   });
//
//   it('unions different fields; a query lacks the other query fields', () => {
//     const merged = mergeSeries([
//       series('A', [{ name: 'size', type: 'string' }], [{ size: 'S' }]),
//       series('B', [{ name: 'cate', type: 'string' }], [{ cate: 'X' }]),
//     ]);
//     expect(merged.fieldSchema.map((f) => f.name)).toEqual(['size', 'cate', 'Query']);
//     expect(merged.rows.map((r) => r._source)).toEqual([
//       { size: 'S', Query: 'A' },
//       { cate: 'X', Query: 'B' },
//     ]);
//   });
//
//   it('renames a later field with the same name but another type', () => {
//     const merged = mergeSeries([
//       series('A', [{ name: 'value', type: 'integer' }], [{ value: 1 }]),
//       series('B', [{ name: 'value', type: 'string' }], [{ value: 'high' }]),
//     ]);
//     expect(merged.fieldSchema).toEqual([
//       { name: 'value', type: 'integer' },
//       { name: 'value (B)', type: 'string' },
//       { name: 'Query', type: 'string' },
//     ]);
//     expect(merged.rows.map((r) => r._source)).toEqual([
//       { value: 1, Query: 'A' },
//       { 'value (B)': 'high', Query: 'B' },
//     ]);
//   });
//
//   it('keeps PromQL Series and adds Query beside it', () => {
//     const promSchema = [
//       { name: 'Time', type: 'timestamp' },
//       { name: 'Series', type: 'string' },
//       { name: 'Value', type: 'double' },
//     ];
//     const merged = mergeSeries([
//       series('A', promSchema, [{ Time: 't1', Series: 'up{job="a"}', Value: 1 }], { s1: 'a' }),
//       series('B', promSchema, [{ Time: 't1', Series: 'up{job="b"}', Value: 0 }], { s2: 'b' }),
//     ]);
//     expect(merged.rows.map((r) => r._source)).toEqual([
//       { Time: 't1', Series: 'up{job="a"}', Value: 1, Query: 'A' },
//       { Time: 't1', Series: 'up{job="b"}', Value: 0, Query: 'B' },
//     ]);
//     expect(merged.seriesDisplayNames).toEqual({ s1: 'a', s2: 'b' });
//   });
//
//   it('never overwrites a real field named Query', () => {
//     const merged = mergeSeries([
//       series('A', [{ name: 'Query', type: 'string' }], [{ Query: 'select 1' }]),
//       series('B', [{ name: 'Query', type: 'string' }], [{ Query: 'select 2' }]),
//     ]);
//     expect(merged.fieldSchema.map((f) => f.name)).toEqual(['Query', 'Query_1']);
//     expect(merged.rows.map((r) => r._source)).toEqual([
//       { Query: 'select 1', Query_1: 'A' },
//       { Query: 'select 2', Query_1: 'B' },
//     ]);
//   });
// });

describe('mergeSeries', () => {
  const oneSeries = (
    refId: string,
    schema: any[],
    rows: Array<Record<string, unknown>>,
    names?: any
  ) => ({
    refId,
    fieldSchema: schema,
    rows,
    seriesDisplayNames: names,
  });

  it('passes one series through, without a Query column', () => {
    const only = oneSeries('A', [{ name: 'value', type: 'number' }], [{ value: 1 }]);
    expect(mergeSeries([only])).toBe(only);
  });

  it('returns an empty series for none', () => {
    expect(mergeSeries([])).toEqual({ refId: '', rows: [], fieldSchema: [] });
  });

  it('stacks rows in series order and tags each with its refId', () => {
    const merged = mergeSeries([
      oneSeries('A', [{ name: 'v', type: 'number' }], [{ v: 1 }, { v: 2 }]),
      oneSeries('B', [{ name: 'v', type: 'number' }], [{ v: 3 }]),
    ]);

    expect(merged.queryField).toBe('Query');
    expect(merged.rows).toEqual([
      { v: 1, Query: 'A' },
      { v: 2, Query: 'A' },
      { v: 3, Query: 'B' },
    ]);
    expect(merged.fieldSchema).toEqual([
      { name: 'v', type: 'number' },
      { name: 'Query', type: 'string' },
    ]);
  });

  it("unions fields; a series's rows lack the other series' fields", () => {
    const merged = mergeSeries([
      oneSeries('A', [{ name: 'a', type: 'number' }], [{ a: 1 }]),
      oneSeries('B', [{ name: 'b', type: 'string' }], [{ b: 'x' }]),
    ]);

    expect(merged.fieldSchema.map(({ name }) => name)).toEqual(['a', 'b', 'Query']);
    expect(merged.rows).toEqual([
      { a: 1, Query: 'A' },
      { b: 'x', Query: 'B' },
    ]);
  });

  it('keeps a PromQL Series column and adds Query beside it', () => {
    const promql = (refId: string, series: string) =>
      oneSeries(
        refId,
        [
          { name: 'Series', type: 'string' },
          { name: 'Value', type: 'number' },
        ],
        [{ Series: series, Value: 1 }]
      );
    const merged = mergeSeries([promql('A', 'up{job="a"}'), promql('B', 'up{job="b"}')]);

    expect(merged.fieldSchema.map(({ name }) => name)).toEqual(['Series', 'Value', 'Query']);
    expect(merged.rows).toEqual([
      { Series: 'up{job="a"}', Value: 1, Query: 'A' },
      { Series: 'up{job="b"}', Value: 1, Query: 'B' },
    ]);
  });

  it('renames a same-name field of another type and the Query column on a clash', () => {
    const merged = mergeSeries([
      oneSeries(
        'A',
        [
          { name: 'Query', type: 'string' },
          { name: 'v', type: 'number' },
        ],
        [{ Query: 'q', v: 1 }]
      ),
      oneSeries('B', [{ name: 'v', type: 'string' }], [{ v: 'x' }], { s: 'S' }),
    ]);

    expect(merged.queryField).toBe('Query_1');
    expect(merged.rows).toEqual([
      { Query: 'q', v: 1, Query_1: 'A' },
      { 'v (B)': 'x', Query_1: 'B' },
    ]);
    expect(merged.fieldSchema.map(({ name }) => name)).toEqual(['Query', 'v', 'v (B)', 'Query_1']);
    expect(merged.seriesDisplayNames).toEqual({ s: 'S' });
  });
});
