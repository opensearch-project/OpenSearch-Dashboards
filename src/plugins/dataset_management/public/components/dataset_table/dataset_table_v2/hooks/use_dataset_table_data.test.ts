/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import { useDatasetTableData } from './use_dataset_table_data';
import { getDatasets } from '../../../utils';
import { getIndices } from '../../../create_dataset_wizard/lib';

jest.mock('../../../utils');
jest.mock('../../../create_dataset_wizard/lib');

const mockGetDatasets = getDatasets as jest.MockedFunction<typeof getDatasets>;
const mockGetIndices = getIndices as jest.MockedFunction<typeof getIndices>;

describe('useDatasetTableData', () => {
  const mockSavedObjectsClient: any = {
    find: jest.fn(),
  };

  const mockHttp: any = {
    get: jest.fn(),
  };

  const mockData: any = {
    search: {
      search: jest.fn(),
    },
  };

  const mockDatasetManagementStart: any = {
    creation: {
      getDatasetCreationOptions: jest.fn(),
    },
  };

  const mockHistoryPush = jest.fn();

  const defaultParams = {
    savedObjectsClient: mockSavedObjectsClient,
    defaultIndex: 'default-index',
    datasetManagementStart: mockDatasetManagementStart,
    http: mockHttp,
    data: mockData,
    dataSourceEnabled: false,
    historyPush: mockHistoryPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDatasets.mockResolvedValue([]);
    mockDatasetManagementStart.creation.getDatasetCreationOptions.mockResolvedValue([]);
    mockGetIndices.mockResolvedValue([]);
  });

  it('should load datasets on mount', async () => {
    const mockDatasets = [
      { id: 'test-1', title: 'Test Dataset 1', type: 'index-pattern', sort: '1Test Dataset 1' },
      { id: 'test-2', title: 'Test Dataset 2', type: 'index-pattern', sort: '1Test Dataset 2' },
    ];

    mockGetDatasets.mockResolvedValue(mockDatasets as any);

    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    expect(result.current.isLoadingDatasets).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoadingDatasets).toBe(false);
    });

    expect(result.current.datasets).toEqual(mockDatasets);
  });

  it('should load creation options on mount', async () => {
    const mockOptions = [
      { text: 'Option 1', onClick: jest.fn() },
      { text: 'Option 2', onClick: jest.fn() },
    ];

    mockDatasetManagementStart.creation.getDatasetCreationOptions.mockResolvedValue(mockOptions);

    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    await waitFor(() => {
      expect(result.current.creationOptions).toEqual(mockOptions);
    });
  });

  it('should load sources when dataSourceEnabled is false', async () => {
    const mockSources = [
      { name: 'source-1', title: 'Source 1' },
      { name: 'source-2', title: 'Source 2' },
    ];

    mockGetIndices.mockResolvedValue(mockSources as any);

    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    await waitFor(() => {
      expect(result.current.isLoadingSources).toBe(false);
    });

    expect(mockGetIndices).toHaveBeenCalled();
  });

  it('should not load sources when dataSourceEnabled is true', async () => {
    const params = {
      ...defaultParams,
      dataSourceEnabled: true,
    };

    const { result } = renderHook(() => useDatasetTableData(params));

    expect(result.current.isLoadingSources).toBe(false);
    expect(mockGetIndices).not.toHaveBeenCalled();
  });

  it('should filter out aliases from sources', async () => {
    const mockSources = [
      { name: 'source-1', title: 'Source 1' },
      { name: 'source-2', title: 'Source 2', indices: ['index-1'] }, // This is an alias
    ];

    mockGetIndices.mockResolvedValue(mockSources as any);

    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    await waitFor(() => {
      expect(result.current.sources.length).toBe(1);
    });

    expect(result.current.sources[0].name).toBe('source-1');
  });

  it('should initialize remoteClustersExist to false', async () => {
    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    expect(result.current.remoteClustersExist).toBe(false);
  });

  it('should determine hasDataIndices correctly', async () => {
    const mockSources = [
      { name: 'data-index', title: 'Data Index' },
      { name: '.internal-index', title: 'Internal Index' },
    ];

    mockGetIndices.mockResolvedValue(mockSources as any);

    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    await waitFor(() => {
      expect(result.current.hasDataIndices).toBe(true);
    });
  });

  it('should return false for hasDataIndices when only system indices exist', async () => {
    const mockSources = [
      { name: '.internal-index-1', title: 'Internal Index 1' },
      { name: '.internal-index-2', title: 'Internal Index 2' },
    ];

    mockGetIndices.mockResolvedValue(mockSources as any);

    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    await waitFor(() => {
      expect(result.current.hasDataIndices).toBe(false);
    });
  });

  it('should provide loadSources function', async () => {
    const { result } = renderHook(() => useDatasetTableData(defaultParams));

    await waitFor(() => {
      expect(result.current.loadSources).toBeDefined();
    });

    expect(typeof result.current.loadSources).toBe('function');
  });
});
