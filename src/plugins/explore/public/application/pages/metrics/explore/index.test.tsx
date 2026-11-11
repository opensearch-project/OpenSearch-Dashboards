/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { ExploreFlavor } from '../../../../../common';
import {
  SourceTypeEmptyStateProps,
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../../services/source_type_registry';

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
  withOpenSearchDashboards: jest.fn((component) => component),
}));
jest.mock('../../../hooks/editor_hooks/use_set_editor_text/use_set_editor_text', () => ({
  useSetEditorText: () => jest.fn(),
}));
jest.mock('./components/metric_browser', () => ({
  MetricBrowser: () => <div data-test-subj="metricBrowser" />,
}));
jest.mock('./components/metric_detail', () => ({
  MetricDetail: () => <div data-test-subj="metricDetail" />,
}));
jest.mock('./services/prometheus_client', () => ({
  PrometheusClient: jest
    .fn()
    .mockImplementation(() => ({ clearCache: jest.fn(), abort: jest.fn() })),
}));

import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';
import { MetricsExploreTab } from '.';

const sourceDataset = { id: 'source-dataset', title: 'Source dataset', type: 'TEST_SOURCE' };
const SourceEmptyState = jest.fn(({ children, onRefresh }: SourceTypeEmptyStateProps) => (
  <div data-test-subj="sourceEmptyState">
    <button onClick={onRefresh}>Source refresh</button>
    {children}
  </div>
));

const data = {
  query: {
    queryString: { getDatasetService: () => ({ getType: () => undefined }) },
    timefilter: {
      timefilter: {
        getTime: () => ({ from: 'now-15m', to: 'now' }),
        getTimeUpdate$: () => ({ subscribe: () => ({ unsubscribe: jest.fn() }) }),
        getBounds: () => ({ min: undefined, max: undefined }),
        calculateBounds: () => ({ min: undefined, max: undefined }),
        setTime: jest.fn(),
      },
    },
  },
};

const renderTab = (dataset: Record<string, unknown>) => {
  const actions: Array<{ type: string; payload?: unknown }> = [];
  const store = configureStore({
    reducer: {
      query: (state = { query: '', language: 'PROMQL', dataset }) => state,
      tab: (state = {}) => state,
      queryEditor: (state = { hasUserInitiatedQuery: false }) => state,
      ui: (state = {}) => state,
    },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(
        () => (next) => (action) => {
          actions.push(action as { type: string; payload?: unknown });
          return next(action);
        }
      ),
  });
  render(
    <Provider store={store}>
      <MetricsExploreTab />
    </Provider>
  );
  return actions;
};

describe("MetricsExploreTab with a registered source's empty state", () => {
  beforeEach(() => {
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: { data } });
    const registry = new SourceTypeRegistryService();
    registry.register({
      id: 'test-source',
      label: 'Test source',
      datasetTypes: ['TEST_SOURCE'],
      flavors: [ExploreFlavor.Metrics],
      resolveDefaultDataset: async () => undefined,
      metricsResourceClientId: 'prometheus',
      emptyState: SourceEmptyState,
    });
    setSourceTypeRegistry(registry);
    SourceEmptyState.mockClear();
  });
  afterAll(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  it("wraps the tab for the source's datasets, with the metric browser as children", () => {
    renderTab(sourceDataset);

    expect(screen.getByTestId('sourceEmptyState')).toBeInTheDocument();
    expect(screen.getByTestId('metricBrowser')).toBeInTheDocument();
    expect(SourceEmptyState).toHaveBeenCalledWith(
      expect.objectContaining({
        location: 'metricsExplore',
        dataset: sourceDataset,
        data,
        flavor: ExploreFlavor.Metrics,
      }),
      expect.anything()
    );
  });

  it("passes the query bar's refresh", () => {
    const actions = renderTab(sourceDataset);

    fireEvent.click(screen.getByText('Source refresh'));
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: expect.stringMatching(/setHasUserInitiatedQuery$/),
        payload: true,
      })
    );
  });

  it("leaves other sources' datasets alone", () => {
    renderTab({ id: 'prom', title: 'prom', type: 'PROMETHEUS' });

    expect(screen.queryByTestId('sourceEmptyState')).toBeNull();
    expect(screen.getByTestId('metricBrowser')).toBeInTheDocument();
  });
});
