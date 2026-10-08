/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stdMetricRaw } from './std_metric_raw';

describe('stdMetricRaw(resp, panel, series, meta)', () => {
  let panel;
  let series;
  let resp;

  beforeEach(() => {
    panel = { time_field: 'timestamp' };
    series = {
      chart_type: 'line',
      stacked: false,
      line_width: 1,
      point_size: 1,
      fill: 0,
      color: 'rgb(255, 0, 0)',
      id: 'test',
      split_mode: 'everything',
      metrics: [{ id: 'avgmetric', type: 'avg', field: 'cpu' }],
    };
    resp = {
      aggregations: {
        test: {
          timeseries: {
            buckets: [
              { key: 1, avgmetric: { value: 1 } },
              { key: 2, avgmetric: { value: 2 } },
            ],
          },
        },
      },
    };
  });

  test('calls next when finished', () => {
    const next = jest.fn();
    stdMetricRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
  });

  test('is a no-op for percentile metrics', () => {
    series.metrics[0].type = 'percentile';
    const next = jest.fn((d) => d);
    const results = stdMetricRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
    expect(results).toHaveLength(0);
  });

  test('is a no-op for std_deviation band metrics', () => {
    series.metrics[0].type = 'std_deviation';
    series.metrics[0].mode = 'band';
    const next = jest.fn((d) => d);
    const results = stdMetricRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
    expect(results).toHaveLength(0);
  });

  test('emits a plain (colon-free) id for a regular non-split series', () => {
    // Regression: the non-math branch must NOT append the metric id. A
    // "test:avgmetric" id would be misread downstream as a split bucket.
    const results = stdMetricRaw(resp, panel, series)((r) => r)([]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('test');
    expect(results[0].id).not.toContain(':');
    expect(results[0]).toHaveProperty('label', 'Average of cpu');
    expect(results[0].data).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  test('preserves the split id (series:bucketKey) for a terms split series', () => {
    series.split_mode = 'terms';
    series.terms_field = 'host';
    resp.aggregations.test = {
      buckets: [
        {
          key: 'host-a',
          timeseries: { buckets: [{ key: 1, avgmetric: { value: 5 } }] },
        },
        {
          key: 'host-b',
          timeseries: { buckets: [{ key: 1, avgmetric: { value: 7 } }] },
        },
      ],
    };

    const results = stdMetricRaw(resp, panel, series)((r) => r)([]);
    expect(results.map((r) => r.id)).toEqual(['test:host-a', 'test:host-b']);
    expect(results[0].data).toEqual([[1, 5]]);
    expect(results[1].data).toEqual([[1, 7]]);
  });

  test('emits one component series per non-math metric with a metric-id suffix', () => {
    series.metrics = [
      { id: 'avg-cpu', type: 'avg', field: 'cpu' },
      { id: 'max-cpu', type: 'max', field: 'cpu' },
      {
        id: 'math-1',
        type: 'math',
        script: 'params.a / params.b',
        variables: [
          { name: 'a', field: 'avg-cpu' },
          { name: 'b', field: 'max-cpu' },
        ],
      },
    ];
    resp.aggregations.test.timeseries.buckets = [
      { key: 1, 'avg-cpu': { value: 1 }, 'max-cpu': { value: 10 } },
      { key: 2, 'avg-cpu': { value: 2 }, 'max-cpu': { value: 20 } },
    ];

    const results = stdMetricRaw(resp, panel, series)((r) => r)([]);
    const byId = Object.fromEntries(results.map((r) => [r.id, r.data]));
    expect(Object.keys(byId).sort()).toEqual(['test:avg-cpu', 'test:max-cpu']);
    expect(byId['test:avg-cpu']).toEqual([
      [1, 1],
      [2, 2],
    ]);
    expect(byId['test:max-cpu']).toEqual([
      [1, 10],
      [2, 20],
    ]);
  });
});
