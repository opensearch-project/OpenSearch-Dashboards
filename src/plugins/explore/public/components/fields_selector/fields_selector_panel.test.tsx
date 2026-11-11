/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { DiscoverPanel } from './fields_selector_panel';

// Mock all the complex dependencies
jest.mock('../../../../data/public', () => ({
  UI_SETTINGS: {
    QUERY_ENHANCEMENTS_ENABLED: 'query:enhancements:enabled',
  },
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      uiSettings: {
        get: jest.fn(() => false),
      },
    },
  }),
}));

jest.mock('../../application/hooks', () => ({
  useChangeQueryEditor: () => ({
    onAddFilter: jest.fn(),
  }),
}));

jest.mock('../../application/context', () => ({
  useDatasetContext: jest.fn(() => ({ dataset: null })),
}));

jest.mock('../../application/utils/state_management/slices', () => ({
  addColumn: jest.fn(),
  removeColumn: jest.fn(),
  moveColumn: jest.fn(),
  setColumns: jest.fn((columns) => ({ type: 'setColumns', payload: columns })),
  resultsCache: new Map(),
}));

jest.mock('../../application/utils/state_management/selectors', () => {
  const columns: string[] = [];
  const query = {};
  return {
    selectColumns: jest.fn(() => columns),
    selectQuery: jest.fn(() => query),
  };
});

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultResultsProcessor: jest.fn(),
  defaultPrepareQueryString: jest.fn(() => 'cache-key'),
}));

jest.mock('../../application/legacy/discover/application/utils/columns', () => ({
  buildColumns: jest.fn((cols) => cols),
}));

jest.mock('.', () => ({
  DiscoverSidebar: jest.fn(() => <div data-testid="discover-sidebar">Sidebar</div>),
}));

const { useDatasetContext: mockUseDatasetContext } = jest.requireMock('../../application/context');
const { resultsCache: mockResultsCache } = jest.requireMock(
  '../../application/utils/state_management/slices'
);
const { defaultResultsProcessor: mockDefaultResultsProcessor } = jest.requireMock(
  '../../application/utils/state_management/actions/query_actions'
);
const { DiscoverSidebar: MockDiscoverSidebar } = jest.requireMock('.');
const lastSidebarProps = () =>
  MockDiscoverSidebar.mock.calls[MockDiscoverSidebar.mock.calls.length - 1][0];

const mockStore = configureStore({
  reducer: {
    query: () => ({}),
    results: () => ({}),
    ui: () => ({ columns: [] }),
  },
});

const storeWithResults = (results: Record<string, any>) =>
  configureStore({
    reducer: {
      query: () => ({}),
      results: () => results,
      ui: () => ({ columns: [] }),
    },
  });

describe('DiscoverPanel', () => {
  it('renders discover sidebar', () => {
    render(
      <Provider store={mockStore}>
        <DiscoverPanel />
      </Provider>
    );

    expect(screen.getByText('Sidebar')).toBeInTheDocument();
  });

  describe('results while a query is in flight', () => {
    const rawResults = { hits: { hits: [{ _id: '1', _source: { a: 1 } }] } };
    const processed = { fieldCounts: { a: 1 }, hits: rawResults.hits };

    beforeEach(() => {
      MockDiscoverSidebar.mockClear();
      mockResultsCache.clear();
      mockDefaultResultsProcessor.mockReset().mockReturnValue(processed);
    });

    afterEach(() => {
      mockUseDatasetContext.mockReturnValue({ dataset: null });
    });

    const renderWithStore = (store: any) =>
      render(
        <Provider store={store}>
          <DiscoverPanel />
        </Provider>
      );

    it('keeps the last fieldCounts and hits for the same dataset when results are cleared', () => {
      mockUseDatasetContext.mockReturnValue({ dataset: { id: 'ds-1' } });
      mockResultsCache.set('cache-key', rawResults);
      const { rerender } = renderWithStore(storeWithResults({ 'cache-key': { status: 'READY' } }));
      expect(lastSidebarProps().fieldCounts).toEqual({ a: 1 });

      // Results cleared (query re-run): the previous results stay on screen.
      rerender(
        <Provider store={storeWithResults({})}>
          <DiscoverPanel />
        </Provider>
      );
      expect(lastSidebarProps().fieldCounts).toEqual({ a: 1 });
      expect(lastSidebarProps().hits).toEqual(rawResults.hits.hits);
    });

    it('starts from empty when the dataset changes', () => {
      mockUseDatasetContext.mockReturnValue({ dataset: { id: 'ds-1' } });
      mockResultsCache.set('cache-key', rawResults);
      const { rerender } = renderWithStore(storeWithResults({ 'cache-key': { status: 'READY' } }));
      expect(lastSidebarProps().fieldCounts).toEqual({ a: 1 });

      mockUseDatasetContext.mockReturnValue({ dataset: { id: 'ds-2' } });
      rerender(
        <Provider store={storeWithResults({})}>
          <DiscoverPanel />
        </Provider>
      );
      expect(lastSidebarProps().fieldCounts).toEqual({});
      expect(lastSidebarProps().hits).toEqual([]);
    });

    it('passes the same empty objects across renders when there are no results', () => {
      mockUseDatasetContext.mockReturnValue({ dataset: { id: 'ds-1' } });
      const { rerender } = renderWithStore(mockStore);
      const first = lastSidebarProps();
      rerender(
        <Provider store={mockStore}>
          <DiscoverPanel />
        </Provider>
      );
      const second = lastSidebarProps();
      expect(second.fieldCounts).toBe(first.fieldCounts);
      expect(second.hits).toBe(first.hits);
      expect(second.columns).toBe(first.columns);
    });
  });
});
