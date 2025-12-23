/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useInitializeMetricsDataset } from './use_initialize_metrics_dataset';
import { ExploreServices } from '../../../types';
import { queryReducer } from '../state_management/slices';
import { setQueryWithHistory } from '../state_management/slices';

// Mock setQueryWithHistory action
jest.mock('../state_management/slices', () => ({
  ...jest.requireActual('../state_management/slices'),
  setQueryWithHistory: jest.fn((query) => ({ type: 'query/setQueryWithHistory', payload: query })),
}));

const mockSetQueryWithHistory = setQueryWithHistory as jest.MockedFunction<
  typeof setQueryWithHistory
>;

describe('useInitializeMetricsDataset', () => {
  const mockDispatch = jest.fn();
  const mockCacheDataset = jest.fn();
  const mockGetInitialQueryByDataset = jest.fn();
  const mockFetch = jest.fn();
  const mockToDataset = jest.fn();
  const mockGetType = jest.fn();
  const mockGetDatasetService = jest.fn();

  const createMockStore = (dataset?: any) => {
    return configureStore({
      reducer: {
        query: queryReducer,
      },
      preloadedState: {
        query: {
          query: '',
          language: 'PROMQL',
          dataset,
        },
      },
    });
  };

  const createMockServices = (overrides?: Partial<ExploreServices>): ExploreServices => {
    return ({
      data: {
        query: {
          queryString: {
            getDatasetService: mockGetDatasetService,
            getInitialQueryByDataset: mockGetInitialQueryByDataset,
          },
        },
      },
      uiSettings: {},
      savedObjects: {},
      notifications: {},
      http: {},
      ...overrides,
    } as unknown) as ExploreServices;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockImplementation((action) => {
      if (typeof action === 'function') {
        return Promise.resolve();
      }
      return action;
    });

    mockGetType.mockReturnValue({
      id: 'PROMETHEUS',
      title: 'Prometheus',
      fetch: mockFetch,
      toDataset: mockToDataset,
    });
    mockGetDatasetService.mockReturnValue({
      getType: mockGetType,
      cacheDataset: mockCacheDataset,
    });
    mockGetInitialQueryByDataset.mockReturnValue({
      query: 'up',
      language: 'PROMQL',
      dataset: { id: 'prometheus-connection', type: 'PROMETHEUS' },
    });
  });

  const renderHookWithProvider = (services: ExploreServices, dataset?: any, savedExplore?: any) => {
    const store = createMockStore(dataset);
    jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);

    return renderHook(() => useInitializeMetricsDataset({ services, savedExplore }), {
      wrapper: ({ children }) => <Provider store={store as any}>{children}</Provider>,
    });
  };

  describe('when savedExplore is provided', () => {
    it('should not initialize dataset', async () => {
      const mockServices = createMockServices();
      const savedExplore = { id: 'saved-explore-id' };

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, savedExplore);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockGetType).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('when dataset already exists with PROMETHEUS type', () => {
    it('should not initialize dataset', async () => {
      const mockServices = createMockServices();
      const existingDataset = { id: 'existing-prometheus', type: 'PROMETHEUS' };

      await act(async () => {
        renderHookWithProvider(mockServices, existingDataset, undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('when no dataset exists', () => {
    it('should fetch and initialize first available prometheus connection', async () => {
      const mockServices = createMockServices();
      const mockDatasetRoot = {
        id: 'PROMETHEUS',
        title: 'Prometheus',
        type: 'PROMETHEUS',
      };
      const mockConnection = {
        id: 'prometheus-connection-1',
        title: 'Prometheus Connection 1',
        type: 'PROMETHEUS',
      };
      const mockDataset = {
        id: 'prometheus-connection-1',
        type: 'PROMETHEUS',
        title: 'Prometheus Connection 1',
        language: 'PROMQL',
      };

      mockFetch.mockResolvedValue({
        children: [mockConnection],
      });
      mockToDataset.mockReturnValue(mockDataset);

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockGetType).toHaveBeenCalledWith('PROMETHEUS');
      expect(mockFetch).toHaveBeenCalledWith(mockServices, [mockDatasetRoot]);
      expect(mockToDataset).toHaveBeenCalledWith([mockDatasetRoot, mockConnection]);
      expect(mockCacheDataset).toHaveBeenCalledWith(
        mockDataset,
        expect.objectContaining({
          uiSettings: mockServices.uiSettings,
          savedObjects: mockServices.savedObjects,
          notifications: mockServices.notifications,
          http: mockServices.http,
          data: mockServices.data,
        }),
        false
      );
      expect(mockGetInitialQueryByDataset).toHaveBeenCalledWith(mockDataset);
      expect(mockSetQueryWithHistory).toHaveBeenCalled();
    });

    it('should not dispatch if no connections are available', async () => {
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(mockToDataset).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should not dispatch if PROMETHEUS type config is not available', async () => {
      const mockServices = createMockServices();
      mockGetType.mockReturnValue(undefined);

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockGetType).toHaveBeenCalledWith('PROMETHEUS');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('should silently fail if fetch throws an error', async () => {
      const mockServices = createMockServices();
      mockFetch.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('when dataset exists with non-PROMETHEUS type', () => {
    it('should fetch and initialize prometheus connection', async () => {
      const mockServices = createMockServices();
      const existingDataset = { id: 'some-index', type: 'INDEX_PATTERN' };
      const mockConnection = {
        id: 'prometheus-connection-1',
        title: 'Prometheus Connection 1',
        type: 'PROMETHEUS',
      };
      const mockDataset = {
        id: 'prometheus-connection-1',
        type: 'PROMETHEUS',
        title: 'Prometheus Connection 1',
        language: 'PROMQL',
      };

      mockFetch.mockResolvedValue({
        children: [mockConnection],
      });
      mockToDataset.mockReturnValue(mockDataset);

      await act(async () => {
        renderHookWithProvider(mockServices, existingDataset, undefined);
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      expect(mockSetQueryWithHistory).toHaveBeenCalled();
    });
  });
});
