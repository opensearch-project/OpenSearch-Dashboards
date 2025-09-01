/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useTabResults } from './use_tab_results';
import {
  OpenSearchDashboardsReactContextValue,
  useOpenSearchDashboards,
} from '../../../../../opensearch_dashboards_react/public';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';
import {
  uiInitialState,
  uiReducer,
  resultsInitialState,
  resultsReducer,
  queryInitialState,
  queryReducer,
  QueryState,
  UIState,
} from '../state_management/slices';
import { tabReducer } from '../state_management/slices/tab/tab_slice';
import { CoreStart } from 'opensearch-dashboards/public';
import { ExploreServices } from '../../../types';

// Mock dependencies
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      tabRegistry: {
        getTab: jest.fn(),
      },
    },
  }),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));
jest.mock('../state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn().mockReturnValue('default-cache-key'),
}));

const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.MockedFunction<
  typeof useOpenSearchDashboards
>;
const mockDefaultPrepareQuery = defaultPrepareQueryString as jest.MockedFunction<
  typeof defaultPrepareQueryString
>;

// Mock store state type
interface MockRootState {
  query: Pick<QueryState, 'query'>;
  ui: Pick<UIState, 'activeTabId'>;
  results: { [key: string]: any };
  tab: {
    patterns: {
      patternsField?: string;
      usingRegexPatterns: boolean;
    };
    logs: {};
  };
}

// Helper function to create a mock store
const createMockStore = (initialState: MockRootState) => {
  const preloadedState = {
    ui: {
      ...uiInitialState,
      ...initialState.ui,
    },
    query: {
      ...queryInitialState,
      ...initialState.query,
    },
    results: {
      ...resultsInitialState,
      ...initialState.results,
    },
    tab: initialState.tab,
  };

  return configureStore({
    reducer: {
      ui: uiReducer,
      query: queryReducer,
      results: resultsReducer,
      tab: tabReducer,
    },
    preloadedState,
  });
};

// Helper function to render hook with store
const renderHookWithStore = (store: any) => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(() => useTabResults(), { wrapper });
};

describe('useTabResults', () => {
  let mockServices: any;
  let mockTab: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTab = {
      prepareQuery: jest.fn(),
    };

    mockServices = {
      tabRegistry: {
        getTab: jest.fn(),
      },
    };

    mockUseOpenSearchDashboards.mockReturnValue({
      services: mockServices,
    } as OpenSearchDashboardsReactContextValue<Partial<CoreStart> & ExploreServices>);

    mockDefaultPrepareQuery.mockReturnValue('default-cache-key');
  });

  it('should return results when cache key exists', () => {
    const initialState: MockRootState = {
      query: { query: 'test query' },
      ui: { activeTabId: 'tab-1' },
      results: { 'custom-cache-key': { data: 'test data' } },
      tab: {
        logs: {},
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      },
    };

    mockServices.tabRegistry.getTab.mockReturnValue(mockTab);
    mockTab.prepareQuery.mockReturnValue('custom-cache-key');

    const store = createMockStore(initialState);
    const { result } = renderHookWithStore(store);

    expect(result.current.results).toEqual({ data: 'test data' });
    expect(mockTab.prepareQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' })
    );
  });

  it('should return null when cache key does not exist', () => {
    const initialState: MockRootState = {
      query: { query: 'test query' },
      ui: { activeTabId: 'tab-1' },
      results: { 'other-cache-key': { data: 'other data' } },
      tab: {
        logs: {},
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      },
    };

    mockServices.tabRegistry.getTab.mockReturnValue(mockTab);
    mockTab.prepareQuery.mockReturnValue('non-existent-cache-key');

    const store = createMockStore(initialState);
    const { result } = renderHookWithStore(store);

    expect(result.current.results).toBeUndefined();
    expect(mockTab.prepareQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' })
    );
  });

  it('should use defaultPrepareQueryString when tab has no custom prepareQuery', () => {
    const initialState: MockRootState = {
      query: { query: 'test query' },
      ui: { activeTabId: 'tab-1' },
      results: { 'default-cache-key': { data: 'default data' } },
      tab: {
        logs: {},
        patterns: {
          patternsField: 'message',
          usingRegexPatterns: false,
        },
      },
    };

    mockServices.tabRegistry.getTab.mockReturnValue({});

    const store = createMockStore(initialState);
    const { result } = renderHookWithStore(store);

    expect(result.current.results).toEqual({ data: 'default data' });
    expect(mockDefaultPrepareQuery).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' })
    );
  });
});
