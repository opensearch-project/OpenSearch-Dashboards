/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useProcessedResults } from './use_processed_results';
import { useRawResults } from '../use_raw_results';
import { DatasetContextValue, useDatasetContext } from '../../../../application/context';
import { defaultResultsProcessor } from '../../../../application/utils/state_management/actions/query_actions';
import { ISearchResult } from '../../../../application/utils/state_management/slices';
import { ProcessedSearchResults } from '../../../../application/utils/interfaces';
import { DataView } from '../../../../../../data/common';

jest.mock('../use_raw_results', () => ({
  useRawResults: jest.fn(),
}));

jest.mock('../../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../../application/utils/state_management/actions/query_actions', () => ({
  defaultResultsProcessor: jest.fn(),
}));

describe('useProcessedResults', () => {
  const mockUseRawResults = useRawResults as jest.MockedFunction<typeof useRawResults>;
  const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
  const mockDefaultResultsProcessor = defaultResultsProcessor as jest.MockedFunction<
    typeof defaultResultsProcessor
  >;

  const mockRawResults = ({
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
  } as unknown) as ISearchResult;

  const mockDataset = ({
    id: 'test-dataset',
    title: 'Test Dataset',
    timeFieldName: '@timestamp',
    fields: {
      getByName: jest.fn(),
    },
    flattenHit: jest.fn(),
  } as unknown) as DataView;

  const mockDatasetContext = { dataset: mockDataset } as DatasetContextValue;

  const mockProcessedResults = ({
    hits: mockRawResults.hits,
    fieldCounts: {
      field1: 1,
      field2: 1,
    },
    dataset: mockDataset,
    elapsedMs: 5,
  } as unknown) as ProcessedSearchResults;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaultResultsProcessor.mockReturnValue(mockProcessedResults);
  });

  it('should return processed results when both rawResults and dataset are available', () => {
    mockUseRawResults.mockReturnValue(mockRawResults);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const { result } = renderHook(() => useProcessedResults());

    expect(result.current).toEqual(mockProcessedResults);
    expect(mockDefaultResultsProcessor).toHaveBeenCalledWith(mockRawResults, mockDataset);
    expect(mockDefaultResultsProcessor).toHaveBeenCalledTimes(1);
  });

  it('should return null when both rawResults and dataset are null', () => {
    mockUseRawResults.mockReturnValue(null as any);
    mockUseDatasetContext.mockReturnValue({ dataset: null } as any);

    const { result } = renderHook(() => useProcessedResults());

    expect(result.current).toBeNull();
    expect(mockDefaultResultsProcessor).not.toHaveBeenCalled();
  });

  it('should recompute when rawResults changes', () => {
    mockUseRawResults.mockReturnValue(mockRawResults);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const { result, rerender } = renderHook(() => useProcessedResults());

    expect(mockDefaultResultsProcessor).toHaveBeenCalledTimes(1);

    const updatedRawResults = {
      ...mockRawResults,
      hits: {
        ...mockRawResults.hits,
        hits: [{ _id: '3', _source: { field3: 'value3' } }],
      },
    } as ISearchResult;

    const updatedProcessedResults = {
      ...mockProcessedResults,
      fieldCounts: { field3: 1 },
    };

    mockUseRawResults.mockReturnValue(updatedRawResults);
    mockDefaultResultsProcessor.mockReturnValue(updatedProcessedResults);

    rerender();

    expect(result.current).toEqual(updatedProcessedResults);
    expect(mockDefaultResultsProcessor).toHaveBeenCalledTimes(2);
    expect(mockDefaultResultsProcessor).toHaveBeenLastCalledWith(updatedRawResults, mockDataset);
  });

  it('should recompute when dataset changes', () => {
    mockUseRawResults.mockReturnValue(mockRawResults);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const { result, rerender } = renderHook(() => useProcessedResults());

    expect(mockDefaultResultsProcessor).toHaveBeenCalledTimes(1);

    const updatedDataset = {
      ...mockDataset,
      id: 'updated-dataset',
      title: 'Updated Dataset',
    };

    const updatedProcessedResults = {
      ...mockProcessedResults,
      dataset: updatedDataset,
    } as ProcessedSearchResults;

    mockUseDatasetContext.mockReturnValue({ dataset: updatedDataset } as DatasetContextValue);
    mockDefaultResultsProcessor.mockReturnValue(updatedProcessedResults);

    rerender();

    expect(result.current).toEqual(updatedProcessedResults);
    expect(mockDefaultResultsProcessor).toHaveBeenCalledTimes(2);
    expect(mockDefaultResultsProcessor).toHaveBeenLastCalledWith(mockRawResults, updatedDataset);
  });

  it('should handle empty rawResults', () => {
    const emptyRawResults = ({
      hits: {
        hits: [],
        total: { value: 0, relation: 'eq' },
      },
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
    } as unknown) as ISearchResult;

    const emptyProcessedResults = {
      hits: emptyRawResults.hits,
      fieldCounts: {},
      dataset: mockDataset,
      elapsedMs: 1,
    } as ProcessedSearchResults;

    mockUseRawResults.mockReturnValue(emptyRawResults);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);
    mockDefaultResultsProcessor.mockReturnValue(emptyProcessedResults);

    const { result } = renderHook(() => useProcessedResults());

    expect(result.current).toEqual(emptyProcessedResults);
    expect(mockDefaultResultsProcessor).toHaveBeenCalledWith(emptyRawResults, mockDataset);
  });
});
