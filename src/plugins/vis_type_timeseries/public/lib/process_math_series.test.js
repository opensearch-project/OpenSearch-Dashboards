/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { evaluateMathExpressions } from './process_math_series';

describe('process_math_series - evaluateMathExpressions', () => {
  let panel;
  let response;

  beforeEach(() => {
    panel = {
      id: 'panel-1',
      series: [
        {
          id: 'series-1',
          label: 'Math Series',
          color: '#FF0000',
          chart_type: 'line',
          line_width: 1,
          fill: 0.5,
          point_size: 0,
          stacked: false,
          metrics: [
            {
              id: 'metric-a',
              type: 'avg',
              field: 'cpu',
            },
            {
              id: 'metric-b',
              type: 'min',
              field: 'cpu',
            },
            {
              id: 'math-1',
              type: 'math',
              script: 'params.a / params.b',
              variables: [
                { name: 'a', field: 'metric-a' },
                { name: 'b', field: 'metric-b' },
              ],
            },
          ],
        },
      ],
    };
  });

  describe('Basic math evaluation', () => {
    beforeEach(() => {
      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              label: 'Avg CPU',
              data: [
                [1000, 100],
                [2000, 200],
              ],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:metric-b',
              label: 'Min CPU',
              data: [
                [1000, 50],
                [2000, 100],
              ],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };
    });

    test('should evaluate simple division expression', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series).toHaveLength(1);
      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1',
          label: 'Math Series',
          color: '#FF0000',
          data: [
            [1000, 2], // 100 / 50 = 2
            [2000, 2], // 200 / 100 = 2
          ],
          // Decoration properties are also included
          seriesId: 'series-1',
          stack: false,
          lines: expect.objectContaining({
            show: true,
            fill: 0.5,
            lineWidth: 1,
          }),
        })
      );
    });

    test('should evaluate addition expression', () => {
      panel.series[0].metrics[2].script = 'params.a + params.b';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 150], // 100 + 50 = 150
        [2000, 300], // 200 + 100 = 300
      ]);
    });

    test('should evaluate subtraction expression', () => {
      panel.series[0].metrics[2].script = 'params.a - params.b';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 50], // 100 - 50 = 50
        [2000, 100], // 200 - 100 = 100
      ]);
    });

    test('should evaluate multiplication expression', () => {
      panel.series[0].metrics[2].script = 'params.a * params.b';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 5000], // 100 * 50 = 5000
        [2000, 20000], // 200 * 100 = 20000
      ]);
    });

    test('should evaluate complex expressions', () => {
      panel.series[0].metrics[2].script = '(params.a + params.b) / 2';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 75], // (100 + 50) / 2 = 75
        [2000, 150], // (200 + 100) / 2 = 150
      ]);
    });
  });

  describe('Division by zero handling', () => {
    beforeEach(() => {
      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              data: [
                [1000, 100],
                [2000, 200],
              ],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:metric-b',
              data: [
                [1000, 0], // Division by zero
                [2000, 100],
              ],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };
    });

    test('should return null for division by zero', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, null], // Division by zero returns null
        [2000, 2],
      ]);
    });
  });

  describe('Null value handling', () => {
    beforeEach(() => {
      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              data: [
                [1000, null],
                [2000, 200],
              ],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:metric-b',
              data: [
                [1000, 50],
                [2000, null],
              ],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };
    });

    test('should return null when any input is null', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, null], // params.a is null
        [2000, null], // params.b is null
      ]);
    });
  });

  describe('params._* special variables', () => {
    beforeEach(() => {
      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              data: [
                [1000, 10],
                [2000, 20],
              ],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:metric-b',
              data: [
                [1000, 5],
                [2000, 5],
              ],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };
    });

    test('should provide params._index', () => {
      panel.series[0].metrics[2].script = 'params._index';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 0], // First index
        [2000, 1], // Second index
      ]);
    });

    test('should provide params._timestamp', () => {
      panel.series[0].metrics[2].script = 'params._timestamp';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 1000], // Timestamp
        [2000, 2000], // Timestamp
      ]);
    });

    test('should provide params._interval', () => {
      panel.series[0].metrics[2].script = 'params._interval / 1000';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 10], // bucketSize * 1000 = 10000, divided by 1000 = 10
        [2000, 10],
      ]);
    });

    test('should provide params._all with values and use size function', () => {
      // Test that _all is available and contains expected arrays
      panel.series[0].metrics[2].script = 'size(params._all.a.values)';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 2], // Two values in the array
        [2000, 2], // Two values in the array
      ]);
    });

    test('should provide params._all with timestamps and use size function', () => {
      panel.series[0].metrics[2].script = 'size(params._all.a.timestamps)';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 2], // Two timestamps in the array
        [2000, 2], // Two timestamps in the array
      ]);
    });

    test('should use params._* in complex expressions', () => {
      panel.series[0].metrics[2].script = 'params.a + params._index';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 10], // 10 + 0 = 10
        [2000, 21], // 20 + 1 = 21
      ]);
    });
  });

  describe('Multiple series handling', () => {
    beforeEach(() => {
      panel.series.push({
        id: 'series-2',
        label: 'Non-Math Series',
        metrics: [
          {
            id: 'metric-c',
            type: 'avg',
            field: 'memory',
          },
        ],
      });

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              data: [[1000, 100]],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:metric-b',
              data: [[1000, 50]],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-2',
              label: 'Memory',
              data: [[1000, 75]],
            },
          ],
        },
      };
    });

    test('should evaluate math series and preserve non-math series', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series).toHaveLength(2);

      // Math series
      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1',
          label: 'Math Series',
          color: '#FF0000',
          data: [[1000, 2]],
        })
      );

      // Non-math series preserved
      expect(result['panel-1'].series[1]).toEqual({
        id: 'series-2',
        label: 'Memory',
        data: [[1000, 75]],
      });
    });
  });

  describe('Metric ID matching', () => {
    test('should correctly match series IDs with exact metric ID suffix', () => {
      // This tests the fix for substring matching bug in componentSeries lookup
      // Using UUID-style IDs that might contain similar patterns
      panel.series[0].metrics = [
        { id: 'abc-123', type: 'avg' },
        { id: 'abc-456', type: 'max' },
        {
          id: 'math-1',
          type: 'math',
          script: 'params.a + params.b',
          variables: [
            { name: 'a', field: 'abc-123' },
            { name: 'b', field: 'abc-456' },
          ],
        },
      ];

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:abc-123',
              data: [[1000, 10]],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:abc-456',
              data: [[1000, 50]],
              meta: { bucketSize: 60 },
            },
            // This series ID contains 'abc-123' but shouldn't match
            {
              id: 'series-1:abc-123-extra',
              data: [[1000, 999]],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const result = evaluateMathExpressions(response, panel);

      // Should correctly use abc-123=10 and abc-456=50, not the wrong series
      expect(result['panel-1'].series[0].data).toEqual([[1000, 60]]); // 10 + 50 = 60
    });
  });

  describe('Edge cases', () => {
    test('should return original response if panel data is missing', () => {
      const emptyResponse = {};
      const result = evaluateMathExpressions(emptyResponse, panel);

      expect(result).toEqual(emptyResponse);
    });

    test('should return original response if series is missing', () => {
      const responseWithoutSeries = {
        'panel-1': {},
      };
      const result = evaluateMathExpressions(responseWithoutSeries, panel);

      expect(result).toEqual(responseWithoutSeries);
    });

    test('should return empty data if no component series found', () => {
      response = {
        'panel-1': {
          series: [],
        },
      };

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1',
          label: 'Math Series',
          data: [],
        })
      );
    });

    test('should handle empty variables array', () => {
      panel.series[0].metrics[2].variables = [];

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              data: [[1000, 100]],
            },
          ],
        },
      };

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1',
          label: 'Math Series',
          data: [],
        })
      );
    });

    test('should use default label when label is missing', () => {
      delete panel.series[0].label;

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:metric-a',
              data: [[1000, 100]],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:metric-b',
              data: [[1000, 50]],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].label).toBe('Math');
    });
  });

  describe('Non-math series filtering', () => {
    beforeEach(() => {
      panel.series = [
        {
          id: 'series-1',
          metrics: [
            {
              id: 'metric-a',
              type: 'avg',
            },
          ],
        },
      ];

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1',
              label: 'Non-Math',
              data: [[1000, 100]],
            },
          ],
        },
      };
    });

    test('should preserve non-math series unchanged', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series).toEqual([
        {
          id: 'series-1',
          label: 'Non-Math',
          data: [[1000, 100]],
        },
      ]);
    });
  });

  describe('Split by terms math series', () => {
    // Regression test: a math metric on a series split by terms/filters. The raw
    // endpoint returns one component series per split bucket with ids of the form
    // `${seriesId}:${splitKey}:${metricId}`. The evaluator must group by split and
    // emit one math series per bucket, mirroring the server-side mathAgg. Before the
    // fix, the exact-match lookup `s.id === seriesId:metricId` found nothing for split
    // series, collapsing the panel to a single empty series (TSVB rendered no data).
    beforeEach(() => {
      panel.series = [
        {
          id: 'series-1',
          label: 'Temperature',
          color: '#0000FF',
          chart_type: 'line',
          line_width: 1,
          fill: '0',
          point_size: '1',
          stacked: 'none',
          split_mode: 'terms',
          terms_field: 'sensor_name.keyword',
          metrics: [
            { id: 'metric-a', type: 'avg', field: 'sensor_temperature' },
            {
              id: 'math-1',
              type: 'math',
              script: 'params.temp * 0.1',
              variables: [{ name: 'temp', field: 'metric-a' }],
            },
          ],
        },
      ];

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:Sensor-A:metric-a',
              label: 'Sensor-A',
              data: [
                [1000, 200],
                [2000, 210],
              ],
              meta: { bucketSize: 600 },
            },
            {
              id: 'series-1:Sensor-B:metric-a',
              label: 'Sensor-B',
              data: [
                [1000, 150],
                [2000, 160],
              ],
              meta: { bucketSize: 600 },
            },
          ],
        },
      };
    });

    test('should emit one evaluated math series per split bucket', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series).toHaveLength(2);

      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1:Sensor-A',
          label: 'Sensor-A',
          data: [
            [1000, 20], // 200 * 0.1
            [2000, 21], // 210 * 0.1
          ],
        })
      );

      expect(result['panel-1'].series[1]).toEqual(
        expect.objectContaining({
          id: 'series-1:Sensor-B',
          label: 'Sensor-B',
          data: [
            [1000, 15], // 150 * 0.1
            [2000, 16], // 160 * 0.1
          ],
        })
      );
    });

    test('should not leave any raw component series in the output', () => {
      const result = evaluateMathExpressions(response, panel);

      const ids = result['panel-1'].series.map((s) => s.id);
      expect(ids).not.toContain('series-1:Sensor-A:metric-a');
      expect(ids).not.toContain('series-1:Sensor-B:metric-a');
    });

    test('should default color to undefined for opensearchDashboards split mode (client maps by label)', () => {
      // With split_color_mode "opensearchDashboards" the server returns no per-term
      // color (getSplitColors yields []), so component series have no color and the
      // client palette maps colors by label. This matches the server-side data flow.
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0].color).toBeUndefined();
      expect(result['panel-1'].series[1].color).toBeUndefined();
    });

    test('should preserve per-split colors when the server assigns them (rainbow/gradient)', () => {
      // For rainbow/gradient split color modes the raw endpoint sets an explicit
      // color on each component series. Each evaluated math series should carry the
      // color of its own split bucket, matching the server-side mathAgg output.
      response['panel-1'].series[0].color = '#68BC00';
      response['panel-1'].series[1].color = '#009CE0';

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({ id: 'series-1:Sensor-A', color: '#68BC00' })
      );
      expect(result['panel-1'].series[1]).toEqual(
        expect.objectContaining({ id: 'series-1:Sensor-B', color: '#009CE0' })
      );
    });
  });

  describe('Percentile values as math variables', () => {
    // A math metric whose variable references a percentile value, e.g. params.p95.
    // The server (percentileRaw) emits component series with ids of the form
    // `${seriesId}:${metricId}[${value}]`, matching the variable field exactly, so
    // the client resolves them directly. Before percentileRaw + token lookup, the
    // percentile component was never produced/matched and the series rendered empty.
    beforeEach(() => {
      panel.series = [
        {
          id: 'series-1',
          label: 'P95 ratio',
          color: '#FF0000',
          chart_type: 'line',
          line_width: 1,
          fill: '0',
          point_size: '0',
          stacked: 'none',
          metrics: [
            { id: 'pct-1', type: 'percentile', field: 'latency', percentiles: [{ value: 95 }] },
            {
              id: 'math-1',
              type: 'math',
              script: 'params.p95 / 2',
              variables: [{ name: 'p95', field: 'pct-1[95]' }],
            },
          ],
        },
      ];

      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:pct-1[95]',
              data: [
                [1000, 200],
                [2000, 400],
              ],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };
    });

    test('should resolve a percentile-value math variable', () => {
      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series).toHaveLength(1);
      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1',
          label: 'P95 ratio',
          data: [
            [1000, 100], // 200 / 2
            [2000, 200], // 400 / 2
          ],
        })
      );
    });

    test('should resolve percentile-value math variables split by terms', () => {
      response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:Host-A:pct-1[95]',
              label: 'Host-A',
              data: [[1000, 200]],
              meta: { bucketSize: 10 },
            },
            {
              id: 'series-1:Host-B:pct-1[95]',
              label: 'Host-B',
              data: [[1000, 80]],
              meta: { bucketSize: 10 },
            },
          ],
        },
      };

      const result = evaluateMathExpressions(response, panel);

      expect(result['panel-1'].series.map((s) => [s.id, s.data])).toEqual([
        ['series-1:Host-A', [[1000, 100]]],
        ['series-1:Host-B', [[1000, 40]]],
      ]);
    });
  });
});
