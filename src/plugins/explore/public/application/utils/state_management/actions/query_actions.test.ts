/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock moment-timezone BEFORE any imports to prevent loading issues
jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment');
  if (!moment) {
    // Fallback if moment isn't available
    return {
      tz: {
        guess: () => 'America/New_York',
        setDefault: () => {},
      },
    };
  }

  // Extend moment with timezone methods
  moment.tz = {
    guess: () => 'America/New_York',
    setDefault: () => {},
  };

  return moment;
});

jest.mock('./utils', () => ({
  buildPPLHistogramQuery: jest.fn((queryString) => queryString),
  processRawResultsForHistogram: jest.fn((_queryString, rawResults) => rawResults),
  createHistogramConfigWithInterval: jest.fn(() => ({
    histogramConfigs: {
      toDsl: jest.fn().mockReturnValue({}),
      aggs: [
        {},
        {
          buckets: {
            getInterval: jest.fn(() => ({ interval: '1h', scale: 1 })),
          },
        },
      ],
    },
    aggs: {},
    effectiveInterval: 'auto',
    finalInterval: '5m',
    fromDate: 'now-1h',
    toDate: 'now',
    timeFieldName: 'endTime',
  })),
}));

import { configureStore } from '@reduxjs/toolkit';
import {
  abortAllActiveQueries,
  defaultPrepareQueryString,
  defaultResultsProcessor,
  histogramResultsProcessor,
  prepareHistogramCacheKey,
  executeQueries,
  executeHistogramQuery,
  executeTabQuery,
  executeDataTableQuery,
} from './query_actions';
import { QueryExecutionStatus } from '../types';
import { setResults } from '../slices';
import { Query, DataView } from 'src/plugins/data/common';
import { ExploreServices } from '../../../../types';
import { SAMPLE_SIZE_SETTING } from '../../../../../common';

// Mock dependencies
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options?.defaultMessage || key),
  },
}));

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMoment = jest.fn((input?: any) => {
    if (input === undefined) {
      return actualMoment('2023-01-01T00:00:00.000Z');
    }
    return actualMoment(input);
  });
  Object.assign(mockMoment, {
    duration: actualMoment.duration,
    isMoment: actualMoment.isMoment,
    utc: actualMoment.utc,
    unix: actualMoment.unix,
  });
  return mockMoment;
});

// Import the actual modules for mocking
import * as languagesModule from '../../languages';
import * as chartUtilsModule from '../../../../components/chart/utils';
import * as dataPublicModule from '../../../../../../data/public';
import * as fieldCalculatorModule from '../../../../components/fields_selector/lib/field_calculator';

jest.mock('../../languages', () => ({
  defaultPreparePplQuery: jest.fn(),
  prepareQueryForLanguage: jest.fn((query) => query),
}));

jest.mock('../../../../../../data/public', () => ({
  indexPatterns: {
    isDefault: jest.fn(),
  },
  search: {
    tabifyAggResponse: jest.fn(),
  },
  ResultStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
  QueryStatus: {
    IDLE: 'idle',
    LOADING: 'loading',
    ERROR: 'error',
    COMPLETE: 'complete',
  },
}));

jest.mock('../../../../components/chart/utils', () => ({
  buildPointSeriesData: jest.fn(),
  buildChartFromBreakdownSeries: jest.fn(),
  createHistogramConfigs: jest.fn(),
  getDimensions: jest.fn(),
}));

jest.mock('../../../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getResponseInspectorStats: jest.fn(),
}));

jest.mock('../slices', () => ({
  setResults: jest.fn(),
  setIndividualQueryStatus: jest.fn(),
}));

jest.mock('../../../../components/fields_selector/lib/field_calculator', () => ({
  getFieldValueCounts: jest.fn(),
}));

jest.mock('./trace_aggregation_builder', () => ({
  buildRequestCountQuery: jest.fn(
    (baseQuery) => `${baseQuery} | stats count() by span(endTime, 5m)`
  ),
  buildErrorCountQuery: jest.fn(
    (baseQuery) => `${baseQuery} | where status.code = 2 | stats count() by span(endTime, 5m)`
  ),
  buildLatencyQuery: jest.fn(
    (baseQuery) => `${baseQuery} | stats avg(durationInNanos) by span(endTime, 5m)`
  ),
  createTraceAggregationConfig: jest.fn((timeField, interval, breakdownField) => ({
    timeField,
    interval,
    breakdownField,
  })),
}));

jest.mock('../../../../helpers/get_flavor_from_app_id', () => ({
  getCurrentFlavor: jest.fn().mockResolvedValue('logs'),
}));

// Global mocks
global.AbortController = jest.fn().mockImplementation(() => ({
  abort: jest.fn(),
  signal: { aborted: false },
}));

describe('Query Actions - Comprehensive Test Suite', () => {
  let mockServices: ExploreServices;
  let mockDataView: DataView;
  let mockSearchSource: any;
  let mockInspectorRequest: any;
  let mockAbortController: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAbortController = {
      abort: jest.fn(),
      signal: { aborted: false },
    };
    (global.AbortController as jest.Mock).mockImplementation(() => mockAbortController);

    mockInspectorRequest = {
      stats: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      ok: jest.fn().mockReturnThis(),
      getTime: jest.fn().mockReturnValue(150),
    };

    mockSearchSource = {
      setParent: jest.fn().mockReturnThis(),
      setFields: jest.fn().mockReturnThis(),
      setField: jest.fn().mockReturnThis(),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue({ schema: {} }),
      fetch: jest.fn().mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { field1: 'value1' } },
            { _id: '2', _source: { field2: 'value2' } },
          ],
          total: 2,
        },
        took: 5,
        aggregations: {
          histogram: {
            buckets: [
              { key: 1609459200000, doc_count: 5 },
              { key: 1609462800000, doc_count: 3 },
            ],
          },
        },
      }),
    };

    mockDataView = {
      id: 'test-dataview',
      title: 'test-index',
      timeFieldName: '@timestamp',
      flattenHit: jest.fn((hit) => hit._source),
      isTimeBased: jest.fn().mockReturnValue(true),
      fields: {
        filter: jest.fn().mockReturnValue([]),
        getByName: jest.fn().mockReturnValue(undefined),
      },
    } as any;

    mockServices = {
      data: {
        dataViews: {
          ensureDefaultDataView: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue(mockDataView),
          getDefault: jest.fn().mockResolvedValue(mockDataView),
          convertToDataset: jest.fn().mockReturnValue(mockDataView),
          saveToCache: jest.fn(),
        },
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
          showError: jest.fn(),
          aggs: {
            calculateAutoTimeExpression: jest.fn().mockReturnValue('1h'),
          },
        },
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({ query: '', language: 'PPL' }),
            getLanguageService: jest.fn().mockReturnValue({
              getLanguage: jest.fn().mockReturnValue({}),
            }),
          },
          filterManager: {
            getFilters: jest.fn().mockReturnValue([]),
          },
          timefilter: {
            timefilter: {
              createFilter: jest.fn().mockReturnValue({}),
              getTime: jest.fn().mockReturnValue({
                from: 'now-1h',
                to: 'now',
              }),
            },
          },
        },
      },
      uiSettings: {
        get: jest.fn((key) => {
          if (key === SAMPLE_SIZE_SETTING) return 500;
          if (key === 'data:withLongNumerals') return false;
          return undefined;
        }),
      },
      inspectorAdapters: {
        requests: {
          reset: jest.fn(),
          start: jest.fn().mockReturnValue(mockInspectorRequest),
        },
      },
      tabRegistry: {
        getTab: jest.fn().mockImplementation((tabId) => {
          if (tabId === 'test-tab') {
            return {
              id: 'test-tab',
              name: 'Test Tab',
              handleQueryError: jest.fn().mockReturnValue(false),
            };
          }
          return null;
        }),
      },
      getRequestInspectorStats: jest.fn().mockReturnValue({}),
    } as any;
  });

  describe('abortAllActiveQueries', () => {
    it('should abort all active queries and clear controllers', () => {
      expect(() => abortAllActiveQueries()).not.toThrow();
    });

    it('should handle empty controllers map gracefully', () => {
      abortAllActiveQueries();
      expect(() => abortAllActiveQueries()).not.toThrow();
    });

    it('should be a function', () => {
      expect(typeof abortAllActiveQueries).toBe('function');
    });
  });

  describe('defaultPrepareQueryString', () => {
    const mockDefaultPreparePplQuery = languagesModule.defaultPreparePplQuery as jest.MockedFunction<
      typeof languagesModule.defaultPreparePplQuery
    >;

    beforeEach(() => {
      mockDefaultPreparePplQuery.mockClear();
    });

    it('should handle PPL language queries', () => {
      const pplQuery: Query = {
        query: 'source=logs | stats count() by status',
        language: 'PPL',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...pplQuery,
        query: 'processed-ppl-query',
      });

      const result = defaultPrepareQueryString(pplQuery);

      expect(mockDefaultPreparePplQuery).toHaveBeenCalledWith(pplQuery);
      expect(result).toBe('processed-ppl-query');
    });

    it('should throw error for unsupported language', () => {
      const unsupportedQuery: Query = {
        query: 'SELECT * FROM table',
        language: 'SQL',
      };

      expect(() => defaultPrepareQueryString(unsupportedQuery)).toThrow(
        'defaultPrepareQueryString encountered unhandled language: SQL'
      );
    });

    it('should handle empty query string', () => {
      const pplQuery: Query = {
        query: '',
        language: 'PPL',
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...pplQuery,
        query: '',
      });

      const result = defaultPrepareQueryString(pplQuery);
      expect(result).toBe('');
    });

    it('should handle complex PPL queries', () => {
      const complexQuery: Query = {
        query: 'source=logs | where level="error" | stats count() by service | sort count desc',
        language: 'PPL',
        dataset: { title: 'error-logs', id: '456', type: 'INDEX_PATTERN' },
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...complexQuery,
        query: 'processed-complex-query',
      });

      const result = defaultPrepareQueryString(complexQuery);
      expect(result).toBe('processed-complex-query');
    });
  });

  describe('prepareHistogramCacheKey', () => {
    const mockDefaultPreparePplQuery = languagesModule.defaultPreparePplQuery as jest.MockedFunction<
      typeof languagesModule.defaultPreparePplQuery
    >;

    beforeEach(() => {
      mockDefaultPreparePplQuery.mockClear();
    });

    it('should use "histogram:" prefix without breakdown', () => {
      const query: Query = {
        query: 'source=logs',
        language: 'PPL',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...query,
        query: 'processed-query',
      });

      const result = prepareHistogramCacheKey(query, false);

      expect(result).toBe('histogram:processed-query');
      expect(mockDefaultPreparePplQuery).toHaveBeenCalledWith(query);
    });

    it('should use "histogram:breakdown:" prefix with breakdown', () => {
      const query: Query = {
        query: 'source=logs',
        language: 'PPL',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...query,
        query: 'processed-query',
      });

      const result = prepareHistogramCacheKey(query, true);

      expect(result).toBe('histogram:breakdown:processed-query');
      expect(mockDefaultPreparePplQuery).toHaveBeenCalledWith(query);
    });

    it('should use "histogram:" prefix when hasBreakdown is undefined', () => {
      const query: Query = {
        query: 'source=logs',
        language: 'PPL',
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...query,
        query: 'processed-query',
      });

      const result = prepareHistogramCacheKey(query);

      expect(result).toBe('histogram:processed-query');
    });

    it('should handle different query strings correctly', () => {
      const queries = [
        'source=logs',
        'source=metrics | stats avg(value)',
        'source=traces | where service="api" | stats count() by status',
      ];

      queries.forEach((queryString) => {
        const query: Query = {
          query: queryString,
          language: 'PPL',
        };

        mockDefaultPreparePplQuery.mockReturnValue({
          ...query,
          query: `processed-${queryString}`,
        });

        const resultWithoutBreakdown = prepareHistogramCacheKey(query, false);
        expect(resultWithoutBreakdown).toBe(`histogram:processed-${queryString}`);

        const resultWithBreakdown = prepareHistogramCacheKey(query, true);
        expect(resultWithBreakdown).toBe(`histogram:breakdown:processed-${queryString}`);
      });
    });

    it('should handle empty query string', () => {
      const query: Query = {
        query: '',
        language: 'PPL',
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...query,
        query: '',
      });

      const result = prepareHistogramCacheKey(query, false);
      expect(result).toBe('histogram:');
    });

    it('should handle query with special characters', () => {
      const query: Query = {
        query: 'source=logs | where field="value with spaces"',
        language: 'PPL',
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...query,
        query: 'source=logs | where field="value with spaces"',
      });

      const result = prepareHistogramCacheKey(query, true);
      expect(result).toBe('histogram:breakdown:source=logs | where field="value with spaces"');
    });
  });

  describe('defaultResultsProcessor', () => {
    it('should process search results and calculate field counts', () => {
      const rawResults = {
        hits: {
          hits: [
            { _id: '1', _source: { field1: 'value1', field2: 'value2' } },
            { _id: '2', _source: { field1: 'value3', field3: 'value4' } },
          ],
          total: 2,
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result).toEqual({
        hits: rawResults.hits,
        fieldCounts: {
          field1: 2,
          field2: 1,
          field3: 1,
        },
        dataset: mockDataView,
        elapsedMs: 100,
      });
    });

    it('should handle results with aggregations', () => {
      const rawResults = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        aggregations: {
          histogram: {
            buckets: [
              { key: 1609459200000, doc_count: 5 },
              { key: 1609462800000, doc_count: 3 },
            ],
          },
        },
        elapsedMs: 150,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData).toBeDefined();
      expect(result.bucketInterval).toEqual({ interval: 'auto', scale: 1 });
    });

    it('should handle null hits gracefully', () => {
      const rawResults = {
        hits: null,
        elapsedMs: 50,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.fieldCounts).toEqual({});
      expect(result.hits).toBeNull();
    });

    it('should handle undefined dataset gracefully', () => {
      const rawResults = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        elapsedMs: 75,
      } as any;

      const result = defaultResultsProcessor(rawResults, undefined as any);

      expect(result.fieldCounts).toEqual({});
      expect(result.dataset).toBeUndefined();
    });

    it('should handle empty hits array', () => {
      const rawResults = {
        hits: {
          hits: [],
          total: 0,
        },
        elapsedMs: 25,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.fieldCounts).toEqual({});
      expect(result.hits.hits).toHaveLength(0);
    });

    it('should call updateFieldTopQueryValues when processing results with hits', () => {
      // Mock the getFieldValueCounts function that's used in updateFieldTopQueryValues
      const mockGetFieldValueCounts = fieldCalculatorModule.getFieldValueCounts as jest.Mock;
      mockGetFieldValueCounts.mockReturnValue({
        buckets: [{ value: 'service1' }, { value: 'service2' }, { value: 'service3' }],
      });

      // Create a mock field that doesn't have topQueryValues yet
      const mockField = {
        name: 'servicename',
        isSuggestionAvailable: jest.fn().mockReturnValue(true),
        subType: undefined,
        spec: {
          suggestions: {} as any,
        },
      };

      // Mock dataset with string fields that need updating
      const mockDatasetWithFields = {
        ...mockDataView,
        fields: {
          filter: jest.fn().mockReturnValue([mockField]),
          getByName: jest.fn().mockReturnValue(mockField),
        },
      } as any;

      const rawResults = {
        hits: {
          hits: [
            { _id: '1', _source: { servicename: 'service1', level: 'info' } },
            { _id: '2', _source: { servicename: 'service2', level: 'error' } },
            { _id: '3', _source: { servicename: 'service1', level: 'warn' } },
          ],
          total: 3,
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDatasetWithFields);

      // Verify that getFieldValueCounts was called as part of updateFieldTopQueryValues
      expect(mockGetFieldValueCounts).toHaveBeenCalledWith({
        hits: rawResults.hits.hits,
        field: mockField,
        dataSet: mockDatasetWithFields,
        count: 5,
        grouped: false,
      });

      // Verify that the field's topValues were updated
      expect(mockField.spec.suggestions.topValues).toEqual(['service1', 'service2', 'service3']);

      // Verify the result structure
      expect(result.hits).toBe(rawResults.hits);
      expect(result.dataset).toBe(mockDatasetWithFields);
    });
  });

  describe('histogramResultsProcessor', () => {
    const mockData = {
      dataViews: {
        saveToCache: jest.fn(),
      },
    } as any;
    const mockCreateHistogramConfigs = chartUtilsModule.createHistogramConfigs as jest.MockedFunction<
      typeof chartUtilsModule.createHistogramConfigs
    >;
    const mockGetDimensions = chartUtilsModule.getDimensions as jest.MockedFunction<
      typeof chartUtilsModule.getDimensions
    >;
    const mockBuildPointSeriesData = chartUtilsModule.buildPointSeriesData as jest.MockedFunction<
      typeof chartUtilsModule.buildPointSeriesData
    >;
    const mockTabifyAggResponse = dataPublicModule.search.tabifyAggResponse as jest.MockedFunction<
      typeof dataPublicModule.search.tabifyAggResponse
    >;

    beforeEach(() => {
      mockCreateHistogramConfigs.mockReturnValue({
        aggs: [
          {} as any,
          {
            buckets: {
              getInterval: jest.fn(() => ({ interval: '1h', scale: 1 })),
            },
          } as any,
        ],
        toDsl: jest.fn().mockReturnValue({}),
      } as any);
      mockGetDimensions.mockReturnValue({ x: 'time', y: 'count' } as any);
      mockBuildPointSeriesData.mockReturnValue([{ x: 1609459200000, y: 5 }] as any);
      mockTabifyAggResponse.mockReturnValue({ rows: [], columns: [] } as any);
    });
    it('should process histogram data when timeFieldName exists', () => {
      const rawResults = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        aggregations: {
          histogram: {
            buckets: [{ key: 1609459200000, doc_count: 5 }],
          },
        },
        elapsedMs: 200,
      } as any;

      const result = histogramResultsProcessor(
        rawResults,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(mockCreateHistogramConfigs).toHaveBeenCalledWith(
        mockDataView,
        'auto',
        mockData,
        mockServices.uiSettings
      );
      expect(result.bucketInterval).toEqual({ interval: '1h', scale: 1 });
      expect(result.chartData).toEqual([{ x: 1609459200000, y: 5 }]);
    });

    it('should skip histogram processing when no timeFieldName', () => {
      const dataViewWithoutTime = { ...mockDataView, timeFieldName: null } as any;
      const rawResults = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        elapsedMs: 100,
      } as any;

      const result = histogramResultsProcessor(
        rawResults,
        dataViewWithoutTime,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(mockCreateHistogramConfigs).not.toHaveBeenCalled();
      expect(result.chartData).toBeUndefined();
    });

    it('should handle createHistogramConfigs returning null', () => {
      mockCreateHistogramConfigs.mockReturnValue(null as any);
      const rawResults = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        elapsedMs: 100,
      } as any;

      const result = histogramResultsProcessor(
        rawResults,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(result.chartData).toBeUndefined();
      expect(result.bucketInterval).toBeUndefined();
    });

    it('should handle different interval values', () => {
      const intervals = ['1m', '5m', '1h', '1d'];

      intervals.forEach((interval) => {
        const rawResults = {
          hits: { hits: [], total: 0 },
          elapsedMs: 50,
        } as any;

        histogramResultsProcessor(
          rawResults,
          mockDataView,
          mockData,
          interval,
          mockServices.uiSettings
        );
        expect(mockCreateHistogramConfigs).toHaveBeenCalledWith(
          mockDataView,
          interval,
          mockData,
          mockServices.uiSettings
        );
      });
    });

    it('should handle breakdown series in raw results', () => {
      const mockBreakdownSeries = {
        breakdownField: 'status',
        series: [
          {
            breakdownValue: '200',
            dataPoints: [
              [1609459200000, 10],
              [1609462800000, 15],
            ] as Array<[number, number]>,
          },
          {
            breakdownValue: '404',
            dataPoints: [
              [1609459200000, 5],
              [1609462800000, 3],
            ] as Array<[number, number]>,
          },
        ],
      };

      const rawResultsWithBreakdown = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        breakdownSeries: mockBreakdownSeries,
        elapsedMs: 200,
      } as any;

      const mockChartData = {
        values: mockBreakdownSeries,
        xAxisLabel: '@timestamp',
        yAxisLabel: 'Count',
      };

      const mockBuildChartFromBreakdownSeries = chartUtilsModule.buildChartFromBreakdownSeries as jest.MockedFunction<
        typeof chartUtilsModule.buildChartFromBreakdownSeries
      >;
      mockBuildChartFromBreakdownSeries.mockReturnValueOnce(mockChartData as any);

      const result = histogramResultsProcessor(
        rawResultsWithBreakdown,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(result.bucketInterval).toEqual({ interval: '1h', scale: 1 });
      expect(mockBuildChartFromBreakdownSeries).toHaveBeenCalledWith(mockBreakdownSeries, {
        x: 'time',
        y: 'count',
      });
      expect(result.chartData).toEqual(mockChartData);
    });

    it('should fallback to regular point series when no breakdown series', () => {
      const rawResultsWithoutBreakdown = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        aggregations: {
          histogram: {
            buckets: [{ key: 1609459200000, doc_count: 5 }],
          },
        },
        elapsedMs: 200,
      } as any;

      const result = histogramResultsProcessor(
        rawResultsWithoutBreakdown,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(result.chartData).toEqual([{ x: 1609459200000, y: 5 }]);
      expect(mockBuildPointSeriesData).toHaveBeenCalled();
    });

    it('should handle empty breakdown series', () => {
      const mockEmptyBreakdownSeries = {
        breakdownField: 'status',
        series: [],
      };

      const rawResultsWithEmptyBreakdown = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        breakdownSeries: mockEmptyBreakdownSeries,
        elapsedMs: 200,
      } as any;

      const mockChartData = {
        values: mockEmptyBreakdownSeries,
        xAxisLabel: '@timestamp',
        yAxisLabel: 'Count',
      };

      const mockBuildChartFromBreakdownSeries = chartUtilsModule.buildChartFromBreakdownSeries as jest.MockedFunction<
        typeof chartUtilsModule.buildChartFromBreakdownSeries
      >;
      mockBuildChartFromBreakdownSeries.mockReturnValueOnce(mockChartData as any);

      const result = histogramResultsProcessor(
        rawResultsWithEmptyBreakdown,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(result.chartData).toEqual(mockChartData);
    });

    it('should not process breakdown when dimensions are not available', () => {
      mockGetDimensions.mockReturnValue(undefined as any);

      const rawResultsWithBreakdown = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        breakdownSeries: [
          {
            label: 'status:200',
            values: [{ x: 1609459200000, y: 10 }],
          },
        ],
        elapsedMs: 200,
      } as any;

      const result = histogramResultsProcessor(
        rawResultsWithBreakdown,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(result.chartData).toBeUndefined();
    });

    it('should handle breakdown series with multiple breakdown values', () => {
      const mockBreakdownSeries = {
        breakdownField: 'service',
        series: [
          {
            breakdownValue: 'api',
            dataPoints: [[1609459200000, 20] as [number, number]],
          },
          {
            breakdownValue: 'web',
            dataPoints: [[1609459200000, 15] as [number, number]],
          },
          {
            breakdownValue: 'mobile',
            dataPoints: [[1609459200000, 10] as [number, number]],
          },
        ],
      };

      const rawResultsWithMultiBreakdown = {
        hits: {
          hits: [{ _id: '1', _source: { field1: 'value1' } }],
          total: 1,
        },
        breakdownSeries: mockBreakdownSeries,
        elapsedMs: 200,
      } as any;

      const mockChartData = {
        values: mockBreakdownSeries,
        xAxisLabel: '@timestamp',
        yAxisLabel: 'Count',
      };

      const mockBuildChartFromBreakdownSeries = chartUtilsModule.buildChartFromBreakdownSeries as jest.MockedFunction<
        typeof chartUtilsModule.buildChartFromBreakdownSeries
      >;
      mockBuildChartFromBreakdownSeries.mockReturnValueOnce(mockChartData as any);

      const result = histogramResultsProcessor(
        rawResultsWithMultiBreakdown,
        mockDataView,
        mockData,
        'auto',
        mockServices.uiSettings
      );

      expect(result.chartData).toEqual(mockChartData);
      expect(mockBuildChartFromBreakdownSeries).toHaveBeenCalledWith(mockBreakdownSeries, {
        x: 'time',
        y: 'count',
      });
    });
  });

  describe('transformAggregationToChartData', () => {
    // This function is not exported, so we test it through defaultResultsProcessor
    it('should transform aggregation results to chart data format', () => {
      const rawResults = {
        hits: { hits: [], total: 0 },
        aggregations: {
          histogram: {
            buckets: [
              { key: 1609459200000, doc_count: 5 },
              { key: 1609462800000, doc_count: 3 },
              { key: 1609466400000, doc_count: 7 },
            ],
          },
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData).toBeDefined();
      expect(result.chartData!.values).toHaveLength(3);
      expect(result.chartData!.values[0]).toEqual({ x: 1609459200000, y: 5 });
      expect(result.chartData!.xAxisLabel).toBe('@timestamp');
      expect(result.chartData!.yAxisLabel).toBe('Count');
    });

    it('should handle single bucket in aggregation results', () => {
      const rawResults = {
        hits: { hits: [], total: 0 },
        aggregations: {
          histogram: {
            buckets: [{ key: 1609459200000, doc_count: 10 }],
          },
        },
        elapsedMs: 50,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData!.values).toHaveLength(1);
      expect(result.chartData!.ordered.intervalOpenSearchValue).toBe(0);
    });

    it('should handle empty buckets in aggregation results', () => {
      const rawResults = {
        hits: { hits: [], total: 0 },
        aggregations: {
          histogram: {
            buckets: [],
          },
        },
        elapsedMs: 25,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData!.values).toHaveLength(0);
      expect(result.chartData!.xAxisOrderedValues).toHaveLength(0);
    });

    it('should return undefined when no histogram aggregation exists', () => {
      const rawResults = {
        hits: { hits: [], total: 0 },
        aggregations: {
          terms: { buckets: [] },
        },
        elapsedMs: 30,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData).toBeUndefined();
    });
  });

  describe('executeQueries', () => {
    let mockGetState: jest.Mock;
    let mockDispatch: jest.Mock;
    const mockDefaultPreparePplQuery = languagesModule.defaultPreparePplQuery as jest.MockedFunction<
      typeof languagesModule.defaultPreparePplQuery
    >;

    beforeEach(() => {
      mockGetState = jest.fn();
      mockDispatch = jest.fn();

      configureStore({
        reducer: {
          query: (state = { query: '', language: 'PPL', dataset: null }) => state,
          ui: (state = { activeTabId: '' }) => state,
          results: (state = {}) => state,
          legacy: (state = { interval: '1h' }) => state,
          queryEditor: (state = { breakdownField: undefined }) => state,
        },
      });

      mockDefaultPreparePplQuery.mockReturnValue({
        query: 'source=test-dataset',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      });
    });

    it('should return early when no services provided', async () => {
      const mockState = {
        query: { query: '', language: 'PPL', dataset: null },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);

      const thunk = executeQueries({ services: undefined as any });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/pending' })
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/fulfilled' })
      );
    });

    it('should handle empty query string', async () => {
      const mockState = {
        query: { query: '', language: 'PPL', dataset: null },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      (mockServices.tabRegistry.getTab as jest.Mock).mockReturnValue({
        prepareQuery: jest.fn().mockReturnValue('source=test-dataset'),
      });

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/fulfilled' })
      );
    });

    it('should handle cached results correctly', async () => {
      const mockState = {
        query: { query: 'source=logs', language: 'PPL', dataset: null },
        ui: { activeTabId: 'logs' },
        results: {
          'source=test-dataset': { hits: { hits: [] } },
        },
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      (mockServices.tabRegistry.getTab as jest.Mock).mockReturnValue({
        prepareQuery: jest.fn().mockReturnValue('source=test-dataset'),
      });

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/fulfilled' })
      );
    });

    it('should handle visualization tab query execution', async () => {
      const mockState = {
        query: { query: 'source=logs', language: 'PPL', dataset: null },
        ui: { activeTabId: 'explore_visualization_tab' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      (mockServices.tabRegistry.getTab as jest.Mock).mockImplementation((tabId: string) => {
        if (tabId === 'explore_visualization_tab') {
          return { prepareQuery: jest.fn().mockReturnValue('viz-query') };
        }
        return null;
      });

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.tabRegistry.getTab).toHaveBeenCalledWith('explore_visualization_tab');
    });

    it('should skip histogram query when language is PROMQL', async () => {
      mockDispatch.mockClear();

      const mockState = {
        query: { query: 'up{job="prometheus"}', language: 'PROMQL', dataset: null },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      mockDefaultPreparePplQuery.mockReturnValue({
        query: 'up{job="prometheus"}',
        language: 'PROMQL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      });

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      const dispatchedThunks = mockDispatch.mock.calls.filter(
        (call) => typeof call[0] === 'function'
      );
      expect(dispatchedThunks.length).toBeGreaterThanOrEqual(1);

      const histogramActions = mockDispatch.mock.calls.filter(
        (call) =>
          call[0]?.type === 'query/executeHistogramQuery/pending' ||
          call[0]?.type?.includes('executeHistogramQuery')
      );
      expect(histogramActions).toHaveLength(0);
    });

    it('should handle missing tab registry gracefully', async () => {
      const mockState = {
        query: { query: 'source=logs', language: 'PPL', dataset: null },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      (mockServices.tabRegistry.getTab as jest.Mock).mockReturnValue(null);

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/fulfilled' })
      );
    });
  });

  describe('executeHistogramQuery', () => {
    let mockGetState: jest.Mock;
    let mockDispatch: jest.Mock;
    const mockCreateHistogramConfigs = chartUtilsModule.createHistogramConfigs as jest.MockedFunction<
      typeof chartUtilsModule.createHistogramConfigs
    >;

    beforeEach(() => {
      mockGetState = jest.fn();
      mockDispatch = jest.fn();

      mockGetState.mockReturnValue({
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'test', type: 'INDEX_PATTERN' },
        },
        legacy: { interval: '1h' },
        ui: { activeTabId: 'test-tab' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      });

      const mockIndexPatterns = dataPublicModule.indexPatterns as any;
      mockIndexPatterns.isDefault.mockReturnValue(true);

      // Using mockCreateHistogramConfigs from module scope
      mockCreateHistogramConfigs.mockReturnValue({
        toDsl: jest.fn().mockReturnValue([
          {},
          {},
          {
            date_histogram: {
              fixed_interval: '5m',
              field: '@timestamp',
            },
          },
        ]),
        aggs: [
          {} as any,
          {
            buckets: {
              getInterval: jest.fn(() => ({ interval: '1h', scale: 1 })),
            },
          } as any,
        ],
      } as any);
      mockSearchSource.fetch.mockReset();
      mockSearchSource.fetch.mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { field1: 'value1' } },
            { _id: '2', _source: { field2: 'value2' } },
          ],
          total: 2,
        },
        took: 5,
        aggregations: {
          histogram: {
            buckets: [
              { key: 1609459200000, doc_count: 5 },
              { key: 1609462800000, doc_count: 3 },
            ],
          },
        },
      });
    });

    it('should execute histogram query with custom interval', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '5m',
      };

      const thunk = executeHistogramQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          }),
        })
      );
    });

    it('should execute histogram query with formatter in language config', async () => {
      const mockFormatter = jest.fn();
      (mockServices.data.query.queryString.getLanguageService as jest.Mock).mockReturnValue({
        getLanguage: jest.fn().mockReturnValue({
          fields: {
            formatter: mockFormatter,
          },
        }),
      });

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '5m',
      };

      const thunk = executeHistogramQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          abortSignal: expect.any(Object),
          formatter: mockFormatter,
        })
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          }),
        })
      );
    });

    it('should execute histogram query without formatter in language config', async () => {
      (mockServices.data.query.queryString.getLanguageService as jest.Mock).mockReturnValue({
        getLanguage: jest.fn().mockReturnValue({}),
      });

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '5m',
      };

      const thunk = executeHistogramQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalledWith(
        expect.objectContaining({
          abortSignal: expect.any(Object),
          withLongNumeralsSupport: false,
        })
      );
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          }),
        })
      );
    });

    it('should handle missing interval gracefully', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeHistogramQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          }),
        })
      );
    });

    it('should handle dataView without timeFieldName', async () => {
      const dataViewWithoutTime = { ...mockDataView, timeFieldName: null };
      (mockServices.data.dataViews.get as jest.Mock).mockResolvedValue(dataViewWithoutTime);

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '1h',
      };

      const thunk = executeHistogramQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);
      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          }),
        })
      );
    });

    it('should handle search errors gracefully', async () => {
      const error = {
        body: {
          error: 'Search failed',
          message: JSON.stringify({
            error: {
              details: 'Query syntax error',
              reason: 'Invalid query',
              type: 'parsing_exception',
            },
          }),
          statusCode: 400,
        },
      };
      mockSearchSource.fetch.mockRejectedValue(error);

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '1h',
      };

      const thunk = executeHistogramQuery(params);

      try {
        await thunk(mockDispatch, mockGetState, undefined);
      } catch (e) {
        expect(e).toBe(error);
      }

      // Verify error status is set in Redux
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.ERROR,
              error: expect.objectContaining({
                error: 'Search failed',
                message: {
                  details: 'Query syntax error',
                  reason: 'Invalid query',
                  type: 'parsing_exception',
                },
                statusCode: 400,
              }),
            }),
          }),
        })
      );
    });

    it('should handle search errors with non-JSON error message', async () => {
      const error = {
        name: 'SearchError',
        message: 'Connection timeout',
        body: {
          error: 'Connection failed',
          message: 'This is a plain text error message, not JSON',
          statusCode: 500,
        },
      };
      mockSearchSource.fetch.mockRejectedValue(error);

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '1h',
      };

      const thunk = executeHistogramQuery(params);

      try {
        await thunk(mockDispatch, mockGetState, undefined);
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.ERROR,
              error: expect.objectContaining({
                error: 'Connection failed',
                message: {
                  details: 'Connection failed',
                  reason: 'This is a plain text error message, not JSON',
                  type: 'SearchError',
                },
                statusCode: 500,
                originalErrorMessage: 'This is a plain text error message, not JSON',
              }),
            }),
          }),
        })
      );
    });

    it('should handle AbortError gracefully', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockSearchSource.fetch.mockRejectedValue(abortError);

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '1h',
      };

      const thunk = executeHistogramQuery(params);
      const result = await thunk(mockDispatch, mockGetState, undefined);

      expect(result.payload).toBeUndefined();
      expect(mockServices.data.search.showError).not.toHaveBeenCalled();
    });
  });

  describe('executeDataTableQuery', () => {
    let mockGetState: jest.Mock;
    let mockDispatch: jest.Mock;

    beforeEach(() => {
      mockGetState = jest.fn();
      mockDispatch = jest.fn();

      mockGetState.mockReturnValue({
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'test', type: 'INDEX_PATTERN' },
        },
      });

      const mockIndexPatterns = dataPublicModule.indexPatterns as any;
      mockIndexPatterns.isDefault.mockReturnValue(true);
    });

    it('should execute data table query successfully', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-datatable-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeDataTableQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(setResults).toHaveBeenCalled();
    });

    it('should execute without histogram aggregations', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-datatable-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeDataTableQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      // Verify that no aggregations are added to the search source
      expect(mockSearchSource.setField).not.toHaveBeenCalledWith('aggs', expect.anything());
    });

    it('should set query status to READY when results found', async () => {
      mockSearchSource.fetch.mockResolvedValue({
        hits: {
          hits: [{ _id: '1', _source: { field: 'value' } }],
          total: 1,
        },
      });

      const params = {
        services: mockServices,
        cacheKey: 'test-datatable-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeDataTableQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: {
            cacheKey: 'test-datatable-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          },
        })
      );
    });

    it('should use separate cache key from query string', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'source=logs__datatable',
        queryString: 'source=logs',
      };

      const thunk = executeDataTableQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      // Verify that results are stored with the cache key, not query string
      expect(setResults).toHaveBeenCalledWith({
        cacheKey: 'source=logs__datatable',
        results: expect.any(Object),
      });
    });
  });

  describe('executeTabQuery', () => {
    let mockGetState: jest.Mock;
    let mockDispatch: jest.Mock;

    beforeEach(() => {
      mockGetState = jest.fn();
      mockDispatch = jest.fn();

      mockGetState.mockReturnValue({
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'test', type: 'INDEX_PATTERN' },
        },
        ui: {
          activeTabId: 'test-tab',
        },
      });

      const mockIndexPatterns = dataPublicModule.indexPatterns as any;
      mockIndexPatterns.isDefault.mockReturnValue(true);
      mockSearchSource.fetch.mockReset();
      mockSearchSource.fetch.mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { field1: 'value1' } },
            { _id: '2', _source: { field2: 'value2' } },
          ],
          total: 2,
        },
        took: 5,
      });
    });

    it('should execute tab query successfully', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockServices.data.dataViews.get).toHaveBeenCalled();
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(setResults).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          }),
        })
      );
    });

    it('should handle missing services gracefully', async () => {
      const params = {
        services: undefined as any,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      const result = await thunk(mockDispatch, mockGetState, undefined);

      expect(result.payload).toBeUndefined();
    });

    it('should handle dataset not found error', async () => {
      (mockServices.data.dataViews.get as jest.Mock).mockResolvedValue(null);

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);

      try {
        await thunk(mockDispatch, mockGetState, undefined);
      } catch (error) {
        expect(error.message).toBe('Dataset not found for query execution');
      }
    });

    it('should handle custom size parameter', async () => {
      const customSize = 1000;
      (mockServices.uiSettings.get as jest.Mock).mockImplementation((key: string) => {
        if (key === SAMPLE_SIZE_SETTING) return customSize;
        return false;
      });

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSearchSource.setFields).toHaveBeenCalledWith(
        expect.objectContaining({ size: customSize })
      );
    });

    it('should handle non-default dataView in time filter logic', async () => {
      const mockIndexPatterns = dataPublicModule.indexPatterns as any;
      mockIndexPatterns.isDefault.mockReturnValue(false);

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSearchSource.setParent).toHaveBeenCalled();
    });

    it('should set query status to LOADING initially', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: {
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.LOADING,
            }),
          },
        })
      );
    });

    it('should set query status to READY when results found', async () => {
      mockSearchSource.fetch.mockResolvedValue({
        hits: {
          hits: [{ _id: '1', _source: { field: 'value' } }],
          total: 1,
        },
      });

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: {
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.READY,
            }),
          },
        })
      );
    });

    it('should set query status to NO_RESULTS when no hits found', async () => {
      mockSearchSource.fetch.mockResolvedValue({
        hits: {
          hits: [],
          total: 0,
        },
      });

      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: {
            cacheKey: 'test-cache-key',
            status: expect.objectContaining({
              status: QueryExecutionStatus.NO_RESULTS,
            }),
          },
        })
      );
    });

    it('should handle inspector request stats', async () => {
      const params = {
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
      };

      const thunk = executeTabQuery(params);
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockInspectorRequest.stats).toHaveBeenCalled();
      expect(mockInspectorRequest.json).toHaveBeenCalled();
      expect(mockInspectorRequest.ok).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle moment duration calculations in transformAggregationToChartData', () => {
      const rawResults = {
        hits: { hits: [], total: 0 },
        aggregations: {
          histogram: {
            buckets: [
              { key: 1609459200000, doc_count: 5 },
              { key: 1609462800000, doc_count: 3 },
            ],
          },
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData!.ordered.interval).toBeDefined();
      expect(result.chartData!.ordered.intervalOpenSearchValue).toBe(3600000); // 1 hour in ms
    });

    it('should handle missing aggregations gracefully', () => {
      const rawResults = {
        hits: { hits: [], total: 0 },
        elapsedMs: 50,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      expect(result.chartData).toBeUndefined();
      expect(result.bucketInterval).toBeUndefined();
    });

    it('should handle dataView without timeFieldName in chart data', () => {
      const dataViewWithoutTime = { ...mockDataView, timeFieldName: undefined } as any;
      const rawResults = {
        hits: { hits: [], total: 0 },
        aggregations: {
          histogram: {
            buckets: [{ key: 1609459200000, doc_count: 5 }],
          },
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, dataViewWithoutTime);

      expect(result.chartData!.xAxisLabel).toBe('Time');
    });

    it('should handle complex field flattening in defaultResultsProcessor', () => {
      const complexDataView = {
        ...mockDataView,
        flattenHit: jest.fn((hit) => {
          const flattened: any = {};
          if (hit._source.nested?.field1) flattened['nested.field1'] = hit._source.nested.field1;
          if (hit._source.nested?.field2) flattened['nested.field2'] = hit._source.nested.field2;
          if (hit._source.simple) flattened.simple = hit._source.simple;
          return flattened;
        }),
      } as any;

      const rawResults = {
        hits: {
          hits: [
            {
              _id: '1',
              _source: { nested: { field1: 'value1', field2: 'value2' }, simple: 'simple1' },
            },
            { _id: '2', _source: { nested: { field1: 'value3' }, simple: 'simple2' } },
          ],
          total: 2,
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, complexDataView);

      expect(result.fieldCounts).toEqual({
        'nested.field1': 2,
        'nested.field2': 1,
        simple: 2,
      });
    });
  });

  describe('Integration Tests', () => {
    const mockDefaultPreparePplQuery = languagesModule.defaultPreparePplQuery as jest.MockedFunction<
      typeof languagesModule.defaultPreparePplQuery
    >;

    it('should handle full query execution flow', async () => {
      mockDefaultPreparePplQuery.mockReturnValue({
        query: 'source=test-dataset | stats count()',
        language: 'PPL',
        dataset: { id: 'test-dataset', title: 'test-dataset', type: 'INDEX_PATTERN' },
      });

      const mockState = {
        query: { query: 'source=test-dataset | stats count()', language: 'PPL', dataset: null },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      const mockGetState = jest.fn().mockReturnValue(mockState);
      const mockDispatch = jest.fn();

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/fulfilled' })
      );
    });

    it('should handle multiple concurrent queries', async () => {
      const promises = [
        executeHistogramQuery({
          services: mockServices,
          cacheKey: 'histogram-query',
          queryString: 'source=logs',
          interval: '1h',
        }),
        executeTabQuery({
          services: mockServices,
          cacheKey: 'tab-query',
          queryString: 'source=logs',
        }),
        executeDataTableQuery({
          services: mockServices,
          cacheKey: 'datatable-query',
          queryString: 'source=logs',
        }),
      ];

      const mockGetState = jest.fn().mockReturnValue({
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'test', type: 'INDEX_PATTERN' },
        },
        legacy: { interval: '1h' },
        ui: { activeTabId: 'test-tab' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      });
      const mockDispatch = jest.fn();

      const results = await Promise.all(
        promises.map((thunk) => thunk(mockDispatch, mockGetState, undefined))
      );

      expect(results).toHaveLength(3);
      expect(mockSearchSource.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
