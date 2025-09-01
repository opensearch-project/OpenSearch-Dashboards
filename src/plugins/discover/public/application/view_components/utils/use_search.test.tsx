/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { createMemoryHistory } from 'history';
import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { Subject } from 'rxjs';
import { createDataExplorerServicesMock } from '../../../../../data_explorer/public/utils/mocks';
import { DiscoverViewServices } from '../../../build_services';
import { discoverPluginMock } from '../../../mocks';
import { ResultStatus, safeJSONParse, useSearch } from './use_search';
import { Filter, ISearchSource, UI_SETTINGS } from '../../../../../data/common';
import { opensearchFilters } from 'src/plugins/data/public';

jest.mock('./use_index_pattern', () => ({
  useIndexPattern: jest.fn().mockReturnValue(true),
}));

jest.mock('../../helpers/validate_time_range', () => ({
  validateTimeRange: jest.fn().mockReturnValue(true),
}));

const mockFilterA: Filter = {
  meta: { disabled: false, negate: false, alias: 'test filter A' },
  query: {},
  $state: { store: opensearchFilters.FilterStateStore.APP_STATE },
};

const mockFilterB: Filter = {
  meta: { disabled: false, negate: false, alias: 'test filter B' },
  query: {},
  $state: { store: opensearchFilters.FilterStateStore.APP_STATE },
};

const mockQuery = {
  query: 'test query',
  language: 'test language',
};

const mockDefaultQuery = {
  query: 'default query',
  language: 'default language',
};

const mockHitsCount = 50;
const mockHits = new Array(50).fill({});

const mockSavedSearch = {
  id: 'test-saved-search',
  title: 'Test Saved Search',
  searchSource: {
    setField: jest.fn(),
    getField: jest.fn().mockReturnValue(mockQuery),
    fetch: jest.fn(() => ({ hits: { hits: mockHits } })),
    getSearchRequestBody: jest.fn().mockResolvedValue({}),
    getOwnField: jest.fn().mockReturnValue(mockFilterB),
    getDataFrame: jest.fn(() => ({ name: 'test-pattern' })),
  },
  getFullPath: jest.fn(),
  getOpenSearchType: jest.fn(),
};

const mockSavedSearchEmptyQuery = {
  id: 'test-saved-search',
  title: 'Test Saved Search',
  searchSource: {
    setField: jest.fn(),
    getField: jest.fn().mockReturnValue(undefined),
    fetch: jest.fn(),
    getSearchRequestBody: jest.fn().mockResolvedValue({}),
    getOwnField: jest.fn(),
    getDataFrame: jest.fn(() => ({ name: 'test-pattern' })),
  },
  getFullPath: jest.fn(),
  getOpenSearchType: jest.fn(),
};

jest.mock('./update_search_source', () => ({
  updateSearchSource: ({ searchSource }: { searchSource?: ISearchSource }) => searchSource,
}));

const createMockServices = (): DiscoverViewServices => {
  const dataExplorerServicesMock = createDataExplorerServicesMock();
  const discoverServicesMock = discoverPluginMock.createDiscoverServicesMock();
  const services: DiscoverViewServices = {
    ...dataExplorerServicesMock,
    ...discoverServicesMock,
  };

  (services.data.query.timefilter.timefilter.getRefreshInterval as jest.Mock).mockReturnValue({
    pause: false,
    value: 10,
  });
  (services.filterManager.getAppFilters as jest.Mock).mockReturnValue([mockFilterA]);
  services.getSavedSearchById = jest.fn().mockResolvedValue(mockSavedSearch);
  return services;
};

const history = createMemoryHistory();
const mockStore = {
  getState: () => ({
    discover: {
      savedSearch: 'test-saved-search',
      sort: [],
      interval: 'auto',
      savedQuery: undefined,
    },
  }),
  subscribe: jest.fn(),
  dispatch: jest.fn(),
};
const wrapper: React.FC = ({ children }) => {
  return (
    // @ts-expect-error TS2769 TODO(ts-error): fixme
    <Provider store={mockStore}>
      <Router history={history}>{children}</Router>
    </Provider>
  );
};

describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state when search on page load is enabled', async () => {
    const services = createMockServices();
    (services.uiSettings.get as jest.Mock).mockReturnValueOnce(true);

    const { result, waitForNextUpdate } = renderHook(() => useSearch(services), { wrapper });

    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.LOADING })
    );

    // useSearch updates state async in useEffect, wait for it to finish to
    // avoid warning
    await act(async () => {
      await waitForNextUpdate();
    });
  });

  it('should initialize with uninitialized state when search on page load is disabled', async () => {
    const services = createMockServices();
    (services.uiSettings.get as jest.Mock).mockReturnValueOnce(false);
    (services.data.query.timefilter.timefilter.getRefreshInterval as jest.Mock).mockReturnValue({
      pause: true,
      value: 10,
    });

    const { result, waitForNextUpdate } = renderHook(() => useSearch(services), { wrapper });
    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.UNINITIALIZED })
    );

    await act(async () => {
      await waitForNextUpdate();
    });
  });

  it('should initialize with uninitialized state when dataset type config search on page load is disabled', async () => {
    const services = createMockServices();
    (services.uiSettings.get as jest.Mock).mockReturnValueOnce(true);
    (services.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
      meta: { searchOnLoad: false },
    });
    (services.data.query.timefilter.timefilter.getRefreshInterval as jest.Mock).mockReturnValue({
      pause: true,
      value: 10,
    });

    const { result, waitForNextUpdate } = renderHook(() => useSearch(services), { wrapper });
    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.UNINITIALIZED })
    );

    await act(async () => {
      await waitForNextUpdate();
    });
  });

  it('should initialize with uninitialized state when dataset type config search on page load is enabled but the UI setting is disabled', async () => {
    const services = createMockServices();
    (services.uiSettings.get as jest.Mock).mockReturnValueOnce(false);
    (services.data.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
      meta: { searchOnLoad: true },
    });
    (services.data.query.timefilter.timefilter.getRefreshInterval as jest.Mock).mockReturnValue({
      pause: true,
      value: 10,
    });

    const { result, waitForNextUpdate } = renderHook(() => useSearch(services), { wrapper });
    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.UNINITIALIZED })
    );

    await act(async () => {
      await waitForNextUpdate();
    });
  });

  it('should update startTime when hook rerenders', async () => {
    const services = createMockServices();

    const { result, rerender, waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    const initialStartTime = result.current.data$.getValue().queryStatus?.startTime;
    expect(initialStartTime).toBeDefined();

    act(() => {
      rerender();
    });

    const newStartTime = result.current.data$.getValue().queryStatus?.startTime;
    expect(newStartTime).toBeDefined();
    expect(newStartTime).not.toEqual(initialStartTime);

    await act(async () => {
      await waitForNextUpdate();
    });
  });

  it('should reset data observable when dataset changes', async () => {
    const services = createMockServices();
    const mockDatasetUpdates$ = new Subject();
    services.data.query.queryString.getUpdates$ = jest.fn().mockReturnValue(mockDatasetUpdates$);

    const { result, waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    act(() => {
      result.current.data$.next({ status: ResultStatus.READY });
    });

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.READY })
    );

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'different-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.LOADING, rows: [] })
    );
  });

  it('should load saved search', async () => {
    const services = createMockServices();
    services.data.query.queryString.setQuery = jest.fn();

    const { waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(services.data.query.queryString.setQuery).toBeCalledWith(mockQuery);
    expect(services.filterManager.setAppFilters).toBeCalledWith(
      expect.arrayContaining([mockFilterA, mockFilterB])
    );
  });

  it('if no saved search, use get query', async () => {
    const services = createMockServices();
    services.getSavedSearchById = jest.fn().mockResolvedValue(mockSavedSearchEmptyQuery);
    services.data.query.queryString.getQuery = jest.fn().mockReturnValue(mockDefaultQuery);
    services.data.query.queryString.setQuery = jest.fn();

    const { waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(services.data.query.queryString.setQuery).toBeCalledWith(mockDefaultQuery);
  });

  it('should call fetch without long numerals support when configured not to', async () => {
    const services = createMockServices();
    (services.uiSettings.get as jest.Mock).mockImplementation((key) =>
      Promise.resolve(key === UI_SETTINGS.DATA_WITH_LONG_NUMERALS ? false : undefined)
    );

    const mockDatasetUpdates$ = new Subject();
    services.data.query.queryString.getUpdates$ = jest.fn().mockReturnValue(mockDatasetUpdates$);

    const { waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    await act(async () => {
      try {
        await waitForNextUpdate({ timeout: 1000 });
      } catch (_) {
        // Do nothing.
      }
    });

    expect(mockSavedSearch.searchSource.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        withLongNumeralsSupport: false,
      })
    );
  });

  it('should call fetch with long numerals support when configured to', async () => {
    const services = createMockServices();
    (services.uiSettings.get as jest.Mock).mockImplementation((key) =>
      Promise.resolve(key === UI_SETTINGS.DATA_WITH_LONG_NUMERALS ? true : undefined)
    );

    const mockDatasetUpdates$ = new Subject();
    services.data.query.queryString.getUpdates$ = jest.fn().mockReturnValue(mockDatasetUpdates$);

    const { waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    await act(async () => {
      try {
        await waitForNextUpdate({ timeout: 1000 });
      } catch (_) {
        // Do nothing.
      }
    });

    expect(mockSavedSearch.searchSource.fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        withLongNumeralsSupport: true,
      })
    );
  });

  it('should call fetch when fetchForMaxCsvOption is called', async () => {
    const services = createMockServices();
    const mockDatasetUpdates$ = new Subject();
    services.data.query.queryString.getUpdates$ = jest.fn().mockReturnValue(mockDatasetUpdates$);

    const { result, waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    await act(async () => {
      try {
        await waitForNextUpdate({ timeout: 1000 });
      } catch (_) {
        // Do nothing.
      }
    });

    await act(async () => {
      const hits = await result.current.fetchForMaxCsvOption(mockHitsCount);
      expect(hits.length).toBe(mockHitsCount);
    });
    expect(mockSavedSearch.searchSource.fetch).toHaveBeenLastCalledWith({
      abortSignal: expect.anything(),
      withLongNumeralsSupport: undefined,
    });
  });
});

describe('safeJSONParse', () => {
  it('should covert string to JSON if possible', () => {
    const validJSONString = '{"result":true, "count":42}';
    const invalidJSONString = 'invalidJSON';
    expect(safeJSONParse(validJSONString)).toEqual(JSON.parse(validJSONString));
    expect(safeJSONParse(invalidJSONString)).toEqual(invalidJSONString);
  });
});
