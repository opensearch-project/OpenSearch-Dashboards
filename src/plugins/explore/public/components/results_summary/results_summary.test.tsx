/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ResultsSummary } from './results_summary';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';
import { EditorMode } from '../../application/utils/state_management/types';
import { ResultStatus } from '../../../../data/public';

jest.mock('./use_metrics', () => ({
  useMetrics: () => ({
    reportMetric: jest.fn(),
    reportCountMetric: jest.fn(),
  }),
}));

jest.mock('../../services/usage_collector', () => ({
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
      editorMode: EditorMode.Prompt,
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

// Create a wrapper component to provide required props to ResultsSummary
const TestResultsSummary = () => {
  const [summary, setSummary] = React.useState('');
  const { reportCountMetric } = jest.requireMock('./use_metrics').useMetrics();

  return (
    <ResultsSummary
      summary={summary}
      setSummary={setSummary}
      reportCountMetric={reportCountMetric}
    />
  );
};

describe('ResultsSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders loading state when fetching summary', async () => {
    mockServices.http.post.mockImplementation(() => new Promise(() => {})); // Never resolves to simulate loading
    renderWithProviders(<TestResultsSummary />);
    await waitFor(() => {
      expect(screen.getByText('Generating summary')).toBeInTheDocument();
    });
  });

  it('renders summary content when available', async () => {
    mockServices.http.post.mockResolvedValue('Test summary content');
    renderWithProviders(<TestResultsSummary />);
    await waitFor(() => {
      expect(screen.getByText('Generating summary')).toBeInTheDocument();
    });
  });

  it('handles error when fetching summary fails', async () => {
    mockServices.http.post.mockRejectedValue(new Error('Failed to fetch'));
    renderWithProviders(<TestResultsSummary />);
    await waitFor(() => {
      expect(screen.getByText('Generating summary')).toBeInTheDocument();
    });
  });

  it('does not fetch summary when query results are empty', async () => {
    const storeOverrides = {
      results: {
        'source = opensearch_dashboards_sample_data_logs': {
          hits: {
            hits: [],
          },
        },
      },
    };
    renderWithProviders(<TestResultsSummary />, storeOverrides);
    await waitFor(() => {
      expect(mockServices.http.post).not.toHaveBeenCalled();
    });
  });
});
