/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stdSiblingRaw } from './std_sibling_raw';

describe('stdSiblingRaw(resp, panel, series, meta)', () => {
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
      metrics: [
        { id: 'avgcpu', type: 'avg', field: 'cpu' },
        { id: 'sib', type: 'std_deviation_bucket', field: 'avgcpu' },
      ],
    };
    resp = {
      aggregations: {
        test: {
          sib: { std_deviation: 0.23 },
          timeseries: {
            buckets: [
              { key: 1, avgcpu: { value: 0.23 } },
              { key: 2, avgcpu: { value: 0.22 } },
            ],
          },
        },
      },
    };
  });

  test('calls next when finished', () => {
    const next = jest.fn();
    stdSiblingRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
  });

  test('is a no-op when the last metric is not a sibling (bucket) aggregation', () => {
    series.metrics = [series.metrics[0]]; // only the avg metric
    const next = jest.fn((d) => d);
    const results = stdSiblingRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
    expect(results).toHaveLength(0);
  });

  test('is a no-op for std_deviation_bucket band metrics', () => {
    series.metrics[1].mode = 'band';
    const next = jest.fn((d) => d);
    const results = stdSiblingRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
    expect(results).toHaveLength(0);
  });

  test('emits a plain (colon-free) id for a regular non-split sibling series', () => {
    // Regression: the non-math branch must NOT append the metric id. A
    // "test:sib" id would be misread downstream as a split bucket.
    const results = stdSiblingRaw(resp, panel, series)((r) => r)([]);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('test');
    expect(results[0].id).not.toContain(':');
    expect(results[0].data).toEqual([
      [1, 0.23],
      [2, 0.23],
    ]);
  });

  test('preserves the split id (series:bucketKey) for a terms split sibling series', () => {
    series.split_mode = 'terms';
    series.terms_field = 'host';
    resp.aggregations.test = {
      buckets: [
        {
          key: 'host-a',
          sib: { std_deviation: 0.1 },
          timeseries: { buckets: [{ key: 1, avgcpu: { value: 0.1 } }] },
        },
        {
          key: 'host-b',
          sib: { std_deviation: 0.2 },
          timeseries: { buckets: [{ key: 1, avgcpu: { value: 0.2 } }] },
        },
      ],
    };

    const results = stdSiblingRaw(resp, panel, series)((r) => r)([]);
    expect(results.map((r) => r.id)).toEqual(['test:host-a', 'test:host-b']);
    expect(results[0].data).toEqual([[1, 0.1]]);
    expect(results[1].data).toEqual([[1, 0.2]]);
  });

  test('is a no-op when the series ends in a math metric (pre-existing gap)', () => {
    // NOTE: The `_bucket$` guard at the top of stdSiblingRaw returns early when
    // the last metric is `math` (type 'math' does not match /_bucket$/), so the
    // sibling-component branch is currently unreachable. A math expression that
    // references a sibling aggregation therefore yields no component series in
    // the raw flow. This is a pre-existing gap from PR #11129, not introduced by
    // the id fix; this test documents the current behavior. See follow-up.
    series.metrics.push({
      id: 'math-1',
      type: 'math',
      script: 'params.a',
      variables: [{ name: 'a', field: 'sib' }],
    });

    const next = jest.fn((d) => d);
    const results = stdSiblingRaw(resp, panel, series)(next)([]);
    expect(next.mock.calls.length).toEqual(1);
    expect(results).toHaveLength(0);
  });
});
