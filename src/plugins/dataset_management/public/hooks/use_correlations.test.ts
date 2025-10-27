/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { savedObjectsServiceMock } from '../../../../core/public/mocks';
import { useCorrelations, useCorrelationCount, useSingleCorrelation } from './use_correlations';
import { CorrelationSavedObject } from '../types/correlations';

// Create mock functions for CorrelationsClient methods
const mockFind = jest.fn();
const mockGet = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockGetCorrelationsForDataset = jest.fn();
const mockCountForDataset = jest.fn();
const mockIsTraceDatasetCorrelated = jest.fn();
const mockGetCorrelationByTraceDataset = jest.fn();

// Mock the CorrelationsClient module
jest.mock('../services/correlations_client', () => ({
  CorrelationsClient: jest.fn().mockImplementation(() => ({
    find: mockFind,
    get: mockGet,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    getCorrelationsForDataset: mockGetCorrelationsForDataset,
    countForDataset: mockCountForDataset,
    isTraceDatasetCorrelated: mockIsTraceDatasetCorrelated,
    getCorrelationByTraceDataset: mockGetCorrelationByTraceDataset,
  })),
}));

describe('useCorrelations', () => {
  let mockSavedObjectsClient: ReturnType<
    typeof savedObjectsServiceMock.createStartContract
  >['client'];

  beforeEach(() => {
    mockSavedObjectsClient = savedObjectsServiceMock.createStartContract().client;
    jest.clearAllMocks();
  });

  it('should fetch correlations successfully', async () => {
    const mockCorrelations: CorrelationSavedObject[] = [
      {
        id: 'correlation-1',
        type: 'correlations',
        attributes: {
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
          entities: [],
        },
        references: [],
      },
    ];

    mockFind.mockResolvedValue(mockCorrelations);

    const { result, waitForNextUpdate } = renderHook(() => useCorrelations(mockSavedObjectsClient));

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.correlations).toEqual([]);

    // Wait for data to load
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.correlations).toEqual(mockCorrelations);
    expect(result.current.error).toBeNull();
  });

  it('should filter correlations by dataset ID', async () => {
    const mockCorrelations: CorrelationSavedObject[] = [
      {
        id: 'correlation-1',
        type: 'correlations',
        attributes: {
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
          entities: [],
        },
        references: [{ type: 'index-pattern', id: 'dataset-123', name: 'entities[0].index' }],
      },
    ];

    mockFind.mockResolvedValue(mockCorrelations);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelations(mockSavedObjectsClient, { datasetId: 'dataset-123' })
    );

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetId: 'dataset-123',
      })
    );
    expect(result.current.correlations).toEqual(mockCorrelations);
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Failed to fetch');
    mockFind.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useCorrelations(mockSavedObjectsClient));

    await waitForNextUpdate();

    expect(result.current.error).toEqual(error);
    expect(result.current.correlations).toEqual([]);
  });

  it('should handle non-Error exceptions', async () => {
    mockFind.mockRejectedValue('String error');

    const { result, waitForNextUpdate } = renderHook(() => useCorrelations(mockSavedObjectsClient));

    await waitForNextUpdate();

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch correlations');
  });

  it('should support refetch functionality', async () => {
    const mockCorrelations: CorrelationSavedObject[] = [
      {
        id: 'correlation-1',
        type: 'correlations',
        attributes: {
          correlationType: 'Trace-to-logs',
          version: '1.0.0',
          entities: [],
        },
        references: [],
      },
    ];

    mockFind.mockResolvedValue(mockCorrelations);

    const { result, waitForNextUpdate } = renderHook(() => useCorrelations(mockSavedObjectsClient));

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(1);

    // Refetch
    act(() => {
      result.current.refetch();
    });

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(2);
  });

  it('should refetch when options change', async () => {
    mockFind.mockResolvedValue([]);

    const { rerender, waitForNextUpdate } = renderHook(
      ({ datasetId }) => useCorrelations(mockSavedObjectsClient, { datasetId }),
      {
        initialProps: { datasetId: 'dataset-1' },
      }
    );

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(1);

    // Change options
    rerender({ datasetId: 'dataset-2' });

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith(
      expect.objectContaining({
        datasetId: 'dataset-2',
      })
    );
  });
});

describe('useCorrelationCount', () => {
  let mockSavedObjectsClient: ReturnType<
    typeof savedObjectsServiceMock.createStartContract
  >['client'];

  beforeEach(() => {
    mockSavedObjectsClient = savedObjectsServiceMock.createStartContract().client;
    jest.clearAllMocks();
  });

  it('should return count of correlations', async () => {
    const mockCorrelations = [
      {
        id: 'correlation-1',
        references: [{ type: 'index-pattern', id: 'dataset-123', name: 'entities[0].index' }],
      },
      {
        id: 'correlation-2',
        references: [{ type: 'index-pattern', id: 'dataset-123', name: 'entities[0].index' }],
      },
      {
        id: 'correlation-3',
        references: [{ type: 'index-pattern', id: 'dataset-123', name: 'entities[0].index' }],
      },
    ] as any;

    mockFind.mockResolvedValue(mockCorrelations);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(result.current.count).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it('should return 0 when no dataset ID provided', async () => {
    const { result, waitFor } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, undefined)
    );

    await waitFor(() => result.current.loading === false);

    expect(result.current.count).toBe(0);
    expect(mockFind).not.toHaveBeenCalled();
  });

  it('should return 0 when no correlations found', async () => {
    mockFind.mockResolvedValue([]);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(result.current.count).toBe(0);
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Failed to fetch');
    mockFind.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(result.current.error).toEqual(error);
    expect(result.current.count).toBe(0);
  });

  it('should support refetch functionality', async () => {
    mockFind.mockResolvedValue([{ id: '1' }] as any);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(1);

    // Refetch
    act(() => {
      result.current.refetch();
    });

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(2);
  });

  it('should use perPage: 1000 for count query', async () => {
    mockFind.mockResolvedValue([]);

    renderHook(() => useCorrelationCount(mockSavedObjectsClient, 'dataset-123'));

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        perPage: 1000,
      })
    );
  });

  it('should refetch when datasetId changes', async () => {
    mockFind.mockResolvedValue([]);

    const { rerender, waitForNextUpdate } = renderHook(
      ({ datasetId }) => useCorrelationCount(mockSavedObjectsClient, datasetId),
      {
        initialProps: { datasetId: 'dataset-1' },
      }
    );

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(1);

    // Change datasetId
    rerender({ datasetId: 'dataset-2' });

    await waitForNextUpdate();

    expect(mockFind).toHaveBeenCalledTimes(2);
  });
});

describe('useSingleCorrelation', () => {
  let mockSavedObjectsClient: ReturnType<
    typeof savedObjectsServiceMock.createStartContract
  >['client'];

  beforeEach(() => {
    mockSavedObjectsClient = savedObjectsServiceMock.createStartContract().client;
    jest.clearAllMocks();
  });

  it('should fetch single correlation by ID', async () => {
    const mockCorrelation: CorrelationSavedObject = {
      id: 'correlation-1',
      type: 'correlations',
      attributes: {
        correlationType: 'Trace-to-logs',
        version: '1.0.0',
        entities: [],
      },
      references: [],
    };

    mockGet.mockResolvedValue(mockCorrelation);

    const { result, waitForNextUpdate } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, 'correlation-1')
    );

    await waitForNextUpdate();

    expect(result.current.correlation).toEqual(mockCorrelation);
    expect(result.current.error).toBeNull();
    expect(mockGet).toHaveBeenCalledWith('correlation-1');
  });

  it('should return null when no correlation ID provided', async () => {
    const { result, waitFor } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, undefined)
    );

    await waitFor(() => result.current.loading === false);

    expect(result.current.correlation).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Not found');
    mockGet.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, 'correlation-1')
    );

    await waitForNextUpdate();

    expect(result.current.error).toEqual(error);
    expect(result.current.correlation).toBeNull();
  });

  it('should handle non-Error exceptions', async () => {
    mockGet.mockRejectedValue('String error');

    const { result, waitForNextUpdate } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, 'correlation-1')
    );

    await waitForNextUpdate();

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Failed to fetch correlation');
  });

  it('should refetch when correlation ID changes', async () => {
    const mockCorrelation: CorrelationSavedObject = {
      id: 'correlation-1',
      type: 'correlations',
      attributes: {
        correlationType: 'Trace-to-logs',
        version: '1.0.0',
        entities: [],
      },
      references: [],
    };

    mockGet.mockResolvedValue(mockCorrelation);

    const { rerender, waitForNextUpdate } = renderHook(
      ({ correlationId }) => useSingleCorrelation(mockSavedObjectsClient, correlationId),
      {
        initialProps: { correlationId: 'correlation-1' },
      }
    );

    await waitForNextUpdate();

    expect(mockGet).toHaveBeenCalledTimes(1);

    // Change ID
    rerender({ correlationId: 'correlation-2' });

    await waitForNextUpdate();

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenLastCalledWith('correlation-2');
  });

  it('should clear correlation when ID changes to undefined', async () => {
    const mockCorrelation: CorrelationSavedObject = {
      id: 'correlation-1',
      type: 'correlations',
      attributes: {
        correlationType: 'Trace-to-logs',
        version: '1.0.0',
        entities: [],
      },
      references: [],
    };

    mockGet.mockResolvedValue(mockCorrelation);

    const { result, rerender, waitForNextUpdate, waitFor } = renderHook(
      ({ correlationId }) => useSingleCorrelation(mockSavedObjectsClient, correlationId),
      {
        initialProps: { correlationId: 'correlation-1' as string | undefined },
      }
    );

    await waitForNextUpdate();

    expect(result.current.correlation).toEqual(mockCorrelation);

    // Change ID to undefined
    rerender({ correlationId: undefined });

    await waitFor(() => result.current.loading === false);

    expect(result.current.correlation).toBeNull();
  });
});
