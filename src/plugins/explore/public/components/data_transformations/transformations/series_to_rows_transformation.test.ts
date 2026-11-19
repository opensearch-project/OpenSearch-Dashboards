/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { seriesToRowsMethod } from './series_to_rows_transformation';

describe('seriesToRowsMethod', () => {
  it('turns every series into Time / Metric / Value (design doc example)', () => {
    const result = seriesToRowsMethod([
      {
        refId: 'A',
        rows: [
          { Time: '2019-11-01', Cate1: 'A', value: 20 },
          { Time: '2020-01-01', Cate1: 'B', value: 10 },
        ],
        fieldSchema: [
          { name: 'Time', type: 'date' },
          { name: 'Cate1', type: 'string' },
          { name: 'value', type: 'integer' },
        ],
      },
      {
        refId: 'B',
        rows: [
          { Time: '2019-11-01', Cate2: 'X', value: 40 },
          { Time: '2020-01-01', Cate2: 'Y', value: 30 },
        ],
        fieldSchema: [
          { name: 'Time', type: 'date' },
          { name: 'Cate2', type: 'string' },
          { name: 'value', type: 'integer' },
        ],
      },
    ]);
    expect(result.status).toBe('applied');
    expect(result.series[0].rows).toEqual([
      { Time: '2019-11-01', Metric: 'A', Value: 20 },
      { Time: '2020-01-01', Metric: 'B', Value: 10 },
      { Time: '2019-11-01', Metric: 'X', Value: 40 },
      { Time: '2020-01-01', Metric: 'Y', Value: 30 },
    ]);
    expect(result.series[0].fieldSchema).toEqual([
      { name: 'Time', type: 'date' },
      { name: 'Metric', type: 'string' },
      { name: 'Value', type: 'double' },
    ]);
  });

  it('names the metric after the field, scoped by refId when series share it', () => {
    const s = (refId: string) => ({
      refId,
      rows: [{ Time: 1, count: 3 }],
      fieldSchema: [
        { name: 'Time', type: 'time' },
        { name: 'count', type: 'integer' },
      ],
    });
    const result = seriesToRowsMethod([s('A'), s('B')]);
    expect(result.series[0].rows.map((r) => r.Metric)).toEqual(['count (A)', 'count (B)']);
  });

  it('tags a metric with its refId when several queries produce it', () => {
    const s = (refId: string, field: string) => ({
      refId,
      rows: [
        { ext: 'css', [field]: 1 },
        { ext: 'gz', [field]: 2 },
      ],
      fieldSchema: [
        { name: 'ext', type: 'string' },
        { name: field, type: 'integer' },
      ],
    });
    const result = seriesToRowsMethod([s('A', 'count'), s('B', 'bytes')]);
    expect(result.series[0].rows.map((r) => r.Metric)).toEqual([
      'css (A)',
      'gz (A)',
      'css (B)',
      'gz (B)',
    ]);
  });

  it('is partial when a query has no numeric field', () => {
    const result = seriesToRowsMethod([
      { refId: 'A', rows: [{ v: 1 }], fieldSchema: [{ name: 'v', type: 'integer' }] },
      { refId: 'B', rows: [{ s: 'x' }], fieldSchema: [{ name: 's', type: 'string' }] },
    ]);
    expect(result.status).toBe('partially_applied');
    expect(result.issues[0].code).toBe('missing_fields');
    expect(result.series[0].rows).toEqual([{ Metric: 'v', Value: 1 }]);
  });

  it('skips without numeric fields', () => {
    const result = seriesToRowsMethod([
      { refId: 'A', rows: [{ s: 'x' }], fieldSchema: [{ name: 's', type: 'string' }] },
    ]);
    expect(result.status).toBe('skipped');
  });
});
