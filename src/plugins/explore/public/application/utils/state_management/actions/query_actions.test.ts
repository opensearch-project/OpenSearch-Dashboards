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
  buildSQLHistogramQuery: jest.fn((queryString) => queryString),
  buildSQLTopBreakdownQuery: jest.fn((queryString) => queryString),
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
  queryHasAggregation: jest.fn(() => false),
}));

import { configureStore } from '@reduxjs/toolkit';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../../services/source_type_registry';
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
  executeBucketCountQuery,
  shouldSkipQueryExecution,
} from './query_actions';
import { QueryExecutionStatus } from '../types';
import { setResults } from '../slices';
import * as utilsModule from './utils';
import { queryHasAggregation } from './utils';
import { Query, DataView } from 'src/plugins/data/common';
import { ExploreServices } from '../../../../types';
import {
  SAMPLE_SIZE_SETTING,
  ASYNC_QUERY_POLL_INTERVAL_SETTING,
  ExploreFlavor,
} from '../../../../../common';

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
import { getCurrentFlavor } from '../../../../helpers/get_flavor_from_app_id';
import * as traceQueryActionsModule from './trace_query_actions';
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
  clearResultsByKey: jest.fn((cacheKey: string) => ({
    type: 'results/clearResultsByKey',
    payload: cacheKey,
  })),
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
      signal: { aborted: false, addEventListener: jest.fn() },
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
    // Stop stays up while the Traces RED metrics queries run, so it must be able to cancel them.
    it('also aborts the RED metrics queries', () => {
      const abortTraceQueries = jest.spyOn(traceQueryActionsModule, 'abortAllTraceQueries');
      abortAllActiveQueries();
      expect(abortTraceQueries).toHaveBeenCalledTimes(1);
      abortTraceQueries.mockRestore();
    });

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
    const mockDefaultPreparePplQuery =
      languagesModule.defaultPreparePplQuery as jest.MockedFunction<
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

    it('should pass SQL queries through unchanged', () => {
      const sqlQuery: Query = {
        query: 'SELECT * FROM logs WHERE status = "error"',
        language: 'SQL',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      };

      const result = defaultPrepareQueryString(sqlQuery);
      expect(result).toBe('SELECT * FROM logs WHERE status = "error"');
    });

    it('should throw error for unhandled language', () => {
      const unsupportedQuery: Query = {
        query: 'some query',
        language: 'UNSUPPORTED_LANG' as any,
      };

      expect(() => defaultPrepareQueryString(unsupportedQuery)).toThrow(
        'defaultPrepareQueryString encountered unhandled language: UNSUPPORTED_LANG'
      );
    });

    it("passes a source type language's query through unchanged", () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'fake',
        label: 'Fake',
        datasetTypes: ['FAKE'],
        flavors: [ExploreFlavor.Logs],
        resolveDefaultDataset: async () => undefined,
        languageSettings: { FakeQL: {} },
      });
      setSourceTypeRegistry(registry);

      try {
        expect(
          defaultPrepareQueryString({ query: 'fields @message | limit 5', language: 'FakeQL' })
        ).toBe('fields @message | limit 5');
      } finally {
        setSourceTypeRegistry(new SourceTypeRegistryService());
      }
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
    const mockDefaultPreparePplQuery =
      languagesModule.defaultPreparePplQuery as jest.MockedFunction<
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
        nonEmptyFieldCounts: {
          field1: 2,
          field2: 1,
          field3: 1,
        },
        dataset: mockDataView,
        elapsedMs: 100,
      });
    });

    it('should exclude empty values from nonEmptyFieldCounts but not fieldCounts', () => {
      // Tabular responses (e.g. PPL) put every schema field on every row, using null for the
      // ones a document doesn't populate.
      const rawResults = {
        hits: {
          hits: [
            {
              _id: '1',
              _source: {
                populated: 'value1',
                empty: null,
                sparse: null,
                falsy: 0,
                empty_array: [],
                null_array: [null],
              },
            },
            {
              _id: '2',
              _source: {
                populated: 'value2',
                empty: null,
                sparse: 'value3',
                falsy: false,
                empty_array: [],
                null_array: [null],
              },
            },
          ],
          total: 2,
        },
        elapsedMs: 100,
      } as any;

      const result = defaultResultsProcessor(rawResults, mockDataView);

      // Every field is "present" on both rows
      expect(result.fieldCounts).toEqual({
        populated: 2,
        empty: 2,
        sparse: 2,
        falsy: 2,
        empty_array: 2,
        null_array: 2,
      });
      // Only fields carrying real values are counted; 0 and false count, nulls don't
      expect(result.nonEmptyFieldCounts).toEqual({
        populated: 2,
        sparse: 1,
        falsy: 2,
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
    const mockCreateHistogramConfigs =
      chartUtilsModule.createHistogramConfigs as jest.MockedFunction<
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

      const mockBuildChartFromBreakdownSeries =
        chartUtilsModule.buildChartFromBreakdownSeries as jest.MockedFunction<
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

      const mockBuildChartFromBreakdownSeries =
        chartUtilsModule.buildChartFromBreakdownSeries as jest.MockedFunction<
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

      const mockBuildChartFromBreakdownSeries =
        chartUtilsModule.buildChartFromBreakdownSeries as jest.MockedFunction<
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
    const mockDefaultPreparePplQuery =
      languagesModule.defaultPreparePplQuery as jest.MockedFunction<
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

    // Stop renders on `isLoading && hasUserInitiatedQuery`, and the flag used to be set only by the
    // editor's Run. A page load, time-range change or dataset change goes straight to
    // executeQueries, so those ran a cancellable query while offering no way to cancel it.
    it('marks the query as user-initiated, so Stop is offered however it started', async () => {
      mockGetState.mockReturnValue({
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: { id: 'd', title: 'd', type: 'INDEX_PATTERN' },
        },
        ui: { activeTabId: 'logs' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      });

      await executeQueries({
        services: { tabRegistry: { getTab: jest.fn() } } as unknown as ExploreServices,
      })(mockDispatch, mockGetState, undefined);

      const types = mockDispatch.mock.calls
        .map(([a]) => (typeof a === 'object' && a !== null ? a.type : undefined))
        .filter(Boolean);
      expect(types).toContain('queryEditor/setHasUserInitiatedQuery');
      const flag = mockDispatch.mock.calls
        .map(([a]) => a)
        .find((a) => typeof a === 'object' && a?.type === 'queryEditor/setHasUserInitiatedQuery');
      expect(flag.payload).toBe(true);
    });

    // Tab queries are dispatched only once the data table settles. Unless the run itself counts as
    // running until then, the overall status settles in between and Stop turns back into Run while
    // the tab query is still to come.
    describe('tab queries queued behind the data table', () => {
      const TAB_QUERY = 'source=logs | stats count() by host';
      const PATTERNS_TAB = 'patterns';

      interface Dispatched {
        type?: string;
        payload?: unknown;
      }
      interface StatusPayload {
        cacheKey: string;
        status: { status: QueryExecutionStatus };
      }

      let resolveDataTable: () => void;
      let dataTableSettled: boolean;
      let dispatch: jest.Mock<unknown, [unknown]>;

      const tabServices = () =>
        ({
          uiSettings: { get: jest.fn(() => false) },
          capabilities: { queryEnhancements: {} },
          tabRegistry: {
            getTab: jest.fn((id: string) => {
              if (id === 'explore_visualization_tab') return { prepareQuery: () => TAB_QUERY };
              // Like the patterns tab, this one can only build its query from the logs results.
              if (id === PATTERNS_TAB) {
                return {
                  prepareQuery: () => (dataTableSettled ? 'source=logs | patterns message' : ''),
                };
              }
              return undefined;
            }),
          },
        }) as unknown as ExploreServices;

      const stateFor = (activeTabId: string) => ({
        query: {
          query: TAB_QUERY,
          language: 'PPL',
          dataset: { id: 'd', title: 'd', type: 'INDEX_PATTERN' },
        },
        ui: { activeTabId },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      });

      const thunkCount = () =>
        dispatch.mock.calls.filter(([action]) => typeof action === 'function').length;

      // Replays the status actions in dispatch order. `atThunks` records, for each thunk
      // dispatched, whether some query counted as LOADING at that moment.
      const replay = () => {
        const statusMap: Record<string, QueryExecutionStatus> = {};
        const atThunks: boolean[] = [];
        for (const [action] of dispatch.mock.calls) {
          if (typeof action === 'function') {
            atThunks.push(Object.values(statusMap).includes(QueryExecutionStatus.LOADING));
            continue;
          }
          const { type, payload } = action as Dispatched;
          if (type === 'queryEditor/setIndividualQueryStatus') {
            const { cacheKey, status } = payload as StatusPayload;
            statusMap[cacheKey] = status.status;
          } else if (type === 'queryEditor/clearQueryStatusMapByKey') {
            delete statusMap[payload as string];
          }
        }
        return { statusMap, atThunks };
      };

      const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

      beforeEach(() => {
        mockGetState.mockReturnValue(stateFor('logs'));
        dataTableSettled = false;
        const dataTable = new Promise<void>((resolve) => {
          resolveDataTable = () => {
            dataTableSettled = true;
            resolve();
          };
        });
        // Only the data table query is awaited; every thunk shares its promise.
        dispatch = jest.fn((action: unknown) =>
          typeof action === 'function' ? dataTable : action
        );
        // Every AbortController in this file is the one mock, so aborting it aborts them all.
        const onAbort: Array<() => void> = [];
        mockAbortController.signal.addEventListener = jest.fn(
          (_type: string, listener: () => void) => onAbort.push(listener)
        );
        mockAbortController.abort = jest.fn(() => {
          mockAbortController.signal.aborted = true;
          onAbort.forEach((listener) => listener());
        });
      });

      it('keeps the run LOADING until its tab query has been dispatched', async () => {
        const run = executeQueries({ services: tabServices() })(dispatch, mockGetState, undefined);
        await flush();
        const thunksBeforeSettle = thunkCount();

        resolveDataTable();
        await run;

        // The tab query is dispatched once the data table settles, while the run still counts
        // as LOADING.
        expect(thunkCount()).toBe(thunksBeforeSettle + 1);
        const { atThunks } = replay();
        expect(atThunks[atThunks.length - 1]).toBe(true);
      });

      it("builds the active tab's query from the data table results", async () => {
        mockGetState.mockReturnValue(stateFor(PATTERNS_TAB));
        const run = executeQueries({ services: tabServices() })(dispatch, mockGetState, undefined);
        await flush();
        const thunksBeforeSettle = thunkCount();

        resolveDataTable();
        await run;

        // Both the visualization and the patterns tab query run.
        expect(thunkCount()).toBe(thunksBeforeSettle + 2);
      });

      it('does not run them once the user has stopped the run', async () => {
        const run = executeQueries({ services: tabServices() })(dispatch, mockGetState, undefined);
        await flush();
        const thunksBeforeStop = thunkCount();

        abortAllActiveQueries();
        // The run stops counting as LOADING right away, not once the data table settles.
        expect(replay().statusMap).toEqual({});
        resolveDataTable();
        await run;

        expect(thunkCount()).toBe(thunksBeforeStop);
        // Stopping leaves no status behind for queries that never ran.
        expect(replay().statusMap).toEqual({});
      });

      it('runs nothing when stopped before the data table query is sent', async () => {
        const run = executeQueries({ services: tabServices() })(dispatch, mockGetState, undefined);
        abortAllActiveQueries();
        resolveDataTable();
        await run;

        expect(thunkCount()).toBe(0);
        expect(replay().statusMap).toEqual({});
      });

      // A run whose follow-up work fails must only clean up after itself: the same tab key may by
      // then belong to a newer run.
      it("leaves a newer run's tab status alone when an older run fails", async () => {
        (getCurrentFlavor as jest.Mock).mockRejectedValueOnce(new Error('flavor lookup failed'));
        const older = executeQueries({ services: tabServices() })(
          dispatch,
          mockGetState,
          undefined
        );
        const newer = executeQueries({ services: tabServices() })(
          dispatch,
          mockGetState,
          undefined
        );
        await flush();

        resolveDataTable();
        await Promise.all([older, newer]);

        const tabStatuses = dispatch.mock.calls
          .map(([action]) => action as Dispatched)
          .filter((action) => action.type === 'queryEditor/setIndividualQueryStatus')
          .map((action) => action.payload as StatusPayload)
          .filter((payload) => payload.cacheKey === TAB_QUERY)
          .map((payload) => payload.status.status);
        expect(tabStatuses).not.toContain(QueryExecutionStatus.UNINITIALIZED);
        expect(replay().statusMap).toEqual({});
      });
    });

    // An engine without the async PPL API only reveals that at submit. Nothing has been rendered
    // at that point, so the query must fall back to the non-streaming path rather than error.
    describe('when a streaming run reports itself unavailable', () => {
      const STREAMING_SETTING = 'explore:enableStreamingResults';

      const streamingServices = () =>
        ({
          uiSettings: { get: jest.fn((key: string) => key === STREAMING_SETTING) },
          capabilities: { queryEnhancements: { pplStreaming: true } },
          data: {
            query: {
              timefilter: { timefilter: { getTime: () => ({ from: 'now-15m', to: 'now' }) } },
              queryString: {
                getLanguageService: () => ({
                  getLanguage: () => ({ fields: { formatter: (value: any) => value } }),
                }),
              },
            },
            dataViews: { get: jest.fn().mockResolvedValue(undefined) },
          },
          tabRegistry: { getTab: jest.fn() },
        }) as any;

      const stateWithPplDataset = () => ({
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: {
            id: 'ds',
            title: 'logs',
            type: 'INDEX_PATTERN',
            dataSource: { engineType: 'OpenSearch' },
          },
        },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      });

      // Submit fails here because no http service is stubbed, so the run publishes nothing and
      // reports itself unavailable.
      it('re-runs the data table query on the standard path', async () => {
        mockGetState.mockReturnValue(stateWithPplDataset());
        // Annotated because the mock references itself for thunk actions, which otherwise
        // infers as any.
        const dispatch: jest.Mock = jest.fn((action: any) => {
          if (typeof action === 'function') return action(dispatch, mockGetState, undefined);
          return action;
        });

        await executeQueries({ services: streamingServices() })(
          dispatch as any,
          mockGetState,
          undefined
        );

        const dispatchedTypes = dispatch.mock.calls
          .map(([action]: any[]) => action?.type)
          .filter(Boolean);
        expect(dispatchedTypes.some((type: string) => type.includes('executeDataTableQuery'))).toBe(
          true
        );
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

    it('runs nothing at all for a blank SQL query', async () => {
      mockDispatch.mockClear();

      const mockState = {
        query: { query: '   ', language: 'SQL', dataset: null },
        ui: { activeTabId: 'logs' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      (mockServices.tabRegistry.getTab as jest.Mock).mockReturnValue({
        prepareQuery: jest.fn().mockReturnValue(''),
      });

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      // Neither the empty query nor the histogram's `FROM ()` reaches the cluster.
      const dispatchedThunks = mockDispatch.mock.calls.filter(
        (call) => typeof call[0] === 'function'
      );
      expect(dispatchedThunks).toHaveLength(0);
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'query/executeQueries/fulfilled' })
      );
    });

    it('still runs a non-empty SQL query', async () => {
      mockDispatch.mockClear();

      const mockState = {
        query: { query: 'SELECT * FROM logs', language: 'SQL', dataset: null },
        ui: { activeTabId: 'logs' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);
      (mockServices.tabRegistry.getTab as jest.Mock).mockReturnValue({
        prepareQuery: jest.fn().mockReturnValue('SELECT * FROM logs'),
      });

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

      const dispatchedThunks = mockDispatch.mock.calls.filter(
        (call) => typeof call[0] === 'function'
      );
      expect(dispatchedThunks.length).toBeGreaterThanOrEqual(1);
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

    it('should skip histogram query when language is SQL', async () => {
      mockDispatch.mockClear();

      const mockState = {
        query: { query: 'SELECT * FROM logs', language: 'SQL', dataset: null },
        ui: { activeTabId: '' },
        results: {},
        legacy: { interval: '1h' },
        queryEditor: { breakdownField: undefined, queryStatusMap: {} },
      };

      mockGetState.mockReturnValue(mockState);

      const thunk = executeQueries({ services: mockServices });
      await thunk(mockDispatch, mockGetState, undefined);

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
    const mockCreateHistogramConfigs =
      chartUtilsModule.createHistogramConfigs as jest.MockedFunction<
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

    describe("a source's own histogram query", () => {
      const buildHistogramQuery = jest.fn();
      const sentQuery = () =>
        (mockSearchSource.setFields as jest.Mock).mock.calls.find((c) => c[0]?.query)?.[0]?.query
          ?.query;
      const run = (language: string) => {
        mockGetState.mockReturnValue({
          query: { query: 'my query', language, dataset: { id: 'test', type: 'MY_SOURCE' } },
          legacy: { interval: '1h' },
          ui: { activeTabId: 'test-tab' },
          queryEditor: { breakdownField: undefined, queryStatusMap: {} },
        });
        const thunk = executeHistogramQuery({
          services: mockServices,
          cacheKey: 'histogram-key',
          queryString: 'my query',
          interval: '1h',
        });
        return thunk(mockDispatch, mockGetState, undefined);
      };

      beforeEach(() => {
        buildHistogramQuery.mockReset();
        (mockSearchSource.setFields as jest.Mock).mockClear();
        const registry = new SourceTypeRegistryService();
        registry.register({
          id: 'my-source',
          label: 'My source',
          datasetTypes: ['MY_SOURCE'],
          flavors: [ExploreFlavor.Logs],
          resolveDefaultDataset: async () => undefined,
          languageSettings: {
            MyQL: { buildHistogramQuery },
            PPL: { buildHistogramQuery },
            SQL: { buildHistogramQuery },
          },
        });
        setSourceTypeRegistry(registry);
      });

      afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

      it('sends the query the source builds, from the resolved interval', async () => {
        buildHistogramQuery.mockReturnValue('my query | histogram');
        await run('MyQL');

        expect(buildHistogramQuery).toHaveBeenCalledWith('my query', {
          interval: '5m',
          timeFieldName: 'endTime',
          breakdownField: undefined,
        });
        expect(sentQuery()).toBe('my query | histogram');
        expect(utilsModule.processRawResultsForHistogram).toHaveBeenCalledWith(
          'my query | histogram',
          expect.anything(),
          expect.anything(),
          false
        );
      });

      it("uses the source's builder over Explore's for a built-in language id", async () => {
        buildHistogramQuery.mockReturnValue('my ppl histogram');
        (utilsModule.buildPPLHistogramQuery as jest.Mock).mockClear();
        await run('PPL');

        expect(utilsModule.buildPPLHistogramQuery).not.toHaveBeenCalled();
        expect(sentQuery()).toBe('my ppl histogram');
      });

      it('sends nothing and settles the key with no results when the source builds no query', async () => {
        buildHistogramQuery.mockReturnValue(undefined);
        await run('MyQL');

        expect(mockSearchSource.fetch).not.toHaveBeenCalled();
        // Settled through setIndividualQueryStatus, so the overall status leaves LOADING.
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'histogram-key',
              status: expect.objectContaining({ status: QueryExecutionStatus.NO_RESULTS }),
            }),
          })
        );
        expect(mockServices.inspectorAdapters.requests.start).not.toHaveBeenCalled();
      });

      it("parses a source's histogram on the SQL id with the source's columns, not SQL's", async () => {
        buildHistogramQuery.mockReturnValue('my sql histogram');
        await run('SQL');

        expect(utilsModule.buildSQLHistogramQuery).not.toHaveBeenCalled();
        expect(utilsModule.processRawResultsForHistogram).toHaveBeenLastCalledWith(
          'my sql histogram',
          expect.anything(),
          expect.anything(),
          false
        );
      });

      describe('an older run that builds no query', () => {
        const deferred = () => {
          let resolve: (v: unknown) => void = () => undefined;
          const promise = new Promise((r) => (resolve = r));
          return { promise, resolve };
        };
        const settledNoResults = () =>
          mockDispatch.mock.calls.some(
            ([action]) =>
              action?.type === 'queryEditor/setIndividualQueryStatus' &&
              action.payload?.status?.status === QueryExecutionStatus.NO_RESULTS
          );

        it.each([
          ['while the newer run is still in flight', true],
          ['after the newer run finished', false],
        ])("leaves the newer run's key alone %s", async (_label, olderFirst) => {
          // A fresh controller per run; starting the second run aborts the first.
          (global.AbortController as jest.Mock).mockImplementation(() => {
            const controller = {
              signal: { aborted: false },
              abort: jest.fn(() => {
                controller.signal.aborted = true;
              }),
            };
            return controller;
          });
          const older = deferred();
          const newer = deferred();
          (mockServices.data.dataViews.get as jest.Mock)
            .mockReturnValueOnce(older.promise)
            .mockReturnValueOnce(newer.promise);
          buildHistogramQuery.mockImplementation(() =>
            buildHistogramQuery.mock.calls.length === (olderFirst ? 1 : 2)
              ? undefined
              : 'newer histogram'
          );

          const olderRun = run('MyQL');
          const newerRun = run('MyQL');
          // Both runs have started and wait on their data view (thunks start a few ticks late).
          await new Promise((r) => setTimeout(r, 0));
          if (olderFirst) {
            older.resolve(mockDataView);
            await olderRun;
            expect(settledNoResults()).toBe(false);
            newer.resolve(mockDataView);
            await newerRun;
          } else {
            newer.resolve(mockDataView);
            await newerRun;
            older.resolve(mockDataView);
            await olderRun;
          }
          expect(settledNoResults()).toBe(false);
        });
      });
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

    it('shows the message of an error without a body (e.g. a strategy start failure)', async () => {
      const error = new Error('The data source rejected the query');
      mockSearchSource.fetch.mockRejectedValue(error);

      const thunk = executeHistogramQuery({
        services: mockServices,
        cacheKey: 'test-cache-key',
        queryString: 'source=logs',
        interval: '1h',
      });

      try {
        await thunk(mockDispatch, mockGetState, undefined);
      } catch (e) {
        expect(e).toBe(error);
      }

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            status: expect.objectContaining({
              status: QueryExecutionStatus.ERROR,
              error: expect.objectContaining({
                message: expect.objectContaining({
                  details: 'The data source rejected the query',
                  reason: 'The data source rejected the query',
                }),
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

    describe('SQL breakdown two-pass flow', () => {
      const utilsMock = jest.requireMock('./utils');
      const histogramRows = { hits: { hits: [{ _id: '1', _source: {} }], total: 1 }, took: 1 };

      const useSQLWithBreakdown = () => {
        mockGetState.mockReturnValue({
          query: {
            query: 'SELECT * FROM logs',
            language: 'SQL',
            dataset: { id: 'test', type: 'INDEX_PATTERN' },
          },
          legacy: { interval: '1h' },
          ui: { activeTabId: 'test-tab' },
          queryEditor: { breakdownField: 'status', queryStatusMap: {} },
        });
        utilsMock.createHistogramConfigWithInterval.mockReturnValue({
          histogramConfigs: { toDsl: jest.fn().mockReturnValue({}), aggs: [{}, {}] },
          aggs: {},
          effectiveInterval: 'auto',
          finalInterval: '5m',
          fromDate: 'now-1h',
          toDate: 'now',
          timeFieldName: 'endTime',
          breakdownField: 'status',
        });
        utilsMock.buildSQLHistogramQuery.mockClear();
        mockSearchSource.fetch.mockReset();
      };

      const runHistogram = () =>
        executeHistogramQuery({
          services: mockServices,
          cacheKey: 'test-cache-key',
          queryString: 'SELECT * FROM logs',
          interval: '5m',
        })(mockDispatch, mockGetState, undefined);

      it('keeps the breakdown when the top-N pass returns values', async () => {
        useSQLWithBreakdown();
        mockSearchSource.fetch
          .mockResolvedValueOnce({
            hits: { hits: [{ _source: { breakdown: 'ok' } }], total: 1 },
          })
          .mockResolvedValueOnce(histogramRows);

        await runHistogram();

        expect(utilsMock.buildSQLHistogramQuery).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ breakdownField: 'status' }),
          ['ok']
        );
      });

      // Without a top-N list the breakdown expression is the bare field, which
      // would emit one series per distinct value.
      it('drops the breakdown when the top-N pass comes back empty', async () => {
        useSQLWithBreakdown();
        mockSearchSource.fetch
          .mockResolvedValueOnce({ hits: { hits: [], total: 0 } })
          .mockResolvedValueOnce(histogramRows);

        await runHistogram();

        expect(utilsMock.buildSQLHistogramQuery).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ breakdownField: undefined }),
          undefined
        );
      });

      it.each([
        ['3.9.0', true],
        ['3.10.2', true],
        ['3.8.0', false],
        ['2.19.1', false],
        [undefined, true],
        ['not-a-version', true],
      ])('data source version %s -> histogram built: %s', async (version, built) => {
        useSQLWithBreakdown();
        mockGetState.mockReturnValue({
          query: {
            query: 'SELECT * FROM logs',
            language: 'SQL',
            dataset: { id: 'test', type: 'INDEX_PATTERN' },
          },
          legacy: { interval: '1h' },
          ui: { activeTabId: 'test-tab' },
          queryEditor: { breakdownField: undefined, queryStatusMap: {} },
        });
        // The engine and version are read off the dataset convertToDataset returns, not off state.
        (mockServices.data.dataViews.convertToDataset as jest.Mock).mockReturnValue({
          id: 'test',
          type: 'INDEX_PATTERN',
          dataSource: { type: 'OpenSearch', engineType: 'OpenSearch', version },
        });
        utilsMock.createHistogramConfigWithInterval.mockReturnValue({
          histogramConfigs: { toDsl: jest.fn().mockReturnValue({}), aggs: [{}, {}] },
          aggs: {},
          effectiveInterval: 'auto',
          finalInterval: '5m',
          fromDate: 'now-1h',
          toDate: 'now',
          timeFieldName: 'endTime',
        });
        utilsMock.buildSQLHistogramQuery.mockClear();
        mockSearchSource.fetch.mockReset();
        mockSearchSource.fetch.mockResolvedValue(histogramRows);

        await runHistogram();

        expect(utilsMock.buildSQLHistogramQuery).toHaveBeenCalledTimes(built ? 1 : 0);
      });

      it('drops the breakdown when the top-N pass fails', async () => {
        useSQLWithBreakdown();
        mockSearchSource.fetch
          .mockRejectedValueOnce(new Error('pass 1 exploded'))
          .mockResolvedValueOnce(histogramRows);

        await runHistogram();

        expect(utilsMock.buildSQLHistogramQuery).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ breakdownField: undefined }),
          undefined
        );
      });
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

  describe('partial results from polling sources', () => {
    const mockGetState = jest.fn();
    let mockDispatch: jest.Mock;
    const finalResults = { hits: { hits: [{ _id: '1' }, { _id: '2' }], total: 2 } };
    const partialResults = { hits: { hits: [{ _id: '1' }], total: 1 } };
    const partialFrame = {
      schema: [{ name: 'message', type: 'string' }],
      meta: { progress: { recordsMatched: 1, recordsScanned: 10 } },
    };

    // A polling source reports one partial before the fetch resolves with the final result.
    const fetchWithOnePartial = (beforePartial?: () => void) =>
      mockSearchSource.fetch.mockImplementation(async (options: any) => {
        beforePartial?.();
        options.onPartialResults?.(partialResults, partialFrame);
        return finalResults;
      });

    const runDataTableQuery = (queryString = 'source=logs') =>
      executeDataTableQuery({
        services: mockServices,
        cacheKey: 'partial-cache-key',
        queryString,
      })(mockDispatch, mockGetState, undefined);

    const progressDispatches = () =>
      mockDispatch.mock.calls.filter(
        ([action]) =>
          action?.type === 'queryEditor/setIndividualQueryStatus' && action.payload.status.progress
      );

    // The key's LOADING entry, which a newer query's clearQueryStatusMap would remove.
    const stateWithKey = (present = true) => ({
      query: {
        query: 'source=logs',
        language: 'PPL',
        dataset: { id: 'test', type: 'INDEX_PATTERN' },
      },
      queryEditor: {
        queryStatusMap: present
          ? { 'partial-cache-key': { status: QueryExecutionStatus.LOADING } }
          : {},
      },
    });

    beforeEach(() => {
      mockDispatch = jest.fn();
      mockGetState.mockReturnValue(stateWithKey());
      (dataPublicModule.indexPatterns as any).isDefault.mockReturnValue(true);
      (queryHasAggregation as jest.Mock).mockReturnValue(false);
    });

    it('streams partial rows for a row query and reports scan progress', async () => {
      fetchWithOnePartial();

      await runDataTableQuery();

      expect(setResults).toHaveBeenCalledWith({
        cacheKey: 'partial-cache-key',
        results: expect.objectContaining({
          hits: partialResults.hits,
          fieldSchema: partialFrame.schema,
        }),
      });
      expect(setResults).toHaveBeenCalledTimes(2); // the partial, then the final result
      expect(progressDispatches()[0][0].payload.status).toMatchObject({
        status: QueryExecutionStatus.LOADING,
        progress: { recordsMatched: 1, recordsScanned: 10 },
      });
    });

    it('does not stream partials for an aggregation query', async () => {
      (queryHasAggregation as jest.Mock).mockReturnValue(true);
      fetchWithOnePartial();

      await runDataTableQuery('source=logs | stats count() by host');

      expect(mockSearchSource.fetch.mock.calls[0][0].onPartialResults).toBeUndefined();
      expect(setResults).toHaveBeenCalledTimes(1); // the final result only
      expect(progressDispatches()).toHaveLength(0);
    });

    it('ignores a partial once a newer query has cleared its key', async () => {
      fetchWithOnePartial(() => mockGetState.mockReturnValue(stateWithKey(false)));

      await runDataTableQuery();

      expect(progressDispatches()).toHaveLength(0);
      expect(setResults).toHaveBeenCalledTimes(1);
    });

    it('ignores a partial from a run replaced by a newer run of the same key', async () => {
      // A fresh controller per run; starting the second run aborts the first.
      (global.AbortController as jest.Mock).mockImplementation(() => {
        const controller = {
          signal: { aborted: false },
          abort: jest.fn(() => {
            controller.signal.aborted = true;
          }),
        };
        return controller;
      });
      let deliverFirstPartial: () => void = () => {};
      mockSearchSource.fetch
        .mockImplementationOnce(
          (options: any) =>
            new Promise((resolve) => {
              deliverFirstPartial = () => {
                options.onPartialResults(partialResults, partialFrame);
                resolve(finalResults);
              };
            })
        )
        .mockResolvedValueOnce(finalResults);

      const first = runDataTableQuery();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await runDataTableQuery();
      deliverFirstPartial();
      await first;

      expect(progressDispatches()).toHaveLength(0);
    });

    it('clears partial rows when the query fails', async () => {
      mockSearchSource.fetch.mockImplementation(async (options: any) => {
        options.onPartialResults(partialResults, partialFrame);
        throw Object.assign(new Error('boom'), { body: { message: 'boom' } });
      });

      await runDataTableQuery().catch(() => undefined);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'results/clearResultsByKey',
        payload: 'partial-cache-key',
      });
    });

    it('ignores a partial that arrives after the query was aborted', async () => {
      fetchWithOnePartial(() => {
        mockAbortController.signal.aborted = true;
      });

      await runDataTableQuery();

      expect(progressDispatches()).toHaveLength(0);
      expect(setResults).toHaveBeenCalledTimes(1);
    });

    it('passes the poll interval setting to the fetch', async () => {
      (mockServices.uiSettings.get as jest.Mock).mockImplementation((key: string) =>
        key === ASYNC_QUERY_POLL_INTERVAL_SETTING ? 2000 : undefined
      );
      mockSearchSource.fetch.mockResolvedValue(finalResults);

      await runDataTableQuery();

      expect(mockSearchSource.fetch).toHaveBeenCalledWith(
        expect.objectContaining({ pollInterval: 2000, onPartialResults: expect.any(Function) })
      );
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

    // executeQueries drops its own LOADING status right after dispatching the tab queries, so each
    // one must already count as LOADING by then: before its first await.
    it('reports LOADING synchronously, before its fetch settles', () => {
      mockSearchSource.fetch.mockReturnValue(new Promise(() => undefined));

      executeTabQuery({
        services: mockServices,
        cacheKey: 'tab-cache-key',
        queryString: 'source=logs | stats count()',
      })(mockDispatch, mockGetState, undefined);

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            cacheKey: 'tab-cache-key',
            status: expect.objectContaining({ status: QueryExecutionStatus.LOADING }),
          }),
        })
      );
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

    it('lets a superseded run for the same key leave its successor untouched', async () => {
      (global.AbortController as jest.Mock).mockImplementation(() => ({
        abort: jest.fn(),
        signal: { aborted: false },
      }));
      let rejectFirst: (error: Error) => void = () => {};
      let resolveSecond: (value: unknown) => void = () => {};
      mockSearchSource.fetch
        .mockImplementationOnce(() => new Promise((_resolve, reject) => (rejectFirst = reject)))
        .mockImplementationOnce(() => new Promise((resolve) => (resolveSecond = resolve)));
      const params = {
        services: mockServices,
        cacheKey: 'tab-key',
        queryString: 'source=logs | stats count()',
      };
      const statusesFor = () =>
        mockDispatch.mock.calls
          .map(([action]) => action)
          .filter(
            (action) =>
              action?.type === 'queryEditor/setIndividualQueryStatus' &&
              action.payload.cacheKey === 'tab-key'
          )
          .map((action) => action.payload.status.status);

      const first = executeTabQuery(params)(mockDispatch, mockGetState, undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const second = executeTabQuery(params)(mockDispatch, mockGetState, undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      rejectFirst(abortError);
      await first;
      expect(statusesFor()).not.toContain(QueryExecutionStatus.UNINITIALIZED);

      resolveSecond({ hits: { hits: [{ _id: '1', _source: {} }], total: 1 }, took: 1 });
      await second;
      expect(statusesFor()).toEqual([
        QueryExecutionStatus.LOADING,
        QueryExecutionStatus.LOADING,
        QueryExecutionStatus.READY,
      ]);
    });

    it('drops the results of a superseded run whose fetch resolves after it was replaced', async () => {
      (global.AbortController as jest.Mock).mockImplementation(() => ({
        abort: jest.fn(),
        signal: { aborted: false },
      }));
      let resolveFirst: (value: unknown) => void = () => {};
      let resolveSecond: (value: unknown) => void = () => {};
      mockSearchSource.fetch
        .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
        .mockImplementationOnce(() => new Promise((resolve) => (resolveSecond = resolve)));
      const params = {
        services: mockServices,
        cacheKey: 'tab-key',
        queryString: 'source=logs | stats count()',
      };
      const staleHits = { hits: { hits: [{ _id: 'stale', _source: {} }], total: 1 }, took: 1 };
      const freshHits = { hits: { hits: [{ _id: 'fresh', _source: {} }], total: 1 }, took: 1 };

      const first = executeTabQuery(params)(mockDispatch, mockGetState, undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));
      const second = executeTabQuery(params)(mockDispatch, mockGetState, undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));

      resolveFirst(staleHits);
      await first;
      expect(setResults).not.toHaveBeenCalled();

      resolveSecond(freshHits);
      await second;
      expect(setResults).toHaveBeenCalledTimes(1);
      expect(setResults).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheKey: 'tab-key',
          results: expect.objectContaining({ hits: freshHits.hits }),
        })
      );
    });

    // A tab whose prepareQuery cannot yet build a query returns '' -- see the patterns
    // tab, whose field is derived from logs results that are gone after a page reload.
    it('does not run anything when the cache key is empty', async () => {
      const thunk = executeTabQuery({
        services: mockServices,
        cacheKey: '',
        queryString: '',
      });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSearchSource.fetch).not.toHaveBeenCalled();
      expect(setResults).not.toHaveBeenCalled();
      // The tab must stay uninitialized rather than stuck on a spinner.
      expect(mockDispatch).not.toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queryEditor/setIndividualQueryStatus',
          payload: expect.objectContaining({
            status: expect.objectContaining({ status: QueryExecutionStatus.LOADING }),
          }),
        })
      );
    });

    // The BRAIN retry in register_tabs deliberately passes a queryString that
    // differs from its cacheKey, so the guard must not key off queryString.
    it('still runs when only the query string differs from the cache key', async () => {
      const thunk = executeTabQuery({
        services: mockServices,
        cacheKey: 'some-key',
        queryString: 'source=logs',
      });
      await thunk(mockDispatch, mockGetState, undefined);

      expect(mockSearchSource.fetch).toHaveBeenCalled();
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

    describe('query profiling gate (PPL only)', () => {
      const runAndGetQuery = async () => {
        const thunk = executeTabQuery({
          services: mockServices,
          cacheKey: 'test-cache-key',
          queryString: 'source=logs',
        });
        await thunk(mockDispatch, mockGetState, undefined);
        const call = (mockSearchSource.setFields as jest.Mock).mock.calls.find((c) => c[0]?.query);
        return call?.[0]?.query;
      };

      it('sends profile:true for a PPL query when profiling is enabled', async () => {
        mockServices.queryProfilingEnabled = true;
        // executeTabQuery mock state defaults to language: 'PPL'
        const query = await runAndGetQuery();
        expect(query).toEqual(expect.objectContaining({ profile: true }));
      });

      it('does not send profile for a non-PPL (SQL) query even when profiling is enabled', async () => {
        mockServices.queryProfilingEnabled = true;
        mockGetState.mockReturnValue({
          query: {
            query: 'SELECT * FROM logs',
            language: 'SQL',
            dataset: { id: 'test', type: 'INDEX_PATTERN' },
          },
          legacy: { interval: '1h' },
          ui: { activeTabId: 'test-tab' },
          queryEditor: { breakdownField: undefined, queryStatusMap: {} },
        });

        const query = await runAndGetQuery();
        expect(query.profile).toBeUndefined();
      });

      it('does not send profile when profiling is disabled', async () => {
        mockServices.queryProfilingEnabled = false;
        const query = await runAndGetQuery();
        expect(query.profile).toBeUndefined();
      });
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
    const mockDefaultPreparePplQuery =
      languagesModule.defaultPreparePplQuery as jest.MockedFunction<
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

  describe('shouldSkipQueryExecution', () => {
    const queryFor = (language: string, queryText: unknown): Query =>
      ({
        language,
        query: queryText,
        dataset: { id: 'd', title: 't', type: 'INDEX_PATTERN' },
      }) as Query;

    // Selecting a dataset resets the editor to EMPTY_QUERY.QUERY ('').
    it.each([
      ['', 'empty'],
      ['   ', 'whitespace only'],
    ])('skips a %s SQL query (%s)', (queryText) => {
      expect(shouldSkipQueryExecution(queryFor('SQL', queryText))).toBe(true);
    });

    it('skips a SQL query whose text is not a string', () => {
      expect(shouldSkipQueryExecution(queryFor('SQL', undefined))).toBe(true);
    });

    it('runs a non-empty SQL query', () => {
      expect(shouldSkipQueryExecution(queryFor('SQL', 'SELECT * FROM idx'))).toBe(false);
    });

    it('still skips a blank PromQL query', () => {
      expect(shouldSkipQueryExecution(queryFor('PROMQL', ''))).toBe(true);
      expect(shouldSkipQueryExecution(queryFor('PROMQL', 'up'))).toBe(false);
    });

    // defaultPreparePplQuery turns a blank PPL editor into `source = <table>`.
    it('runs a blank PPL query', () => {
      expect(shouldSkipQueryExecution(queryFor('PPL', ''))).toBe(false);
    });
  });
});
