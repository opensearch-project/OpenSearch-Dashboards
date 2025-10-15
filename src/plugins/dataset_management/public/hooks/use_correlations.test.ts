/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react-dom/test-utils';
import { SavedObjectsClientContract } from '../../../../core/public';
import { useCorrelations, useCorrelationCount, useSingleCorrelation } from './use_correlations';
import { CorrelationSavedObject } from '../types/correlations';

// Mock the CorrelationsClient
jest.mock('../services/correlations_client');

describe('useCorrelations', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;

  beforeEach(() => {
    mockSavedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkGet: jest.fn(),
      bulkCreate: jest.fn(),
      bulkUpdate: jest.fn(),
    } as any;

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

    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: mockCorrelations });

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
        references: [],
      },
    ];

    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: mockCorrelations });

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelations(mockSavedObjectsClient, { datasetId: 'dataset-123' })
    );

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledWith(
      expect.objectContaining({
        hasReference: {
          type: 'index-pattern',
          id: 'dataset-123',
        },
      })
    );
    expect(result.current.correlations).toEqual(mockCorrelations);
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Failed to fetch');
    mockSavedObjectsClient.find.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useCorrelations(mockSavedObjectsClient));

    await waitForNextUpdate();

    expect(result.current.error).toEqual(error);
    expect(result.current.correlations).toEqual([]);
  });

  it('should handle non-Error exceptions', async () => {
    mockSavedObjectsClient.find.mockRejectedValue('String error');

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

    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: mockCorrelations });

    const { result, waitForNextUpdate } = renderHook(() => useCorrelations(mockSavedObjectsClient));

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(1);

    // Refetch
    act(() => {
      result.current.refetch();
    });

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
  });

  it('should refetch when options change', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

    const { rerender, waitForNextUpdate } = renderHook(
      ({ datasetId }) => useCorrelations(mockSavedObjectsClient, { datasetId }),
      {
        initialProps: { datasetId: 'dataset-1' },
      }
    );

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(1);

    // Change options
    rerender({ datasetId: 'dataset-2' });

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
    expect(mockSavedObjectsClient.find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        hasReference: expect.objectContaining({
          id: 'dataset-2',
        }),
      })
    );
  });
});

describe('useCorrelationCount', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;

  beforeEach(() => {
    mockSavedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkGet: jest.fn(),
      bulkCreate: jest.fn(),
      bulkUpdate: jest.fn(),
    } as any;

    jest.clearAllMocks();
  });

  it('should return count of correlations', async () => {
    const mockCorrelations = [
      { id: 'correlation-1' },
      { id: 'correlation-2' },
      { id: 'correlation-3' },
    ] as any;

    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: mockCorrelations });

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
    expect(mockSavedObjectsClient.find).not.toHaveBeenCalled();
  });

  it('should return 0 when no correlations found', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(result.current.count).toBe(0);
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Failed to fetch');
    mockSavedObjectsClient.find.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(result.current.error).toEqual(error);
    expect(result.current.count).toBe(0);
  });

  it('should support refetch functionality', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [{ id: '1' }] as any });

    const { result, waitForNextUpdate } = renderHook(() =>
      useCorrelationCount(mockSavedObjectsClient, 'dataset-123')
    );

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(1);

    // Refetch
    act(() => {
      result.current.refetch();
    });

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
  });

  it('should use perPage: 1000 for count query', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

    renderHook(() => useCorrelationCount(mockSavedObjectsClient, 'dataset-123'));

    expect(mockSavedObjectsClient.find).toHaveBeenCalledWith(
      expect.objectContaining({
        perPage: 1000,
      })
    );
  });

  it('should refetch when datasetId changes', async () => {
    mockSavedObjectsClient.find.mockResolvedValue({ savedObjects: [] });

    const { rerender, waitForNextUpdate } = renderHook(
      ({ datasetId }) => useCorrelationCount(mockSavedObjectsClient, datasetId),
      {
        initialProps: { datasetId: 'dataset-1' },
      }
    );

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(1);

    // Change datasetId
    rerender({ datasetId: 'dataset-2' });

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.find).toHaveBeenCalledTimes(2);
  });
});

describe('useSingleCorrelation', () => {
  let mockSavedObjectsClient: jest.Mocked<SavedObjectsClientContract>;

  beforeEach(() => {
    mockSavedObjectsClient = {
      find: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkGet: jest.fn(),
      bulkCreate: jest.fn(),
      bulkUpdate: jest.fn(),
    } as any;

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

    mockSavedObjectsClient.get.mockResolvedValue(mockCorrelation);

    const { result, waitForNextUpdate } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, 'correlation-1')
    );

    await waitForNextUpdate();

    expect(result.current.correlation).toEqual(mockCorrelation);
    expect(result.current.error).toBeNull();
    expect(mockSavedObjectsClient.get).toHaveBeenCalledWith('correlations', 'correlation-1');
  });

  it('should return null when no correlation ID provided', async () => {
    const { result, waitFor } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, undefined)
    );

    await waitFor(() => result.current.loading === false);

    expect(result.current.correlation).toBeNull();
    expect(mockSavedObjectsClient.get).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Not found');
    mockSavedObjectsClient.get.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() =>
      useSingleCorrelation(mockSavedObjectsClient, 'correlation-1')
    );

    await waitForNextUpdate();

    expect(result.current.error).toEqual(error);
    expect(result.current.correlation).toBeNull();
  });

  it('should handle non-Error exceptions', async () => {
    mockSavedObjectsClient.get.mockRejectedValue('String error');

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

    mockSavedObjectsClient.get.mockResolvedValue(mockCorrelation);

    const { rerender, waitForNextUpdate } = renderHook(
      ({ correlationId }) => useSingleCorrelation(mockSavedObjectsClient, correlationId),
      {
        initialProps: { correlationId: 'correlation-1' },
      }
    );

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.get).toHaveBeenCalledTimes(1);

    // Change ID
    rerender({ correlationId: 'correlation-2' });

    await waitForNextUpdate();

    expect(mockSavedObjectsClient.get).toHaveBeenCalledTimes(2);
    expect(mockSavedObjectsClient.get).toHaveBeenLastCalledWith('correlations', 'correlation-2');
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

    mockSavedObjectsClient.get.mockResolvedValue(mockCorrelation);

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
