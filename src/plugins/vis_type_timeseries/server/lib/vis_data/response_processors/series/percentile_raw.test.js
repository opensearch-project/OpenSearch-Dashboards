/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { percentileRaw } from './percentile_raw';

describe('percentileRaw(resp, panel, series)', () => {
  let resp;
  let panel;
  let series;

  beforeEach(() => {
    resp = {
      aggregations: {
        'series-1': {
          meta: { bucketSize: 10, seriesId: 'series-1' },
          timeseries: {
            buckets: [
              { key: 1000, 'pct-1': { values: { '95.0': 200, '50.0': 100 } } },
              { key: 2000, 'pct-1': { values: { '95.0': 400, '50.0': 150 } } },
            ],
          },
        },
      },
    };

    series = {
      id: 'series-1',
      color: '#000000',
      chart_type: 'line',
      line_width: 1,
      fill: 0,
      point_size: 0,
      stacked: 'none',
      metrics: [
        { id: 'pct-1', type: 'percentile', field: 'latency', percentiles: [{ value: 95 }] },
        {
          id: 'math-1',
          type: 'math',
          script: 'params.p95',
          variables: [{ name: 'p95', field: 'pct-1[95]' }],
        },
      ],
    };

    panel = { id: 'panel-1', type: 'timeseries', series: [series] };
  });

  test('emits a percentile component series keyed by the variable field', () => {
    const next = jest.fn((results) => results);
    const results = percentileRaw(resp, panel, series)(next)([]);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(
      expect.objectContaining({
        id: 'series-1:pct-1[95]',
        data: [
          [1000, 200],
          [2000, 400],
        ],
      })
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('emits one component per distinct referenced percentile value', () => {
    series.metrics[1].variables = [
      { name: 'p95', field: 'pct-1[95]' },
      { name: 'p50', field: 'pct-1[50]' },
    ];

    const results = percentileRaw(resp, panel, series)((r) => r)([]);

    const byId = Object.fromEntries(results.map((s) => [s.id, s.data]));
    expect(byId['series-1:pct-1[95]']).toEqual([
      [1000, 200],
      [2000, 400],
    ]);
    expect(byId['series-1:pct-1[50]']).toEqual([
      [1000, 100],
      [2000, 150],
    ]);
  });

  test('is a no-op when the last metric is not math', () => {
    series.metrics = [series.metrics[0]]; // only the percentile metric, no math

    const results = percentileRaw(resp, panel, series)((r) => r)([]);

    expect(results).toEqual([]);
  });

  test('ignores percentile values that are not referenced by the math variables', () => {
    // pct-1 defines [95] but the math only references nothing for it
    series.metrics[1].variables = [{ name: 'x', field: 'some-other-metric' }];

    const results = percentileRaw(resp, panel, series)((r) => r)([]);

    expect(results).toEqual([]);
  });
});
