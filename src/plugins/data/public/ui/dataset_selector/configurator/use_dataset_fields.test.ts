/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useDatasetFields } from './use_dataset_fields';

describe('useDatasetFields', () => {
  const mockBaseDataset = {
    id: 'test-id',
    title: 'Test Dataset',
    type: 'index',
    dataSource: {
      id: 'ds-id',
      title: 'Test Datasource',
      type: 'DATA_SOURCE',
    },
  };

  const mockFields = [
    { name: 'timestamp', type: 'date', displayName: 'Timestamp' },
    { name: 'field1', type: 'string', displayName: 'Field 1' },
    { name: 'date_field', type: 'date', displayName: 'Date Field' },
    { name: 'field2', type: 'number', displayName: 'Field 2' },
  ];

  it('returns empty arrays initially when supportsTimeFilter is false', () => {
    const mockDatasetType = {
      fetchFields: jest.fn().mockResolvedValue(mockFields),
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const { result } = renderHook(() => useDatasetFields(mockBaseDataset, mockDatasetType, false));

    expect(result.current.allFields).toEqual([]);
    expect(result.current.dateFields).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('returns empty arrays when datasetType is undefined', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const { result } = renderHook(() => useDatasetFields(mockBaseDataset, undefined, true));

    expect(result.current.allFields).toEqual([]);
    expect(result.current.dateFields).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches and filters date fields correctly', async () => {
    const mockFetchFields = jest.fn().mockResolvedValue(mockFields);
    const mockDatasetType = {
      fetchFields: mockFetchFields,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const { result } = renderHook(() => useDatasetFields(mockBaseDataset, mockDatasetType, true));

    // Wait for the async fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.allFields).toEqual(mockFields);
      expect(result.current.dateFields).toHaveLength(2);
      expect(result.current.dateFields).toEqual([
        { name: 'timestamp', type: 'date', displayName: 'Timestamp' },
        { name: 'date_field', type: 'date', displayName: 'Date Field' },
      ]);
    });

    expect(mockFetchFields).toHaveBeenCalledWith(mockBaseDataset);
  });

  it('sets loading state during fetch', async () => {
    const mockFetchFields = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockFields), 100);
        })
    );
    const mockDatasetType = {
      fetchFields: mockFetchFields,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const { result } = renderHook(() => useDatasetFields(mockBaseDataset, mockDatasetType, true));

    // Loading state is managed internally, wait for completion
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.allFields).toEqual(mockFields);
    });
  });

  it('handles fetch error gracefully', async () => {
    const mockFetchFields = jest.fn().mockRejectedValue(new Error('Fetch failed'));
    const mockDatasetType = {
      fetchFields: mockFetchFields,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const { result } = renderHook(() => useDatasetFields(mockBaseDataset, mockDatasetType, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.allFields).toEqual([]);
      expect(result.current.dateFields).toEqual([]);
    });
  });

  it('handles null or undefined fields response', async () => {
    const mockFetchFields = jest.fn().mockResolvedValue(null);
    const mockDatasetType = {
      fetchFields: mockFetchFields,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const { result } = renderHook(() => useDatasetFields(mockBaseDataset, mockDatasetType, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.allFields).toEqual([]);
      expect(result.current.dateFields).toEqual([]);
    });
  });

  it('refetches when baseDataset changes', async () => {
    const mockFetchFields = jest.fn().mockResolvedValue(mockFields);
    const mockDatasetType = {
      fetchFields: mockFetchFields,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    const { result, rerender } = renderHook(
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      ({ dataset }) => useDatasetFields(dataset, mockDatasetType, true),
      {
        initialProps: { dataset: mockBaseDataset },
      }
    );

    await waitFor(() => {
      expect(result.current.allFields).toEqual(mockFields);
    });

    expect(mockFetchFields).toHaveBeenCalledTimes(1);

    const newDataset = { ...mockBaseDataset, id: 'new-id' };
    rerender({ dataset: newDataset });

    await waitFor(() => {
      expect(mockFetchFields).toHaveBeenCalledTimes(2);
      expect(mockFetchFields).toHaveBeenCalledWith(newDataset);
    });
  });

  it('refetches when datasetType changes', async () => {
    const mockFetchFields1 = jest.fn().mockResolvedValue(mockFields);
    const mockDatasetType1 = {
      fetchFields: mockFetchFields1,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    const mockFetchFields2 = jest.fn().mockResolvedValue([mockFields[0]]);
    const mockDatasetType2 = {
      fetchFields: mockFetchFields2,
      supportedLanguages: () => ['SQL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    const { result, rerender } = renderHook(
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      ({ type }) => useDatasetFields(mockBaseDataset, type, true),
      {
        initialProps: { type: mockDatasetType1 },
      }
    );

    await waitFor(() => {
      expect(result.current.allFields).toEqual(mockFields);
    });

    expect(mockFetchFields1).toHaveBeenCalledTimes(1);

    rerender({ type: mockDatasetType2 });

    await waitFor(() => {
      expect(mockFetchFields2).toHaveBeenCalledTimes(1);
      expect(result.current.allFields).toEqual([mockFields[0]]);
    });
  });

  it('does not refetch when supportsTimeFilter changes to false', async () => {
    const mockFetchFields = jest.fn().mockResolvedValue(mockFields);
    const mockDatasetType = {
      fetchFields: mockFetchFields,
      supportedLanguages: () => ['PPL'],
      meta: { isFieldLoadAsync: false, supportsTimeFilter: true },
    } as any;

    const { result, rerender } = renderHook(
      // @ts-expect-error TS2345 TODO(ts-error): fixme
      ({ supports }) => useDatasetFields(mockBaseDataset, mockDatasetType, supports),
      {
        initialProps: { supports: true },
      }
    );

    await waitFor(() => {
      expect(result.current.allFields).toEqual(mockFields);
    });

    expect(mockFetchFields).toHaveBeenCalledTimes(1);

    rerender({ supports: false });

    await waitFor(() => {
      expect(result.current.allFields).toEqual([]);
      expect(result.current.dateFields).toEqual([]);
    });

    // Should not fetch again when changing to false
    expect(mockFetchFields).toHaveBeenCalledTimes(1);
  });
});
