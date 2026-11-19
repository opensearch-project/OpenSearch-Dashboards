/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { joinByLabelsMethod } from './join_by_labels_transformation';

const promRow = (Time: number, cluster: string, job: string, Value: number) => ({
  Time,
  Series: `series1{cluster="${cluster}", job="${job}"}`,
  Labels: { cluster, job },
  Value,
});
const schema = [
  { name: 'Time', type: 'time' },
  { name: 'Series', type: 'string' },
  { name: 'Labels', type: 'object' },
  { name: 'Value', type: 'number' },
];

describe('joinByLabelsMethod', () => {
  it('pivots on a label read from the Labels object (design doc example, keeping Time)', () => {
    const result = joinByLabelsMethod(
      [
        {
          refId: 'A',
          rows: [
            promRow(1, 'A', 'J1', 20),
            promRow(2, 'A', 'J1', 10),
            promRow(1, 'B', 'J2', 40),
            promRow(2, 'B', 'J2', 30),
          ],
          fieldSchema: schema,
        },
      ],
      { pivotLabel: 'cluster', rowLabels: ['job'], pivotValue: 'Value' }
    );
    expect(result.status).toBe('applied');
    expect(result.series[0].rows).toEqual([
      { job: 'J1', Time: 1, A: 20 },
      { job: 'J1', Time: 2, A: 10 },
      { job: 'J2', Time: 1, B: 40 },
      { job: 'J2', Time: 2, B: 30 },
    ]);
    expect(result.series[0].fieldSchema.map(({ name }) => name)).toEqual(['job', 'Time', 'A', 'B']);
  });

  it('fills one row per key from several series', () => {
    const result = joinByLabelsMethod(
      [
        { refId: 'A', rows: [promRow(1, 'A', 'J1', 20)], fieldSchema: schema },
        { refId: 'B', rows: [promRow(1, 'B', 'J1', 40)], fieldSchema: schema },
      ],
      { pivotLabel: 'cluster', rowLabels: ['job'], pivotValue: 'Value' }
    );
    expect(result.series[0].rows).toEqual([{ job: 'J1', Time: 1, A: 20, B: 40 }]);
  });

  it('reports values that share a cell (row labels do not tell them apart)', () => {
    const result = joinByLabelsMethod(
      [
        {
          refId: 'A',
          rows: [promRow(1, 'A', 'J1', 20), promRow(1, 'A', 'J2', 30)],
          fieldSchema: schema,
        },
      ],
      { pivotLabel: 'cluster', rowLabels: [], pivotValue: 'Value' }
    );
    expect(result.status).toBe('partially_applied');
    expect(result.issues.map(({ code }) => code)).toEqual(['duplicate_keys']);
    expect(result.series[0].rows).toEqual([{ Time: 1, A: 30 }]);
  });

  it('renames a pivot column that equals a key field, keeping the key', () => {
    const result = joinByLabelsMethod(
      [{ refId: 'A', rows: [promRow(1, 'job', 'J1', 20)], fieldSchema: schema }],
      { pivotLabel: 'cluster', rowLabels: ['job'], pivotValue: 'Value' }
    );
    expect(result.series[0].rows).toEqual([{ job: 'J1', Time: 1, job_1: 20 }]);
    expect(result.series[0].fieldSchema.map(({ name }) => name)).toEqual(['job', 'Time', 'job_1']);
  });

  it('passes through a series without the label', () => {
    const ppl = { refId: 'B', rows: [{ n: 1 }], fieldSchema: [{ name: 'n', type: 'integer' }] };
    const result = joinByLabelsMethod(
      [{ refId: 'A', rows: [promRow(1, 'A', 'J1', 20)], fieldSchema: schema }, ppl],
      { pivotLabel: 'cluster', rowLabels: ['job'], pivotValue: 'Value' }
    );
    expect(result.status).toBe('partially_applied');
    expect(result.series.map(({ refId }) => refId)).toEqual(['A', 'B']);
    expect(result.series[1]).toBe(ppl);
  });

  it('skips when no row has the label, invalid without config', () => {
    const one = [{ refId: 'A', rows: [promRow(1, 'A', 'J1', 1)], fieldSchema: schema }];
    expect(
      joinByLabelsMethod(one, { pivotLabel: 'zone', rowLabels: [], pivotValue: 'Value' }).issues[0]
        .code
    ).toBe('missing_fields');
    expect(
      joinByLabelsMethod(one, { pivotLabel: undefined, rowLabels: [], pivotValue: 'Value' })
        .issues[0].code
    ).toBe('invalid_config');
  });
});
