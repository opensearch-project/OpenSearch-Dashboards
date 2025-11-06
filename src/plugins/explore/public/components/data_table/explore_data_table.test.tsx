/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as useFlavorHooks from '../../helpers/use_flavor_id/use_flavor_id';
import { ExploreDataTable } from './explore_data_table';
import {
  legacyReducer,
  uiReducer,
  queryReducer,
  resultsReducer,
} from '../../application/utils/state_management/slices';
import { ExploreFlavor } from '../../../common';

// Mock the hooks and services
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      uiSettings: {
        get: jest.fn((setting) => {
          switch (setting) {
            case 'defaultColumns':
              return ['_source'];
            case 'doc_table:hideTimeColumn':
              return false;
            case 'discover:modifyColumnsOnSwitch':
              return true;
            case 'discover:sampleSize':
              return 500;
            case 'shortDots:enable':
              return false;
            default:
              return undefined;
          }
        }),
      },
    },
  })),
  withOpenSearchDashboards: jest.fn((component) => component),
}));

jest.mock('../../application/hooks', () => ({
  useChangeQueryEditor: jest.fn(() => ({
    onAddFilter: jest.fn(),
  })),
}));

jest.mock('../../application/context', () => ({
  useDatasetContext: jest.fn(() => ({
    dataset: {
      id: 'test-dataset',
      title: 'Test Dataset',
      timeFieldName: '@timestamp',
      fields: {
        getByName: jest.fn(() => ({ type: 'string', filterable: true })),
      },
      flattenHit: jest.fn(() => ({})),
      formatField: jest.fn(() => 'formatted-value'),
    },
  })),
}));

jest.mock('../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getDocViewsRegistry: jest.fn(() => ({
    registry: [],
  })),
}));

jest.mock('./data_table', () => ({
  DataTable: ({ rows }: { rows: any[] }) => (
    <div data-test-subj="data-table">Data Table with {rows.length} rows</div>
  ),
}));

jest.mock('../../helpers/view_component_utils/filter_columns', () => ({
  filterColumns: jest.fn((columns) => columns || ['_source']),
}));

jest.mock('../../helpers/data_table_helper', () => ({
  getLegacyDisplayedColumns: jest.fn((columns) => columns),
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn(() => 'test-cache-key'),
  defaultResultsProcessor: jest.fn(() => ({
    fieldCounts: { field1: 10, field2: 5 },
  })),
}));

describe('ExploreDataTable', () => {
  const createMockStore = (hasResults = true) => {
    return configureStore({
      reducer: {
        legacy: legacyReducer,
        ui: uiReducer,
        query: queryReducer,
        results: resultsReducer,
      },
      preloadedState: {
        legacy: {
          savedSearch: 'test-search',
          savedQuery: undefined,
          columns: ['@timestamp', 'message'],
          sort: [],
          interval: '1h',
          isDirty: false,
          lineCount: undefined,
        },
        ui: {
          activeTabId: 'logs',
          showHistogram: true,
        },
        query: {
          query: 'source=logs',
          language: 'PPL',
          dataset: {
            id: 'test-dataset',
            title: 'test-dataset',
            type: 'INDEX_PATTERN',
          },
        },
        results: hasResults
          ? {
              'test-cache-key': {
                elapsedMs: 100,
                took: 10,
                timed_out: false,
                _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
                hits: {
                  hits: [
                    {
                      _id: '1',
                      _index: 'test-index',
                      _type: '_doc',
                      _score: 1.0,
                      _source: { message: 'test message', '@timestamp': '2023-01-01T00:00:00Z' },
                    },
                  ],
                  total: 1,
                  max_score: 1.0,
                },
                fieldSchema: [],
              },
            }
          : {},
      },
    });
  };

  const renderComponent = (hasResults = true) => {
    const store = createMockStore(hasResults);
    return render(
      <Provider store={store}>
        <ExploreDataTable />
      </Provider>
    );
  };

  beforeEach(() => {
    jest.spyOn(useFlavorHooks, 'useFlavorId').mockReturnValue(ExploreFlavor.Logs);
  });

  it('renders the explore data table container', () => {
    renderComponent();
    expect(screen.getByTestId('discoverTable')).toBeInTheDocument();
  });

  it('renders data table with results when data is available', () => {
    renderComponent(true);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Data Table with 1 rows')).toBeInTheDocument();
  });

  it('renders data table with no results when no data is available', () => {
    renderComponent(false);
    expect(screen.getByTestId('data-table')).toBeInTheDocument();
    expect(screen.getByText('Data Table with 0 rows')).toBeInTheDocument();
  });

  it('applies correct container properties', () => {
    renderComponent();
    const container = screen.getByTestId('discoverTable');
    expect(container).toHaveAttribute('data-render-complete', 'true');
    expect(container).toHaveAttribute('data-shared-item', '');
    expect(container).toHaveAttribute('data-title', 'test-search');
    expect(container).toHaveAttribute('data-description', 'test-search');
    expect(container).toHaveClass('eui-xScrollWithShadows');
  });
});
