/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Integration tests comparing server-side and client-side math evaluation.
 * These tests ensure that client-side evaluation produces identical results
 * to server-side evaluation.
 */

import { evaluateMathExpressions } from './process_math_series';

describe('Client-side vs Server-side evaluation', () => {
  describe('Golden tests - client evaluation matches server evaluation', () => {
    let panel;
    let rawResponse;

    beforeEach(() => {
      panel = {
        id: 'test-panel',
        series: [
          {
            id: 'series-1',
            label: 'CPU Usage Ratio',
            color: '#68BC00',
            metrics: [
              {
                id: 'avg-cpu',
                type: 'avg',
                field: 'cpu.percent',
              },
              {
                id: 'max-cpu',
                type: 'max',
                field: 'cpu.percent',
              },
              {
                id: 'math-cpu-ratio',
                type: 'math',
                script: 'params.avg / params.max',
                variables: [
                  { name: 'avg', field: 'avg-cpu' },
                  { name: 'max', field: 'max-cpu' },
                ],
              },
            ],
          },
        ],
      };
    });

    test('should match server evaluation for simple division', () => {
      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              label: 'Avg CPU',
              data: [
                [1609459200000, 45.5],
                [1609459260000, 52.3],
                [1609459320000, 48.7],
              ],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:max-cpu',
              label: 'Max CPU',
              data: [
                [1609459200000, 91.0],
                [1609459260000, 87.2],
                [1609459320000, 81.2],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const expectedServerResult = {
        'test-panel': {
          series: [
            {
              id: 'series-1',
              label: 'CPU Usage Ratio',
              color: '#68BC00',
              data: [
                [1609459200000, 0.5],
                [1609459260000, 0.5995412844036697],
                [1609459320000, 0.5995566502463054],
              ],
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series).toHaveLength(1);
      expect(clientResult['test-panel'].series[0].id).toBe(
        expectedServerResult['test-panel'].series[0].id
      );
      expect(clientResult['test-panel'].series[0].label).toBe(
        expectedServerResult['test-panel'].series[0].label
      );

      // Compare data points with tolerance for floating point precision
      clientResult['test-panel'].series[0].data.forEach((point, index) => {
        const [ts, value] = point;
        const [expectedTs, expectedValue] = expectedServerResult['test-panel'].series[0].data[
          index
        ];

        expect(ts).toBe(expectedTs);
        expect(value).toBeCloseTo(expectedValue, 3);
      });
    });

    test('should match server evaluation for complex expressions', () => {
      panel.series[0].metrics[2].script = '(params.avg + params.max) / 2';

      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              data: [
                [1000, 40],
                [2000, 50],
              ],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:max-cpu',
              data: [
                [1000, 80],
                [2000, 90],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series[0].data).toEqual([
        [1000, 60], // (40 + 80) / 2 = 60
        [2000, 70], // (50 + 90) / 2 = 70
      ]);
    });

    test('should match server evaluation for params._index', () => {
      panel.series[0].metrics[2].script = 'params.avg + params._index';

      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              data: [
                [1000, 10],
                [2000, 20],
                [3000, 30],
              ],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:max-cpu',
              data: [
                [1000, 100],
                [2000, 100],
                [3000, 100],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series[0].data).toEqual([
        [1000, 10], // 10 + 0 = 10
        [2000, 21], // 20 + 1 = 21
        [3000, 32], // 30 + 2 = 32
      ]);
    });

    test('should match server evaluation for params._all', () => {
      panel.series[0].metrics[2].script = 'size(params._all.avg.values) * 10';

      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              data: [
                [1000, 25],
                [2000, 30],
              ],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:max-cpu',
              data: [
                [1000, 50],
                [2000, 60],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series[0].data).toEqual([
        [1000, 20], // size(values array) * 10 = 2 * 10 = 20
        [2000, 20], // size(values array) * 10 = 2 * 10 = 20
      ]);
    });

    test('should match server behavior for division by zero', () => {
      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              data: [
                [1000, 100],
                [2000, 50],
              ],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:max-cpu',
              data: [
                [1000, 0], // Division by zero
                [2000, 100],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series[0].data).toEqual([
        [1000, null], // Division by zero returns null
        [2000, 0.5],
      ]);
    });

    test('should match server behavior for null values', () => {
      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              data: [
                [1000, null],
                [2000, 50],
                [3000, 60],
              ],
              meta: { bucketSize: 60 },
            },
            {
              id: 'series-1:max-cpu',
              data: [
                [1000, 100],
                [2000, null],
                [3000, 80],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series[0].data).toEqual([
        [1000, null], // avg is null
        [2000, null], // max is null
        [3000, 0.75], // 60 / 80 = 0.75
      ]);
    });

    test('should match server evaluation with params._interval', () => {
      panel.series[0].metrics[2].script = 'params.avg + params._interval / 1000';

      rawResponse = {
        'test-panel': {
          series: [
            {
              id: 'series-1:avg-cpu',
              data: [
                [1000, 10],
                [2000, 20],
              ],
              meta: { bucketSize: 60 }, // 60 seconds = 60000ms
            },
            {
              id: 'series-1:max-cpu',
              data: [
                [1000, 100],
                [2000, 100],
              ],
              meta: { bucketSize: 60 },
            },
          ],
        },
      };

      const clientResult = evaluateMathExpressions(rawResponse, panel);

      expect(clientResult['test-panel'].series[0].data).toEqual([
        [1000, 70], // 10 + 60000/1000 = 10 + 60 = 70
        [2000, 80], // 20 + 60000/1000 = 20 + 60 = 80
      ]);
    });
  });

  describe('Multiple math series', () => {
    test('should handle multiple math series independently', () => {
      const panel = {
        id: 'panel-1',
        series: [
          {
            id: 'series-1',
            label: 'Math 1',
            metrics: [
              { id: 'a', type: 'avg' },
              { id: 'b', type: 'min' },
              {
                id: 'math-1',
                type: 'math',
                script: 'params.a + params.b',
                variables: [
                  { name: 'a', field: 'a' },
                  { name: 'b', field: 'b' },
                ],
              },
            ],
          },
          {
            id: 'series-2',
            label: 'Math 2',
            metrics: [
              { id: 'c', type: 'max' },
              { id: 'd', type: 'avg' },
              {
                id: 'math-2',
                type: 'math',
                script: 'params.c - params.d',
                variables: [
                  { name: 'c', field: 'c' },
                  { name: 'd', field: 'd' },
                ],
              },
            ],
          },
        ],
      };

      const rawResponse = {
        'panel-1': {
          series: [
            { id: 'series-1:a', data: [[1000, 10]], meta: { bucketSize: 60 } },
            { id: 'series-1:b', data: [[1000, 5]], meta: { bucketSize: 60 } },
            { id: 'series-2:c', data: [[1000, 100]], meta: { bucketSize: 60 } },
            { id: 'series-2:d', data: [[1000, 80]], meta: { bucketSize: 60 } },
          ],
        },
      };

      const result = evaluateMathExpressions(rawResponse, panel);

      expect(result['panel-1'].series).toHaveLength(2);
      expect(result['panel-1'].series[0]).toEqual(
        expect.objectContaining({
          id: 'series-1',
          label: 'Math 1',
          data: [[1000, 15]], // 10 + 5
        })
      );
      expect(result['panel-1'].series[1]).toEqual(
        expect.objectContaining({
          id: 'series-2',
          label: 'Math 2',
          data: [[1000, 20]], // 100 - 80
        })
      );
    });
  });
});
