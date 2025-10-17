/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useRowsData } from './use_rows_data';
import { useRawResults } from '../use_raw_results';
import { ISearchResult } from '../../../../application/utils/state_management/slices';

jest.mock('../use_raw_results', () => ({
  useRawResults: jest.fn(),
}));

describe('useRowsData', () => {
  const mockUseRawResults = useRawResults as jest.MockedFunction<typeof useRawResults>;

  const mockHit1 = {
    _index: 'test-index',
    _id: '1',
    _score: 1.0,
    _source: { field1: 'value1', field2: 'value2' },
    fields: { field1: ['value1'] },
    sort: ['2023-01-01'],
  };

  const mockHit2 = {
    _index: 'test-index',
    _id: '2',
    _score: 0.8,
    _source: { field3: 'value3', field4: 'value4' },
    fields: { field3: ['value3'] },
    sort: ['2023-01-02'],
  };

  const mockRawResults = ({
    hits: {
      hits: [mockHit1, mockHit2],
      total: { value: 2, relation: 'eq' },
      max_score: 1.0,
    },
    took: 5,
    timed_out: false,
    _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
  } as unknown) as ISearchResult;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return hits array when rawResults has hits', () => {
    mockUseRawResults.mockReturnValue(mockRawResults);

    const { result } = renderHook(() => useRowsData());

    expect(result.current).toEqual([mockHit1, mockHit2]);
    expect(result.current).toHaveLength(2);
    expect(mockUseRawResults).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when rawResults is null', () => {
    mockUseRawResults.mockReturnValue(null as any);

    const { result } = renderHook(() => useRowsData());

    expect(result.current).toEqual([]);
    expect(result.current).toHaveLength(0);
  });

  it('should return empty array when rawResults exists but hits is undefined', () => {
    const rawResultsWithoutHits = {
      ...mockRawResults,
      hits: undefined,
    };

    mockUseRawResults.mockReturnValue(rawResultsWithoutHits as any);

    const { result } = renderHook(() => useRowsData());

    expect(result.current).toEqual([]);
    expect(result.current).toHaveLength(0);
  });

  it('should return empty array when rawResults.hits exists but hits.hits is undefined', () => {
    const rawResultsWithoutHitsArray = {
      ...mockRawResults,
      hits: {
        total: { value: 0, relation: 'eq' },
        max_score: null,
        hits: undefined,
      },
    };

    mockUseRawResults.mockReturnValue(rawResultsWithoutHitsArray as any);

    const { result } = renderHook(() => useRowsData());

    expect(result.current).toEqual([]);
    expect(result.current).toHaveLength(0);
  });

  it('should return empty array when rawResults.hits.hits is null', () => {
    const rawResultsWithNullHits = {
      ...mockRawResults,
      hits: {
        ...mockRawResults.hits,
        hits: null,
      },
    };

    mockUseRawResults.mockReturnValue(rawResultsWithNullHits as any);

    const { result } = renderHook(() => useRowsData());

    expect(result.current).toEqual([]);
    expect(result.current).toHaveLength(0);
  });

  it('should return empty array when rawResults.hits.hits is empty array', () => {
    const rawResultsWithEmptyHits = {
      ...mockRawResults,
      hits: {
        ...mockRawResults.hits,
        hits: [],
      },
    };

    mockUseRawResults.mockReturnValue(rawResultsWithEmptyHits);

    const { result } = renderHook(() => useRowsData());

    expect(result.current).toEqual([]);
    expect(result.current).toHaveLength(0);
  });
});
