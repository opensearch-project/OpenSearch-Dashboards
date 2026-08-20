/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable max-classes-per-file */

jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment');
  moment.tz = {
    guess: () => 'America/New_York',
    setDefault: () => {},
  };
  return moment;
});

jest.mock('../../../../../../data/public', () => ({
  indexPatterns: { isDefault: jest.fn() },
  search: { tabifyAggResponse: jest.fn() },
}));

jest.mock('../../../../components/chart/utils', () => ({
  createHistogramConfigs: jest.fn(),
}));

jest.mock('../../../../../../../../src/plugins/data/common', () => {
  const mockMoment = jest.requireActual('moment');
  return {
    parseInterval: jest.fn((interval: string) => {
      if (interval === '1h') return mockMoment.duration(1, 'hour');
      if (interval === '5m') return mockMoment.duration(5, 'minutes');
      if (interval === '1d') return mockMoment.duration(1, 'day');
      if (interval === 'invalid') return null;
      return mockMoment.duration(1, 'hour');
    }),
    formatTimePickerDate: jest.fn(() => ({
      fromDate: '2023-01-01 00:00:00.000',
      toDate: '2023-01-02 00:00:00.000',
    })),
    DataView: class DataView {},
    AggConfigs: class AggConfigs {},
  };
});

import * as utils from './utils';
import * as chartUtils from '../../../../components/chart/utils';
import { parseInterval } from '../../../../../../../../src/plugins/data/common';

describe('Utils - Histogram Breakdown Support', () => {
  const createBaseHistogramConfig = (
    overrides?: Partial<utils.HistogramConfig>
  ): utils.HistogramConfig => ({
    histogramConfigs: undefined,
    aggs: undefined,
    effectiveInterval: '1h',
    finalInterval: '1h',
    fromDate: '2023-01-01 00:00:00.000',
    toDate: '2023-01-02 00:00:00.000',
    timeFieldName: '@timestamp',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fillMissingTimestamps', () => {
    it('should return empty map when seriesMap is empty', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const result = utils.fillMissingTimestamps(
        seriesMap,
        '1h',
        '2023-01-01 00:00:00.000',
        '2023-01-01 02:00:00.000'
      );

      expect(result.size).toBe(0);
    });

    it('should return original seriesMap when intervalStr is invalid', () => {
      const seriesMap = new Map<string, Array<[number, number]>>([
        ['series1', [[1672531200000, 10] as [number, number]]],
      ]);
      (parseInterval as jest.Mock).mockReturnValueOnce(null);

      const result = utils.fillMissingTimestamps(
        seriesMap,
        'invalid',
        '2023-01-01 00:00:00.000',
        '2023-01-01 02:00:00.000'
      );

      expect(result).toBe(seriesMap);
    });

    it('should fill missing timestamps for multiple series', () => {
      const seriesMap = new Map<string, Array<[number, number]>>([
        ['series1', [[1672531200000, 10] as [number, number]]],
        ['series2', [[1672534800000, 15] as [number, number]]],
      ]);

      const result = utils.fillMissingTimestamps(
        seriesMap,
        '1h',
        '2023-01-01 00:00:00.000',
        '2023-01-01 02:00:00.000'
      );

      expect(result.size).toBe(2);
      const series1Data = result.get('series1');
      const series2Data = result.get('series2');
      expect(series1Data!.length).toBe(series2Data!.length);
    });
  });

  describe('queryEndsWithHead', () => {
    it('should detect head at end of query', () => {
      expect(utils.queryEndsWithHead('source=logs | head 200')).toBe(true);
    });

    it('should detect head with from clause', () => {
      expect(utils.queryEndsWithHead('source=logs | head 200 from 10')).toBe(true);
    });

    it('should detect head without explicit count', () => {
      expect(utils.queryEndsWithHead('source=logs | head')).toBe(true);
    });

    it('should detect head followed by where clause', () => {
      expect(utils.queryEndsWithHead('source=logs | head 200 | where status = 200')).toBe(true);
    });

    it('should return false when no head is present', () => {
      expect(utils.queryEndsWithHead('source=logs | WHERE status = 200')).toBe(false);
    });

    it('should return false when head is only inside subquery', () => {
      expect(utils.queryEndsWithHead('source=logs | where id in [source=other | head 10]')).toBe(
        false
      );
    });

    it('should detect main query head even with subquery head', () => {
      expect(
        utils.queryEndsWithHead('source=logs | where id in [source=other | head 10] | head 200')
      ).toBe(true);
    });

    it('should return false when head is in the middle of the query', () => {
      expect(utils.queryEndsWithHead('source=logs | head 200 | stats count() by status')).toBe(
        false
      );
    });
  });

  describe('buildPPLHistogramQuery', () => {
    it('should return original query when aggs is missing', () => {
      const query = 'source=logs';
      const histogramConfig = createBaseHistogramConfig();

      const result = utils.buildPPLHistogramQuery(query, histogramConfig);
      expect(result).toBe(query);
    });

    it('should build timechart query with breakdown field', () => {
      const query = 'source=logs';
      const histogramConfig = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        breakdownField: 'status',
      });

      const result = utils.buildPPLHistogramQuery(query, histogramConfig);
      expect(result).toBe(
        'source=logs | rename @timestamp as @timestamp | timechart span=1h limit=4 count() by status'
      );
    });

    it('should build stats query without breakdown field', () => {
      const query = 'source=logs';
      const histogramConfig = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
      });

      const result = utils.buildPPLHistogramQuery(query, histogramConfig);
      expect(result).toBe('source=logs | stats count() by span(@timestamp, 1h)');
    });

    it('should preserve head clause in histogram query', () => {
      const query = 'source=logs | head 200';
      const histogramConfig = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
      });

      const result = utils.buildPPLHistogramQuery(query, histogramConfig);
      expect(result).toBe('source=logs | head 200 | stats count() by span(@timestamp, 1h)');
    });
  });

  describe('processRawResultsForHistogram', () => {
    it('should return original results when aggs is missing', () => {
      const queryString = 'source=logs';
      const rawResults: any = { hits: { hits: [], total: 0 } };
      const histogramConfig = createBaseHistogramConfig();

      const result = utils.processRawResultsForHistogram(queryString, rawResults, histogramConfig);
      expect(result).toBe(rawResults);
    });

    it('should process results with breakdown field', () => {
      const queryString = 'source=logs';
      const rawResults: any = {
        hits: {
          hits: [
            { _source: { '@timestamp': '2023-01-01T00:00:00Z', status: '200', count: 10 } },
            { _source: { '@timestamp': '2023-01-01T01:00:00Z', status: '200', count: 15 } },
          ],
          total: 2,
        },
        fieldSchema: [{ name: '@timestamp' }, { name: 'status' }, { name: 'count' }],
      };
      const histogramConfig = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        breakdownField: 'status',
      });

      const result = utils.processRawResultsForHistogram(queryString, rawResults, histogramConfig);

      expect((result as any).breakdownSeries).toBeDefined();
      expect((result as any).breakdownSeries.breakdownField).toBe('status');
    });

    it('should process results without breakdown field', () => {
      const queryString = 'source=logs';
      const rawResults: any = {
        hits: {
          hits: [{ _source: { count: 10, '@timestamp': '2023-01-01T00:00:00Z' } }],
          total: 1,
        },
        fieldSchema: [{ name: 'count' }, { name: '@timestamp' }],
      };
      const histogramConfig = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
      });

      const result = utils.processRawResultsForHistogram(queryString, rawResults, histogramConfig);

      expect(result.aggregations).toBeDefined();
      expect(result.aggregations['2']).toBeDefined();
    });
  });

  describe('buildSQLHistogramQuery', () => {
    it('returns the original query when aggs is missing', () => {
      const query = 'SELECT * FROM logs';
      const result = utils.buildSQLHistogramQuery(query, createBaseHistogramConfig());
      expect(result).toBe(query);
    });

    it('buckets via the native date_histogram() function', () => {
      const query = 'SELECT * FROM logs';
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1h',
      });
      const result = utils.buildSQLHistogramQuery(query, config);

      expect(result).toBe(
        'SELECT time_bucket, COUNT(*) ' +
          "FROM (SELECT date_histogram(field=`@timestamp`, interval='1h') AS time_bucket FROM (SELECT * FROM logs) sub_inner) sub " +
          'GROUP BY time_bucket ORDER BY time_bucket'
      );
    });

    it('passes a multiplier interval through to date_histogram', () => {
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '5m',
      });
      const result = utils.buildSQLHistogramQuery('SELECT * FROM logs', config);
      expect(result).toContain("date_histogram(field=`@timestamp`, interval='5m')");
    });

    it('passes a calendar month interval through to date_histogram', () => {
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1M',
      });
      const result = utils.buildSQLHistogramQuery('SELECT * FROM logs', config);
      expect(result).toContain("date_histogram(field=`@timestamp`, interval='1M')");
    });

    it('passes a calendar year interval through to date_histogram', () => {
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1y',
      });
      const result = utils.buildSQLHistogramQuery('SELECT * FROM logs', config);
      expect(result).toContain("date_histogram(field=`@timestamp`, interval='1y')");
    });

    it('preserves a trailing LIMIT', () => {
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1h',
      });
      const result = utils.buildSQLHistogramQuery('SELECT * FROM logs LIMIT 10 OFFSET 5', config);
      expect(result).toContain('FROM (SELECT * FROM logs LIMIT 10 OFFSET 5) sub_inner');
    });

    it('builds a 2-dimensional GROUP BY when a breakdown field is set', () => {
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1h',
        breakdownField: 'status',
      });
      const result = utils.buildSQLHistogramQuery('SELECT * FROM logs', config);
      expect(result).toBe(
        'SELECT time_bucket, breakdown, COUNT(*) ' +
          "FROM (SELECT date_histogram(field=`@timestamp`, interval='1h') AS time_bucket, `status` AS breakdown FROM (SELECT * FROM logs) sub_inner) sub " +
          'GROUP BY time_bucket, breakdown ORDER BY time_bucket'
      );
    });

    it('relabels non-top-N values to an OTHER bucket via CASE (pass 2)', () => {
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1h',
        breakdownField: 'status',
      });
      const result = utils.buildSQLHistogramQuery('SELECT * FROM logs', config, ['200', "o'brien"]);
      // NULLs → 'NULL', top-N kept as-is, everything else → 'OTHER'; quotes doubled
      expect(result).toContain(
        "CASE WHEN `status` IS NULL THEN 'NULL' " +
          "WHEN `status` IN ('200', 'o''brien') THEN `status` ELSE 'OTHER' END AS breakdown"
      );
    });
  });

  describe('buildSQLTopBreakdownQuery', () => {
    it('returns the query unchanged when no breakdown field is set', () => {
      const query = 'SELECT * FROM logs';
      expect(utils.buildSQLTopBreakdownQuery(query, createBaseHistogramConfig())).toBe(query);
    });

    it('builds a top-N-by-count query for the breakdown field', () => {
      const config = createBaseHistogramConfig({ breakdownField: 'status' });
      const result = utils.buildSQLTopBreakdownQuery('SELECT * FROM logs', config);
      expect(result).toBe(
        'SELECT breakdown, COUNT(*) ' +
          'FROM (SELECT `status` AS breakdown FROM (SELECT * FROM logs) sub_inner) sub ' +
          'GROUP BY breakdown ORDER BY COUNT(*) DESC LIMIT 4'
      );
    });
  });

  describe('processRawResultsForHistogram (SQL)', () => {
    it('parses datetime bucket strings back to epoch ms', () => {
      const rawResults: any = {
        hits: {
          hits: [
            { _source: { time_bucket: '2023-01-01 00:00:00', 'COUNT(*)': 10 } },
            { _source: { time_bucket: '2023-01-01 01:00:00', 'COUNT(*)': 15 } },
          ],
          total: 2,
        },
        fieldSchema: [{ name: 'time_bucket' }, { name: 'COUNT(*)' }],
      };
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1h',
      });

      const result = utils.processRawResultsForHistogram('SELECT ...', rawResults, config, true);

      const buckets = result.aggregations['2'].buckets;
      expect(buckets).toHaveLength(2);
      expect(buckets[0]).toEqual({
        key_as_string: '2023-01-01T00:00:00.000Z',
        key: Date.UTC(2023, 0, 1, 0, 0, 0),
        doc_count: 10,
      });
      expect(buckets[1].key).toBe(Date.UTC(2023, 0, 1, 1, 0, 0));
      expect(result.hits.total).toBe(25);
    });

    it('parses a month-interval bucket, which is still a full datetime key', () => {
      const rawResults: any = {
        hits: {
          hits: [{ _source: { time_bucket: '2023-02-01 00:00:00', 'COUNT(*)': 7 } }],
          total: 1,
        },
        fieldSchema: [{ name: 'time_bucket' }, { name: 'COUNT(*)' }],
      };
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1M',
      });

      const result = utils.processRawResultsForHistogram('SELECT ...', rawResults, config, true);
      const buckets = result.aggregations['2'].buckets;
      expect(buckets[0].key).toBe(Date.UTC(2023, 1, 1));
    });

    it('returns original results when the SQL bucket columns are missing', () => {
      const rawResults: any = {
        hits: { hits: [{ _source: { foo: 1 } }], total: 1 },
        fieldSchema: [{ name: 'foo' }, { name: 'bar' }],
      };
      const config = createBaseHistogramConfig({ aggs: { 2: { date_histogram: {} } } });

      const result = utils.processRawResultsForHistogram('SELECT ...', rawResults, config, true);
      expect(result).toBe(rawResults);
    });

    it('does not treat a query as SQL histogram unless the flag is set', () => {
      // PPL-shaped results; flag defaults to false → PPL branch runs, not SQL.
      const rawResults: any = {
        hits: {
          hits: [{ _source: { count: 3, '@timestamp': '2023-01-01T00:00:00Z' } }],
          total: 1,
        },
        fieldSchema: [{ name: 'count' }, { name: '@timestamp' }],
      };
      const config = createBaseHistogramConfig({ aggs: { 2: { date_histogram: {} } } });

      const result = utils.processRawResultsForHistogram('source=logs', rawResults, config);
      // PPL branch keys on parseTimestampToMs of the @timestamp column
      expect(result.aggregations['2']).toBeDefined();
    });

    it('builds per-breakdown-value series when breakdownField is set', () => {
      const rawResults: any = {
        hits: {
          hits: [
            { _source: { time_bucket: '2023-01-01 00:00:00', breakdown: '200', 'COUNT(*)': 10 } },
            { _source: { time_bucket: '2023-01-01 01:00:00', breakdown: '200', 'COUNT(*)': 5 } },
            { _source: { time_bucket: '2023-01-01 00:00:00', breakdown: '500', 'COUNT(*)': 2 } },
          ],
          total: 3,
        },
        fieldSchema: [{ name: 'time_bucket' }, { name: 'breakdown' }, { name: 'COUNT(*)' }],
      };
      const config = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
        finalInterval: '1h',
        breakdownField: 'status',
      });

      const result: any = utils.processRawResultsForHistogram(
        'SELECT ...',
        rawResults,
        config,
        true
      );

      expect(result.breakdownSeries.breakdownField).toBe('status');
      expect(result.breakdownSeries.series).toHaveLength(2);
      expect(result.hits.total).toBe(17);

      const series200 = result.breakdownSeries.series.find((s: any) => s.breakdownValue === '200');
      expect(series200.dataPoints).toEqual([
        [Date.UTC(2023, 0, 1, 0), 10],
        [Date.UTC(2023, 0, 1, 1), 5],
      ]);
      const series500 = result.breakdownSeries.series.find((s: any) => s.breakdownValue === '500');
      expect(series500.dataPoints).toEqual([[Date.UTC(2023, 0, 1, 0), 2]]);
    });
  });

  describe('createHistogramConfigWithInterval', () => {
    let mockServices: any;
    let mockDataView: any;
    let mockGetState: jest.Mock;

    beforeEach(() => {
      mockDataView = {
        id: 'test-dataview',
        title: 'test-index',
        timeFieldName: '@timestamp',
      };

      mockServices = {
        data: {
          query: {
            timefilter: {
              timefilter: {
                getTime: jest.fn().mockReturnValue({ from: 'now-1h', to: 'now' }),
              },
            },
          },
          search: {
            aggs: {
              calculateAutoTimeExpression: jest.fn().mockReturnValue('1h'),
            },
          },
        },
      };

      mockGetState = jest.fn().mockReturnValue({
        legacy: { interval: 'auto' },
        queryEditor: { breakdownField: undefined },
      });

      (chartUtils.createHistogramConfigs as jest.Mock).mockReturnValue({
        toDsl: jest.fn().mockReturnValue({
          2: { date_histogram: { fixed_interval: '5m', field: '@timestamp' } },
        }),
      });
    });

    it('should return null when dataView has no timeFieldName', () => {
      const dataViewWithoutTime = { ...mockDataView, timeFieldName: null };
      const result = utils.createHistogramConfigWithInterval(
        dataViewWithoutTime,
        '1h',
        mockServices,
        mockGetState
      );
      expect(result).toBeNull();
    });

    it('should return null when interval is not provided', () => {
      const result = utils.createHistogramConfigWithInterval(
        mockDataView,
        undefined,
        mockServices,
        mockGetState
      );
      expect(result).toBeNull();
    });

    it('should create histogram config with provided interval', () => {
      const result = utils.createHistogramConfigWithInterval(
        mockDataView,
        '1h',
        mockServices,
        mockGetState
      );
      expect(result).not.toBeNull();
      expect(result!.effectiveInterval).toBe('1h');
    });

    it('should include breakdown field from state', () => {
      mockGetState.mockReturnValue({
        legacy: { interval: 'auto' },
        queryEditor: { breakdownField: 'status' },
      });

      const result = utils.createHistogramConfigWithInterval(
        mockDataView,
        '1h',
        mockServices,
        mockGetState
      );
      expect(result!.breakdownField).toBe('status');
    });
  });
});
