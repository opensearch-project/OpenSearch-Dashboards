/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ResultsSummaryPanel } from './results_summary_panel';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { EditorMode, QueryExecutionStatus } from '../../application/utils/state_management/types';

jest.mock('./use_metrics', () => ({
  useMetrics: () => ({
    reportMetric: jest.fn(),
    reportCountMetric: jest.fn(),
  }),
}));

const mockServices = {
  core: {
    application: {
      capabilities: {
        assistant: { enabled: true },
      },
    },
  },
  http: {
    post: jest.fn(),
  },
};

const createMockStore = (overrides = {}) => {
  const defaultState = {
    query: {
      query: 'source = opensearch_dashboards_sample_data_logs',
      dataset: { dataSource: { id: 'test-ds' } },
    },
    queryEditor: {
      queryStatus: { status: QueryExecutionStatus.READY },
      editorMode: EditorMode.SingleEmpty,
      lastExecutedPrompt: '',
      summaryAgentIsAvailable: true,
    },
    results: {
      'source = opensearch_dashboards_sample_data_logs': {
        hits: {
          hits: [],
        },
      },
    },
    ...overrides,
  };

  return configureStore({
    reducer: {
      query: (state = defaultState.query) => state,
      queryEditor: (state = defaultState.queryEditor) => state,
      results: (state = defaultState.results) => state,
    },
    preloadedState: defaultState,
  });
};

const renderWithProviders = (component: React.ReactElement, storeOverrides = {}) => {
  const store = createMockStore(storeOverrides);
  return render(
    <Provider store={store}>
      <OpenSearchDashboardsContextProvider services={mockServices}>
        {component}
      </OpenSearchDashboardsContextProvider>
    </Provider>
  );
};

describe('ResultsSummaryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders when assistant is enabled and agent is available', () => {
    renderWithProviders(<ResultsSummaryPanel />);
    expect(screen.getByTestId('exploreResultsSummary')).toBeInTheDocument();
  });

  it('does not render when assistant is disabled', () => {
    const servicesWithDisabledAssistant = {
      ...mockServices,
      core: {
        ...mockServices.core,
        application: {
          capabilities: { assistant: { enabled: false } },
        },
      },
    };

    render(
      <Provider store={createMockStore()}>
        <OpenSearchDashboardsContextProvider services={servicesWithDisabledAssistant}>
          <ResultsSummaryPanel />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(screen.queryByTestId('exploreResultsSummary')).not.toBeInTheDocument();
  });

  it('does not generate summary when conditions not met', () => {
    renderWithProviders(<ResultsSummaryPanel />);
    expect(mockServices.http.post).not.toHaveBeenCalled();
  });
});
