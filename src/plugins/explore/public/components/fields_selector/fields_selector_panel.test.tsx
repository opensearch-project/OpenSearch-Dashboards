/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  useDatasetContext: () => ({
    dataset: null,
  }),
}));

jest.mock('../../application/utils/state_management/slices', () => ({
  addColumn: jest.fn(),
  removeColumn: jest.fn(),
  moveColumn: jest.fn(),
  setColumns: jest.fn(),
}));

jest.mock('../../application/utils/state_management/selectors', () => ({
  selectColumns: jest.fn(() => []),
  selectQuery: jest.fn(() => ({})),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultResultsProcessor: jest.fn(),
  defaultPrepareQueryString: jest.fn(),
}));

jest.mock('../../application/legacy/discover/application/utils/columns', () => ({
  buildColumns: jest.fn((cols) => cols),
}));

jest.mock('.', () => ({
  DiscoverSidebar: () => <div data-testid="discover-sidebar">Sidebar</div>,
}));

const mockStore = configureStore({
  reducer: {
    query: () => ({}),
    results: () => ({}),
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
});
