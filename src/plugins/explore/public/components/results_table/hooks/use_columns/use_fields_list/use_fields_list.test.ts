/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useFieldsList } from './use_fields_list';
import { useProcessedResults } from '../../use_processed_results';
import { DatasetContextValue, useDatasetContext } from '../../../../../application/context';
import { getIndexPatternFieldList } from '../../../../fields_selector/lib/get_index_pattern_field_list';
import { DataView, DataViewField } from '../../../../../../../data/common';
import { ProcessedSearchResults } from '../../../../../application/utils/interfaces';

jest.mock('../../use_processed_results', () => ({
  useProcessedResults: jest.fn(),
}));

jest.mock('../../../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../../fields_selector/lib/get_index_pattern_field_list', () => ({
  getIndexPatternFieldList: jest.fn(),
}));

describe('useFieldsList', () => {
  const mockUseProcessedResults = useProcessedResults as jest.MockedFunction<
    typeof useProcessedResults
  >;
  const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;
  const mockGetIndexPatternFieldList = getIndexPatternFieldList as jest.MockedFunction<
    typeof getIndexPatternFieldList
  >;

  const mockDataViewField1 = {
    name: 'field1',
    displayName: 'Field 1',
    type: 'string',
    aggregatable: true,
    searchable: true,
  } as DataViewField;

  const mockDataViewField2 = {
    name: 'field2',
    displayName: 'Field 2',
    type: 'number',
    aggregatable: true,
    searchable: true,
  } as DataViewField;

  const mockDataset = ({
    id: 'test-dataset',
    title: 'Test Dataset',
    fields: {
      getAll: jest.fn(() => [mockDataViewField1, mockDataViewField2]),
      getByName: jest.fn(),
    },
  } as unknown) as DataView;

  const mockDatasetContext = { dataset: mockDataset } as DatasetContextValue;

  const mockProcessedResults = ({
    fieldCounts: {
      field1: 5,
      field2: 3,
      unknownField: 2,
    },
    hits: { hits: [], total: { value: 0, relation: 'eq' } },
    dataset: mockDataset,
    elapsedMs: 10,
  } as unknown) as ProcessedSearchResults;

  const mockFieldsList = [
    mockDataViewField1,
    mockDataViewField2,
    {
      name: 'unknownField',
      displayName: 'unknownField',
      type: 'unknown',
    } as DataViewField,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIndexPatternFieldList.mockReturnValue(mockFieldsList);
  });

  it('should return fields list when both processedResults and dataset are available', () => {
    mockUseProcessedResults.mockReturnValue(mockProcessedResults);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual(mockFieldsList);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(
      mockDataset,
      mockProcessedResults.fieldCounts
    );
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledTimes(1);
  });

  it('should return empty array when processedResults is null', () => {
    mockUseProcessedResults.mockReturnValue(null);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);
    mockGetIndexPatternFieldList.mockReturnValue([]);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual([]);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(mockDataset, undefined);
  });

  it('should return empty array when dataset is null', () => {
    mockUseProcessedResults.mockReturnValue(mockProcessedResults);
    mockUseDatasetContext.mockReturnValue(({ dataset: null } as unknown) as DatasetContextValue);
    mockGetIndexPatternFieldList.mockReturnValue([]);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual([]);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(
      null,
      mockProcessedResults.fieldCounts
    );
  });

  it('should handle processedResults without fieldCounts', () => {
    const processedResultsWithoutFieldCounts = ({
      ...mockProcessedResults,
      fieldCounts: undefined,
    } as unknown) as ProcessedSearchResults;

    mockUseProcessedResults.mockReturnValue(processedResultsWithoutFieldCounts);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);
    mockGetIndexPatternFieldList.mockReturnValue([]);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual([]);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(mockDataset, undefined);
  });

  it('should handle empty fieldCounts', () => {
    const processedResultsWithEmptyFieldCounts = {
      ...mockProcessedResults,
      fieldCounts: {},
    };

    mockUseProcessedResults.mockReturnValue(processedResultsWithEmptyFieldCounts);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const fieldsListWithNoUnknownFields = [mockDataViewField1, mockDataViewField2];
    mockGetIndexPatternFieldList.mockReturnValue(fieldsListWithNoUnknownFields);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual(fieldsListWithNoUnknownFields);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(mockDataset, {});
  });

  it('should handle fieldCounts with only known fields', () => {
    const processedResultsWithKnownFields = {
      ...mockProcessedResults,
      fieldCounts: {
        field1: 10,
        field2: 8,
      },
    };

    mockUseProcessedResults.mockReturnValue(processedResultsWithKnownFields);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const fieldsListWithKnownFields = [mockDataViewField1, mockDataViewField2];
    mockGetIndexPatternFieldList.mockReturnValue(fieldsListWithKnownFields);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual(fieldsListWithKnownFields);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(mockDataset, {
      field1: 10,
      field2: 8,
    });
  });

  it('should handle fieldCounts with only unknown fields', () => {
    const processedResultsWithUnknownFields = {
      ...mockProcessedResults,
      fieldCounts: {
        unknownField1: 5,
        unknownField2: 3,
      },
    };

    mockUseProcessedResults.mockReturnValue(processedResultsWithUnknownFields);
    mockUseDatasetContext.mockReturnValue(mockDatasetContext);

    const fieldsListWithUnknownFields = [
      mockDataViewField1,
      mockDataViewField2,
      { name: 'unknownField1', displayName: 'unknownField1', type: 'unknown' } as DataViewField,
      { name: 'unknownField2', displayName: 'unknownField2', type: 'unknown' } as DataViewField,
    ];
    mockGetIndexPatternFieldList.mockReturnValue(fieldsListWithUnknownFields);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual(fieldsListWithUnknownFields);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(mockDataset, {
      unknownField1: 5,
      unknownField2: 3,
    });
  });

  it('should handle complex dataset with many fields', () => {
    const complexDataset = ({
      ...mockDataset,
      fields: {
        getAll: jest.fn(() => [
          mockDataViewField1,
          mockDataViewField2,
          { name: '@timestamp', type: 'date' } as DataViewField,
          { name: 'user.name', type: 'string' } as DataViewField,
          { name: 'user.age', type: 'number' } as DataViewField,
        ]),
        getByName: jest.fn(),
      },
    } as unknown) as DataView;

    const complexProcessedResults = {
      ...mockProcessedResults,
      fieldCounts: {
        field1: 10,
        field2: 8,
        '@timestamp': 12,
        'user.name': 9,
        'user.age': 7,
        'custom.field': 3,
        'dynamic.value': 1,
      },
    };

    mockUseProcessedResults.mockReturnValue(complexProcessedResults);
    mockUseDatasetContext.mockReturnValue(({
      dataset: complexDataset,
    } as unknown) as DatasetContextValue);

    const complexFieldsList = [
      mockDataViewField1,
      mockDataViewField2,
      { name: '@timestamp', type: 'date' } as DataViewField,
      { name: 'user.name', type: 'string' } as DataViewField,
      { name: 'user.age', type: 'number' } as DataViewField,
      { name: 'custom.field', displayName: 'custom.field', type: 'unknown' } as DataViewField,
      { name: 'dynamic.value', displayName: 'dynamic.value', type: 'unknown' } as DataViewField,
    ];

    mockGetIndexPatternFieldList.mockReturnValue(complexFieldsList);

    const { result } = renderHook(() => useFieldsList());

    expect(result.current).toEqual(complexFieldsList);
    expect(mockGetIndexPatternFieldList).toHaveBeenCalledWith(
      complexDataset,
      complexProcessedResults.fieldCounts
    );
  });
});
