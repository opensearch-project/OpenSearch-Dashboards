/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActionBar } from './action_bar';

// Mock the child component
jest.mock('./results_action_bar/results_action_bar', () => ({
  DiscoverResultsActionBar: () => <div data-test-subj="discoverResultsActionBar" />,
}));

// Mock the hooks and context
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      core: {
        application: {
          navigateToApp: jest.fn(),
        },
      },
      inspector: {
        open: jest.fn(),
      },
      inspectorAdapters: {},
      data: {
        query: {
          queryString: {
            getQuery: () => ({}),
          },
          filterManager: {
            getFilters: () => [],
          },
          timefilter: {
            timefilter: {
              getTime: () => ({}),
            },
          },
          state$: {
            subscribe: () => ({
              unsubscribe: jest.fn(),
            }),
          },
        },
      },
      slotRegistry: {
        getSortedItems$: () => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        }),
      },
    },
  }),
  withOpenSearchDashboards: jest.fn((component: any) => component),
}));

jest.mock('../../../application/legacy/discover/application/utils/state_management', () => ({
  useSelector: () => 'test-saved-search',
}));

jest.mock('../../../application/context', () => ({
  useDatasetContext: () => ({
    dataset: { id: 'test-dataset' },
  }),
}));

jest.mock('../../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: () => ({
    results: {
      hits: {
        hits: [],
        total: 0,
      },
      elapsedMs: 100,
    },
  }),
}));

jest.mock('../../../application/utils/hooks/use_histogram_results', () => ({
  useHistogramResults: () => ({
    results: {
      hits: {
        total: { value: 10, relation: 'eq' },
      },
    },
  }),
}));

describe('ActionBar', () => {
  test('should render the action bar component', () => {
    render(<ActionBar />);
    expect(screen.getByTestId('discoverResultsActionBar')).toBeInTheDocument();
  });

  test('should render without crashing when no results', () => {
    render(<ActionBar />);
    expect(screen.getByTestId('discoverResultsActionBar')).toBeInTheDocument();
  });
});
