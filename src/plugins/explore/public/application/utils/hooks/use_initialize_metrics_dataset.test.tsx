/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useInitializeMetricsDataset } from './use_initialize_metrics_dataset';
import { ExploreServices } from '../../../types';
import { queryReducer } from '../state_management/slices';
import { setQueryWithHistory } from '../state_management/slices';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';
import { ExploreFlavor } from '../../../../common';

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

  const createMockStore = (dataset?: any, language: string = 'PROMQL') => {
    return configureStore({
      reducer: {
        query: queryReducer,
      },
      preloadedState: {
        query: {
          query: '',
          language,
          dataset,
        },
      },
    });
  };

  const createMockServices = (overrides?: Partial<ExploreServices>): ExploreServices => {
    return {
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
    } as unknown as ExploreServices;
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

  const renderHookWithProvider = (
    services: ExploreServices,
    dataset?: any,
    savedExplore?: any,
    language: string = 'PROMQL',
    savedExploreId?: string
  ) => {
    const store = createMockStore(dataset, language);
    jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);

    return renderHook(
      () => useInitializeMetricsDataset({ services, savedExplore, savedExploreId }),
      {
        wrapper: ({ children }) => <Provider store={store as any}>{children}</Provider>,
      }
    );
  };

  describe('when savedExplore is provided', () => {
    it('should not initialize dataset', async () => {
      const mockServices = createMockServices();
      const savedExplore = { id: 'saved-explore-id' };

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, savedExplore, 'PROMQL', 'saved-explore-id');
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockGetType).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });

  describe('when a saved explore is still loading (cold load of #/view/<id>)', () => {
    it('leaves the query alone so the saved language and dataset are restored', async () => {
      const mockServices = createMockServices();

      await act(async () => {
        // No dataset yet and a non-default language, as on a cold load before the saved object
        // arrives; the saved object (not this default) must supply the dataset and language.
        renderHookWithProvider(mockServices, undefined, undefined, 'External QL', 'saved-id');
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();
      expect(mockGetType).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    const renderLoading = (services: ExploreServices) => {
      const store = createMockStore(undefined, 'External QL');
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      return renderHook(
        (props: { savedExplore?: any; savedExploreError?: string | null }) =>
          useInitializeMetricsDataset({ services, savedExploreId: 'saved-id', ...props }),
        {
          initialProps: {},
          wrapper: ({ children }) => <Provider store={store as any}>{children}</Provider>,
        }
      );
    };

    it('applies the default once if the saved explore fails to load', async () => {
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });

      let hook: ReturnType<typeof renderLoading>;
      await act(async () => {
        hook = renderLoading(mockServices);
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();

      await act(async () => {
        hook!.rerender({ savedExploreError: 'Failed to load saved explore: Not found' });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockSetQueryWithHistory).toHaveBeenCalledTimes(1);
      expect(mockSetQueryWithHistory).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: undefined, language: 'PROMQL' })
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        hook!.rerender({ savedExploreError: 'Failed to load saved explore: Not found again' });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockSetQueryWithHistory).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does nothing once the saved explore has loaded', async () => {
      const mockServices = createMockServices();

      let hook: ReturnType<typeof renderLoading>;
      await act(async () => {
        hook = renderLoading(mockServices);
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      await act(async () => {
        hook!.rerender({ savedExplore: { id: 'saved-id' } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('initializes again when the mounted page moves to another saved explore that fails', async () => {
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });
      const store = createMockStore(undefined, 'External QL');
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);

      let hook: any;
      await act(async () => {
        hook = renderHook(
          (props: { savedExploreId?: string; savedExplore?: any; savedExploreError?: string }) =>
            useInitializeMetricsDataset({ services: mockServices, ...props }),
          {
            initialProps: { savedExploreId: 'first', savedExplore: { id: 'first' } },
            wrapper: ({ children }) => <Provider store={store as any}>{children}</Provider>,
          }
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      // The first saved explore loaded: it supplies its own dataset.
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();

      // The URL moves to a second saved explore; the first one is still the loaded object.
      await act(async () => {
        hook.rerender({ savedExploreId: 'second', savedExplore: { id: 'first' } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();

      // The second one fails to load: the default applies for it.
      await act(async () => {
        hook.rerender({
          savedExploreId: 'second',
          savedExplore: { id: 'first' },
          savedExploreError: 'Failed to load saved explore: Not found',
        });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockSetQueryWithHistory).toHaveBeenCalledTimes(1);
      expect(mockSetQueryWithHistory).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: undefined, language: 'PROMQL' })
      );
    });

    it('does nothing when the mounted page moves to another saved explore that loads', async () => {
      const mockServices = createMockServices();
      const store = createMockStore(undefined, 'External QL');
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);

      let hook: any;
      await act(async () => {
        hook = renderHook(
          (props: { savedExploreId?: string; savedExplore?: any }) =>
            useInitializeMetricsDataset({ services: mockServices, ...props }),
          {
            initialProps: { savedExploreId: 'first', savedExplore: { id: 'first' } },
            wrapper: ({ children }) => <Provider store={store as any}>{children}</Provider>,
          }
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      await act(async () => {
        hook.rerender({ savedExploreId: 'second', savedExplore: { id: 'second' } });
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    const renderSwitching = (services: ExploreServices, initialProps: Record<string, any>) => {
      const store = createMockStore(undefined, 'External QL');
      jest.spyOn(store, 'dispatch').mockImplementation(mockDispatch);
      return renderHook(
        (props: { savedExploreId?: string; savedExplore?: any; savedExploreError?: string }) =>
          useInitializeMetricsDataset({ services, ...props }),
        {
          initialProps,
          wrapper: ({ children }) => <Provider store={store as any}>{children}</Provider>,
        }
      );
    };

    it('drops an in-flight default once a saved explore for the next id has loaded', async () => {
      const mockServices = createMockServices();
      let resolveFetch: (value: any) => void = () => {};
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      );
      mockToDataset.mockReturnValue({ id: 'prometheus-connection', type: 'PROMETHEUS' });

      let hook: any;
      await act(async () => {
        // A fails to load, so its default starts fetching.
        hook = renderSwitching(mockServices, {
          savedExploreId: 'a',
          savedExploreError: 'Failed to load saved explore: A',
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      mockSetQueryWithHistory.mockClear();

      // The page moves to B, which loads before A's fetch resolves.
      await act(async () => {
        hook.rerender({ savedExploreId: 'b', savedExplore: { id: 'b' } });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      await act(async () => {
        resolveFetch({ children: [{ id: 'connection' }] });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();
      expect(mockGetInitialQueryByDataset).not.toHaveBeenCalled();
    });

    it("does not apply the previous saved explore's error to the next id", async () => {
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });

      let hook: any;
      await act(async () => {
        hook = renderSwitching(mockServices, {
          savedExploreId: 'a',
          savedExploreError: 'Failed to load saved explore: Not found',
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockSetQueryWithHistory).toHaveBeenCalledTimes(1);
      mockSetQueryWithHistory.mockClear();

      // First render for B still carries A's error; then B loads.
      await act(async () => {
        hook.rerender({
          savedExploreId: 'b',
          savedExploreError: 'Failed to load saved explore: Not found',
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      await act(async () => {
        hook.rerender({ savedExploreId: 'b', savedExplore: { id: 'b' } });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();
    });

    it('leaves a move from a saved explore to a new search to the reset', async () => {
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });

      let hook: any;
      await act(async () => {
        hook = renderSwitching(mockServices, { savedExploreId: 'a', savedExplore: { id: 'a' } });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();

      // "New": no id in the URL, A is still the loaded object, and the reset sets the query.
      await act(async () => {
        hook.rerender({ savedExploreId: undefined, savedExplore: { id: 'a' } });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockSetQueryWithHistory).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();

      // A later saved explore initializes as usual.
      await act(async () => {
        hook.rerender({ savedExploreId: 'b', savedExploreError: 'Failed to load: B' });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockSetQueryWithHistory).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: undefined, language: 'PROMQL' })
      );
    });

    it('drops an in-flight default for a saved explore on a move to a new search', async () => {
      const mockServices = createMockServices();
      let resolveFetch: (value: any) => void = () => {};
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      );
      mockToDataset.mockReturnValue({ id: 'prometheus-connection', type: 'PROMETHEUS' });

      let hook: any;
      await act(async () => {
        // A fails to load, so its default starts fetching.
        hook = renderSwitching(mockServices, {
          savedExploreId: 'a',
          savedExploreError: 'Failed to load saved explore: A',
        });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        hook.rerender({ savedExploreId: undefined });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      await act(async () => {
        resolveFetch({ children: [{ id: 'connection' }] });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockGetInitialQueryByDataset).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('applies the default on a new search when its empty saved explore resolves during the fetch', async () => {
      const mockServices = createMockServices();
      let resolveFetch: (value: any) => void = () => {};
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          })
      );
      mockToDataset.mockReturnValue({ id: 'prometheus-connection', type: 'PROMETHEUS' });

      let hook: any;
      await act(async () => {
        hook = renderSwitching(mockServices, {});
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      // A new search resolves to a new, empty saved explore (no id) while the fetch is pending.
      await act(async () => {
        hook.rerender({ savedExplore: { id: undefined } });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      await act(async () => {
        resolveFetch({ children: [{ id: 'connection' }] });
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
      expect(mockGetInitialQueryByDataset).toHaveBeenCalled();
      expect(mockSetQueryWithHistory).toHaveBeenLastCalledWith(
        expect.objectContaining({ dataset: { id: 'prometheus-connection', type: 'PROMETHEUS' } })
      );
    });

    it('still applies the default when no saved explore is in the URL', async () => {
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });

      await act(async () => {
        renderHookWithProvider(mockServices, undefined, undefined, 'External QL');
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockSetQueryWithHistory).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: undefined, language: 'PROMQL' })
      );
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

  describe('when the dataset belongs to a registered source', () => {
    const register = (flavors: ExploreFlavor[]) => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'external',
        label: 'External',
        datasetTypes: ['EXTERNAL_METRICS'],
        flavors,
        resolveDefaultDataset: async () => undefined,
        languageSettings: { 'External QL': {} },
      });
      setSourceTypeRegistry(registry);
    };

    afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

    it('keeps a Metrics-flavor source dataset and its language', async () => {
      register([ExploreFlavor.Metrics]);
      const mockServices = createMockServices();
      const existingDataset = { id: 'external-1', type: 'EXTERNAL_METRICS' };

      await act(async () => {
        renderHookWithProvider(mockServices, existingDataset, undefined, 'External QL');
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('replaces a dataset whose source is not offered on Metrics', async () => {
      register([ExploreFlavor.Logs]);
      const mockServices = createMockServices();
      mockFetch.mockResolvedValue({ children: [] });

      await act(async () => {
        renderHookWithProvider(
          mockServices,
          { id: 'external-1', type: 'EXTERNAL_METRICS' },
          undefined,
          'External QL'
        );
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockSetQueryWithHistory).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: undefined, language: 'PROMQL' })
      );
      expect(mockFetch).toHaveBeenCalled();
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
    it('should clear dataset and set language to PROMQL, then fetch and initialize prometheus connection', async () => {
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
      // First call clears dataset and sets language to PROMQL
      expect(mockSetQueryWithHistory).toHaveBeenNthCalledWith(1, {
        query: '',
        language: 'PROMQL',
        dataset: undefined,
      });
      // Second call sets the fetched prometheus dataset
      expect(mockSetQueryWithHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('when no dataset exists but language is not PROMQL', () => {
    it('should set language to PROMQL and then fetch prometheus connection', async () => {
      const mockServices = createMockServices();
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
        renderHookWithProvider(mockServices, undefined, undefined, 'SQL');
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      expect(mockFetch).toHaveBeenCalled();
      // First call sets language to PROMQL when no dataset and language is not PROMQL
      expect(mockSetQueryWithHistory).toHaveBeenNthCalledWith(1, {
        query: '',
        language: 'PROMQL',
        dataset: undefined,
      });
      // Second call sets the fetched prometheus dataset
      expect(mockSetQueryWithHistory).toHaveBeenCalledTimes(2);
    });
  });
});
