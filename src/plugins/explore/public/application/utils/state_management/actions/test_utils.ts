/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchResult } from '../slices/results/results_slice';
import { IndexPattern } from '../../../legacy/discover/opensearch_dashboards_services';

export const mockChartUtilsMocks = {
  createHistogramConfigs: jest.fn(),
  getDimensions: jest.fn(),
  buildPointSeriesData: jest.fn(),
};

export const mockDataPluginMocks = {
  search: {
    tabifyAggResponse: jest.fn(),
  },
};

// Mock the modules using the mock objects
jest.mock('../../../legacy/discover/application/components/chart/utils', () => mockChartUtilsMocks);
jest.mock('../../../../../../data/public', () => mockDataPluginMocks);

// Export individual mock functions for convenience
export const mockCreateHistogramConfigs = mockChartUtilsMocks.createHistogramConfigs;
export const mockGetDimensions = mockChartUtilsMocks.getDimensions;
export const mockBuildPointSeriesData = mockChartUtilsMocks.buildPointSeriesData;
export const mockTabifyAggResponse = mockDataPluginMocks.search.tabifyAggResponse;

export const createMockSearchResult = (overrides: Partial<ISearchResult> = {}): ISearchResult => ({
  hits: {
    hits: [
      {
        _index: 'test-index',
        _type: '_doc',
        _id: '1',
        _score: 1.0,
        _source: { field1: 'value1', field2: 'value2' },
      },
      {
        _index: 'test-index',
        _type: '_doc',
        _id: '2',
        _score: 0.8,
        _source: { field1: 'value3', field3: 'value4' },
      },
    ],
    total: 2,
    max_score: 1.0,
  },
  took: 5,
  timed_out: false,
  _shards: {
    total: 1,
    successful: 1,
    skipped: 0,
    failed: 0,
  },
  elapsedMs: 100,
  ...overrides,
});

export const createMockSearchResultWithAggregations = (): ISearchResult =>
  createMockSearchResult({
    aggregations: {
      histogram: {
        buckets: [
          { key: 1609459200000, doc_count: 5 },
          { key: 1609462800000, doc_count: 3 },
        ],
      },
    },
  });

export const createMockIndexPattern = (overrides: any = {}): IndexPattern =>
  ({
    flattenHit: jest.fn((hit) => {
      const flattened: any = {};
      if (hit._source.field1) flattened.field1 = hit._source.field1;
      if (hit._source.field2) flattened.field2 = hit._source.field2;
      if (hit._source.field3) flattened.field3 = hit._source.field3;
      return flattened;
    }),
    timeFieldName: '@timestamp',
    ...overrides,
  } as IndexPattern);

export const createMockHistogramConfigs = () => ({
  aggs: [
    {},
    {
      buckets: {
        getInterval: jest.fn(() => ({ interval: '1h', scale: 1 })),
      },
    },
  ],
});
