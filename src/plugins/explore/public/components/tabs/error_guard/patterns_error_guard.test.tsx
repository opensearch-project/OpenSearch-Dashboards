/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PatternsErrorGuard } from './patterns_error_guard';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import * as datasetContext from '../../../application/context/dataset_context/dataset_context';

const mockStore = configureMockStore([]);

jest.mock('../../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(),
}));

const mockTabDefinition: TabDefinition = {
  id: 'test-patterns-tab',
  label: 'Test Patterns Tab',
  component: () => <div>Test Component</div>,
  flavor: ['logs'] as any,
  supportedLanguages: ['PPL'],
};

describe('PatternsErrorGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with prepareQuery function and field selector', () => {
    const mockDataset = {
      fields: {
        getAll: () => [
          { name: 'message', type: 'string', scripted: false, subType: undefined },
          { name: 'level', type: 'string', scripted: false, subType: undefined },
          { name: 'timestamp', type: 'number', scripted: false, subType: undefined },
        ],
      },
      metaFields: [],
    };

    (datasetContext.useDatasetContext as jest.Mock).mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });

    const store = mockStore({
      query: {
        language: 'PPL',
      },
      tab: {
        patterns: {
          patternsField: 'message',
        },
      },
    });

    const customTabDefinition = {
      ...mockTabDefinition,
      prepareQuery: () => 'Custom prepared query',
    };

    const mockServices = {
      data: {
        dataViews: {
          get: jest.fn().mockResolvedValue(undefined),
        },
        query: {
          queryString: {
            getDatasetService: jest.fn().mockReturnValue({
              cacheDataset: jest.fn(),
            }),
          },
        },
      },
    };

    render(
      <Provider store={store}>
        <OpenSearchDashboardsContextProvider services={mockServices}>
          <PatternsErrorGuard registryTab={customTabDefinition} />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(screen.getByText('No valid patterns found')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Custom prepared query')).toBeInTheDocument();
    expect(
      screen.getByText('Try selecting a different field to analyze patterns:')
    ).toBeInTheDocument();

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('message');
  });
});
