/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ISearchResult } from '../slices/results/results_slice';
import { IndexPattern } from '../../../legacy/discover/opensearch_dashboards_services';

/**
 * Creates a mock search result for testing
 */
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

/**
 * Creates a mock search result with aggregations for histogram testing
 */
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

/**
 * Creates a mock IndexPattern for testing
 */
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
    isTimeBased: jest.fn().mockReturnValue(true),
    ...overrides,
  } as IndexPattern);

/**
 * Creates a mock DataPublicPluginStart for testing
 */
export const createMockDataPublicPluginStart = () =>
  ({
    // Mock DataPublicPluginStart properties as needed
  } as any);
