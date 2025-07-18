/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ResultsSummary } from './results_summary';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { EditorMode } from '../../../application/utils/state_management/types';
import { ResultStatus } from '../../../../../data/public';

jest.mock('./use_metrics', () => ({
  useMetrics: () => ({
    reportMetric: jest.fn(),
    reportCountMetric: jest.fn(),
  }),
}));

jest.mock('../../../services/usage_collector', () => ({
  getUsageCollector: () => ({}),
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
      overallQueryStatus: { status: ResultStatus.READY },
      editorMode: EditorMode.SinglePrompt,
      lastExecutedPrompt: 'test prompt',
      summaryAgentIsAvailable: true,
    },
    results: {
      'source = opensearch_dashboards_sample_data_logs': {
        hits: {
          hits: [{ _source: { test: 'data' } }],
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
    renderWithProviders(<ResultsSummary />);
    expect(screen.getByRole('button', { name: 'Generating...' })).toBeInTheDocument();
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
          <ResultsSummary />
        </OpenSearchDashboardsContextProvider>
      </Provider>
    );

    expect(screen.queryByRole('button', { name: 'Generate Summary' })).not.toBeInTheDocument();
  });

  it('does not render when agent is not available', () => {
    const storeOverrides = {
      queryEditor: {
        overallQueryStatus: { status: ResultStatus.READY },
        editorMode: EditorMode.SinglePrompt,
        lastExecutedPrompt: 'test prompt',
        summaryAgentIsAvailable: false,
      },
    };

    renderWithProviders(<ResultsSummary />, storeOverrides);
    expect(screen.queryByRole('button', { name: 'Generate Summary' })).not.toBeInTheDocument();
  });

  it('renders with correct props when conditions are met', () => {
    renderWithProviders(<ResultsSummary />);
    const summaryButton = screen.getByRole('button', { name: 'Generating...' });
    expect(summaryButton).toBeInTheDocument();
  });
});
