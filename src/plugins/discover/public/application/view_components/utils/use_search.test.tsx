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
import { ResultStatus, useSearch } from './use_search';

jest.mock('./use_index_pattern', () => ({
  useIndexPattern: jest.fn(),
}));

const mockSavedSearch = {
  id: 'test-saved-search',
  title: 'Test Saved Search',
  searchSource: {
    setField: jest.fn(),
    getField: jest.fn(),
    fetch: jest.fn(),
    getSearchRequestBody: jest.fn().mockResolvedValue({}),
    getOwnField: jest.fn(),
    getDataFrame: jest.fn(() => ({ name: 'test-pattern' })),
  },
  getFullPath: jest.fn(),
  getOpenSearchType: jest.fn(),
};

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

  it('should update startTime when hook rerenders', async () => {
    const services = createMockServices();

    const { result, rerender, waitForNextUpdate } = renderHook(() => useSearch(services), {
      wrapper,
    });

    const initialStartTime = result.current.data$.getValue().queryStatus?.startTime;
    expect(initialStartTime).toBeDefined();

    rerender();
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
      result.current.data$.next({ status: ResultStatus.READY });
    });

    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.READY })
    );

    act(() => {
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
      mockDatasetUpdates$.next({
        dataset: { id: 'new-dataset-id2', title: 'New Dataset', type: 'INDEX_PATTERN' },
      });
    });

    await act(async () => {
      await waitForNextUpdate();
    });

    expect(result.current.data$.getValue()).toEqual(
      expect.objectContaining({ status: ResultStatus.LOADING })
    );
  });
});
