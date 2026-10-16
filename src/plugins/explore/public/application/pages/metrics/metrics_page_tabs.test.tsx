/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MetricsPageTabs } from './metrics_page_tabs';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../services/source_type_registry';
import { ExploreFlavor } from '../../../../common';

let mockState: { ui: { metricsPageMode?: 'explore' | 'query' }; dataset?: { type: string } };

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock('../../utils/state_management/selectors', () => ({
  selectDataset: (state: typeof mockState) => state.dataset,
}));
jest.mock('./explore', () => ({ MetricsExploreTab: () => <div data-test-subj="exploreTab" /> }));
jest.mock('./metrics_query_panel', () => ({
  MetricsQueryPanel: () => <div data-test-subj="queryPanel" />,
}));
jest.mock('./metrics_bottom_container/bottom_right_container', () => ({
  BottomRightContainer: () => null,
}));
jest.mock('../../../components/query_panel/query_panel_widgets/dataset_select', () => ({
  DatasetSelectWidget: () => null,
}));
jest.mock('./metrics_source_type_select', () => ({ MetricsSourceTypeSelect: () => null }));

describe('MetricsPageTabs', () => {
  beforeEach(() => {
    const registry = new SourceTypeRegistryService();
    registry.register({
      id: 'browsable',
      label: 'Browsable',
      datasetTypes: ['BROWSABLE'],
      flavors: [ExploreFlavor.Metrics],
      resolveDefaultDataset: async () => undefined,
      metricsResourceClientId: 'browsable-metrics',
    });
    registry.register({
      id: 'queryOnly',
      label: 'Query only',
      datasetTypes: ['QUERY_ONLY'],
      flavors: [ExploreFlavor.Metrics],
      resolveDefaultDataset: async () => undefined,
    });
    setSourceTypeRegistry(registry);
  });
  afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  it('offers Explore and Query for Prometheus, opening on Explore', () => {
    mockState = { ui: {}, dataset: { type: 'PROMETHEUS' } };
    render(<MetricsPageTabs />);
    expect(screen.getByTestId('metricsPageTab-explore')).toBeInTheDocument();
    expect(screen.getByTestId('metricsPageTab-query')).toBeInTheDocument();
    expect(screen.getByTestId('exploreTab')).toBeInTheDocument();
  });

  it('offers Explore for a source with a metrics resource client', () => {
    mockState = { ui: { metricsPageMode: 'explore' }, dataset: { type: 'BROWSABLE' } };
    render(<MetricsPageTabs />);
    expect(screen.getByTestId('exploreTab')).toBeInTheDocument();
  });

  it('offers only Query for a source without one, whatever mode was stored', () => {
    mockState = { ui: { metricsPageMode: 'explore' }, dataset: { type: 'QUERY_ONLY' } };
    render(<MetricsPageTabs />);
    expect(screen.queryByTestId('metricsPageTab-explore')).not.toBeInTheDocument();
    expect(screen.getByTestId('metricsPageTab-query')).toBeInTheDocument();
    expect(screen.queryByTestId('exploreTab')).not.toBeInTheDocument();
    expect(screen.getByTestId('queryPanel')).toBeInTheDocument();
  });
});
