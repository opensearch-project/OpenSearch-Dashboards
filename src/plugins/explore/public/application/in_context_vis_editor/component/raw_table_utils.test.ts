/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolveRawTable } from './raw_table_utils';
import { RAW_TABLE_FINAL, resolveRawTableRefId } from '../multi_query_builder/utils';

const seriesA = { refId: 'A', rows: [{ cnt: 1 }], fieldSchema: [{ name: 'cnt', type: 'integer' }] };
const seriesB = {
  refId: 'B',
  rows: [{ avg: 2.5 }],
  fieldSchema: [{ name: 'avg', type: 'double' }],
};
const transformedA = {
  refId: 'A',
  rows: [{ cnt: 1, doubled: 2 }],
  fieldSchema: [
    { name: 'cnt', type: 'integer' },
    { name: 'doubled', type: 'integer' },
  ],
};
const pipelineResult = {
  series: [transformedA, seriesB],
  rows: [],
  finalSchema: [],
  steps: [],
};
const mergedResult = { ...pipelineResult, series: [{ ...seriesB, refId: 'A,B' }] };
const visData = {
  transformedData: [{ cnt: 1, Query: 'A' }],
  numericalColumns: [{ name: 'cnt' }],
  categoricalColumns: [{ name: 'Query' }],
  dateColumns: [],
  unknownColumns: [],
} as any;

const names = (table?: { columns: Array<{ name: string }> }) => table?.columns.map((c) => c.name);

describe('resolveRawTable', () => {
  it("shows a query's own result before the transformations", () => {
    const table = resolveRawTable({
      series: [seriesA, seriesB],
      refId: 'A',
      stage: 'before',
      pipelineResult,
    });
    expect(table?.rows).toEqual([{ cnt: 1 }]);
  });

  it("shows a query's series after the transformations", () => {
    const table = resolveRawTable({
      series: [seriesA, seriesB],
      refId: 'A',
      stage: 'after',
      pipelineResult,
    });
    expect(table?.rows).toEqual([{ cnt: 1, doubled: 2 }]);
    expect(names(table)).toEqual(['cnt', 'doubled']);
  });

  it('has no After view for a query merged by a step', () => {
    expect(
      resolveRawTable({
        series: [seriesA, seriesB],
        refId: 'A',
        stage: 'after',
        pipelineResult: mergedResult,
      })
    ).toBeUndefined();
  });

  it('shows the data the vis draws for Final', () => {
    const table = resolveRawTable({
      series: [seriesA, seriesB],
      refId: RAW_TABLE_FINAL,
      stage: 'before',
      pipelineResult,
      visData,
    });
    expect(table?.rows).toEqual([{ cnt: 1, Query: 'A' }]);
    expect(names(table)).toEqual(['cnt', 'Query']);
  });
});

describe('resolveRawTableRefId', () => {
  it('keeps Final with several queries, falls back to the first query with one', () => {
    expect(resolveRawTableRefId([seriesA, seriesB], RAW_TABLE_FINAL)).toBe(RAW_TABLE_FINAL);
    expect(resolveRawTableRefId([seriesA], RAW_TABLE_FINAL)).toBe('A');
    expect(resolveRawTableRefId([seriesA, seriesB], 'C')).toBe('A');
  });
});
