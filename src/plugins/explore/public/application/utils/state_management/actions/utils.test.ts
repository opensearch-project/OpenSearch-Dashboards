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
      expect(result).toBe('source=logs | timechart span=1h limit=4 count() by status');
    });

    it('should build stats query without breakdown field', () => {
      const query = 'source=logs';
      const histogramConfig = createBaseHistogramConfig({
        aggs: { 2: { date_histogram: {} } },
      });

      const result = utils.buildPPLHistogramQuery(query, histogramConfig);
      expect(result).toBe('source=logs | stats count() by span(@timestamp, 1h)');
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
