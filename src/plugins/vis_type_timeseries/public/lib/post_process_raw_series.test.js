/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applyTimeShift, applyDropLastBucket } from './post_process_raw_series';

describe('post_process_raw_series', () => {
  describe('applyTimeShift', () => {
    const makeResponse = () => ({
      'panel-1': {
        series: [
          {
            id: 'series-1:metric-a',
            data: [
              [1000, 10],
              [2000, 20],
            ],
          },
          {
            id: 'series-2:metric-b',
            data: [
              [1000, 30],
              [2000, 40],
            ],
          },
        ],
      },
    });

    test('shifts timestamps of matching series by the parsed offset', () => {
      const response = makeResponse();
      const panel = {
        id: 'panel-1',
        series: [{ id: 'series-1', offset_time: '1m' }],
      };

      const result = applyTimeShift(response, panel);

      // series-1 shifted by +60s, series-2 untouched
      expect(result['panel-1'].series[0].data).toEqual([
        [1000 + 60000, 10],
        [2000 + 60000, 20],
      ]);
      expect(result['panel-1'].series[1].data).toEqual([
        [1000, 30],
        [2000, 40],
      ]);
    });

    test('supports negative offsets', () => {
      const response = makeResponse();
      const panel = {
        id: 'panel-1',
        series: [{ id: 'series-1', offset_time: '-1m' }],
      };

      const result = applyTimeShift(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000 - 60000, 10],
        [2000 - 60000, 20],
      ]);
    });

    test('preserves extra row values (band series y0/y1)', () => {
      const response = {
        'panel-1': {
          series: [{ id: 'series-1:band', data: [[1000, 5, 1]] }],
        },
      };
      const panel = { id: 'panel-1', series: [{ id: 'series-1', offset_time: '1s' }] };

      const result = applyTimeShift(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([[1000 + 1000, 5, 1]]);
    });

    test('is a no-op when offset_time is absent or invalid', () => {
      const response = makeResponse();
      const panel = {
        id: 'panel-1',
        series: [{ id: 'series-1' }, { id: 'series-2', offset_time: 'not-an-offset' }],
      };

      const result = applyTimeShift(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 10],
        [2000, 20],
      ]);
      expect(result['panel-1'].series[1].data).toEqual([
        [1000, 30],
        [2000, 40],
      ]);
    });

    test('returns response unchanged when panel data is missing', () => {
      const response = {};
      expect(applyTimeShift(response, { id: 'panel-1', series: [] })).toBe(response);
    });
  });

  describe('applyDropLastBucket', () => {
    const makeResponse = () => ({
      'panel-1': {
        series: [
          {
            id: 'series-1:metric-a',
            data: [
              [1000, 10],
              [2000, 20],
              [3000, 30],
            ],
          },
        ],
      },
    });

    test('drops the last bucket for timeseries panels by default (last-value mode)', () => {
      const response = makeResponse();
      const panel = { id: 'panel-1', type: 'timeseries', series: [{ id: 'series-1' }] };

      const result = applyDropLastBucket(response, panel);

      // Timeseries panels are last-value mode, so the trailing (often partial) bucket
      // is dropped unless drop_last_bucket is explicitly disabled.
      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 10],
        [2000, 20],
      ]);
    });

    test('drops the last bucket in last-value mode (non-timeseries panel)', () => {
      const response = makeResponse();
      const panel = { id: 'panel-1', type: 'metric', series: [{ id: 'series-1' }] };

      const result = applyDropLastBucket(response, panel);

      expect(result['panel-1'].series[0].data).toEqual([
        [1000, 10],
        [2000, 20],
      ]);
    });

    test('does not drop in entire-time-range mode', () => {
      const response = makeResponse();
      const panel = {
        id: 'panel-1',
        type: 'metric',
        time_range_mode: 'entire_time_range',
        series: [{ id: 'series-1' }],
      };

      const result = applyDropLastBucket(response, panel);

      expect(result['panel-1'].series[0].data).toHaveLength(3);
    });

    test('respects panel.drop_last_bucket = 0', () => {
      const response = makeResponse();
      const panel = {
        id: 'panel-1',
        type: 'metric',
        drop_last_bucket: 0,
        series: [{ id: 'series-1' }],
      };

      const result = applyDropLastBucket(response, panel);

      expect(result['panel-1'].series[0].data).toHaveLength(3);
    });

    test('respects per-series override_drop_last_bucket = 0 when panel value absent', () => {
      const response = makeResponse();
      const panel = {
        id: 'panel-1',
        type: 'metric',
        series: [{ id: 'series-1', override_drop_last_bucket: 0 }],
      };

      const result = applyDropLastBucket(response, panel);

      expect(result['panel-1'].series[0].data).toHaveLength(3);
    });

    test('only drops series belonging to the matching series config', () => {
      const response = {
        'panel-1': {
          series: [
            {
              id: 'series-1:m',
              data: [
                [1, 1],
                [2, 2],
              ],
            },
            {
              id: 'series-2:m',
              data: [
                [1, 1],
                [2, 2],
              ],
            },
          ],
        },
      };
      const panel = {
        id: 'panel-1',
        type: 'metric',
        series: [
          { id: 'series-1' },
          { id: 'series-2', time_range_mode: 'entire_time_range', override_index_pattern: true },
        ],
      };

      const result = applyDropLastBucket(response, panel);

      // series-1 is last-value -> dropped; series-2 overrides to entire range -> kept
      expect(result['panel-1'].series[0].data).toEqual([[1, 1]]);
      expect(result['panel-1'].series[1].data).toEqual([
        [1, 1],
        [2, 2],
      ]);
    });
  });
});
