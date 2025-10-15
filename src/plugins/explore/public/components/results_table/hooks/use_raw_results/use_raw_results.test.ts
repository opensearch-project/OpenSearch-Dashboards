/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useRawResults } from './use_raw_results';
import { defaultPrepareQueryString } from '../../../../application/utils/state_management/actions/query_actions';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/selectors', () => ({
  selectQuery: jest.fn(),
}));

describe('useRawResults', () => {
  const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
  const mockDefaultPrepareQueryString = defaultPrepareQueryString as jest.MockedFunction<
    typeof defaultPrepareQueryString
  >;

  const mockQuery = {
    language: 'PPL',
    query: 'source=test-index | head 10',
    dataset: { id: 'test-dataset' },
  };

  const mockResultsData = {
    hits: {
      hits: [
        { _id: '1', _source: { field1: 'value1' } },
        { _id: '2', _source: { field2: 'value2' } },
      ],
      total: { value: 2, relation: 'eq' },
    },
    took: 5,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
  };

  const mockResultsState = {
    'test-cache-key': mockResultsData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaultPrepareQueryString.mockReturnValue('test-cache-key');
  });

  it('should return complete results data when results exist', () => {
    mockUseSelector
      .mockReturnValueOnce(mockQuery) // selectQuery
      .mockReturnValueOnce(mockResultsState); // results state

    const { result } = renderHook(() => useRawResults());

    expect(result.current).toEqual(mockResultsData);
    expect(mockDefaultPrepareQueryString).toHaveBeenCalledWith(mockQuery);
  });

  it('should return undefined when no results exist for cache key', () => {
    const emptyResultsState = {};

    mockUseSelector
      .mockReturnValueOnce(mockQuery) // selectQuery
      .mockReturnValueOnce(emptyResultsState); // results state

    const { result } = renderHook(() => useRawResults());

    expect(result.current).toBeUndefined();
    expect(mockDefaultPrepareQueryString).toHaveBeenCalledWith(mockQuery);
  });

  it('should handle different cache keys correctly', () => {
    const differentCacheKey = 'different-cache-key';
    const differentResultsData = {
      hits: {
        hits: [{ _id: '10', _source: { differentField: 'differentValue' } }],
        total: { value: 1, relation: 'eq' },
      },
      took: 8,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    };
    const differentResultsState = {
      [differentCacheKey]: differentResultsData,
    };

    mockDefaultPrepareQueryString.mockReturnValue(differentCacheKey);
    mockUseSelector
      .mockReturnValueOnce(mockQuery) // selectQuery
      .mockReturnValueOnce(differentResultsState); // results state with different cache key

    const { result } = renderHook(() => useRawResults());

    expect(result.current).toEqual(differentResultsData);
    expect(mockDefaultPrepareQueryString).toHaveBeenCalledWith(mockQuery);
  });

  it('should work with multiple results in state and return correct one', () => {
    const multipleResultsState = {
      'cache-key-1': {
        hits: { hits: [{ _id: '1', _source: { field1: 'value1' } }] },
        took: 2,
      },
      'test-cache-key': mockResultsData,
      'cache-key-3': {
        hits: { hits: [{ _id: '4', _source: { field4: 'value4' } }] },
        took: 7,
      },
    };

    mockUseSelector
      .mockReturnValueOnce(mockQuery) // selectQuery
      .mockReturnValueOnce(multipleResultsState); // results state

    const { result } = renderHook(() => useRawResults());

    // Should return only the results for the matching cache key
    expect(result.current).toEqual(mockResultsData);
  });

  it('should handle results with error data', () => {
    const errorResultsData = {
      error: {
        type: 'search_phase_execution_exception',
        reason: 'all shards failed',
      },
      took: 1,
      timed_out: false,
    };

    const resultsStateWithError = {
      'test-cache-key': errorResultsData,
    };

    mockUseSelector
      .mockReturnValueOnce(mockQuery) // selectQuery
      .mockReturnValueOnce(resultsStateWithError); // results state

    const { result } = renderHook(() => useRawResults());

    expect(result.current).toEqual(errorResultsData);
  });

  it('should handle results with aggregations', () => {
    const resultsWithAggregations = {
      hits: {
        hits: [],
        total: { value: 0, relation: 'eq' },
      },
      aggregations: {
        status_counts: {
          buckets: [
            { key: '200', doc_count: 150 },
            { key: '404', doc_count: 25 },
            { key: '500', doc_count: 5 },
          ],
        },
      },
      took: 12,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    };

    const resultsStateWithAggregations = {
      'test-cache-key': resultsWithAggregations,
    };

    mockUseSelector
      .mockReturnValueOnce(mockQuery) // selectQuery
      .mockReturnValueOnce(resultsStateWithAggregations); // results state

    const { result } = renderHook(() => useRawResults());

    expect(result.current).toEqual(resultsWithAggregations);
  });
});
