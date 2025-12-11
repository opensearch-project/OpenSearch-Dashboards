/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { MetricsTab } from './metrics_tab';

// Mock the ExploreMetricsDataTable component
jest.mock('../data_table/explore_metrics_data_table', () => ({
  ExploreMetricsDataTable: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="mocked-explore-metrics-data-table" {...props} />
  ),
}));

describe('MetricsTab', () => {
  it('should render the metrics tab container with correct className', () => {
    const { container } = render(<MetricsTab />);

    const tabContainer = container.querySelector('.explore-metrics-tab.tab-container');
    expect(tabContainer).toBeInTheDocument();
  });

  it('should render ExploreMetricsDataTable component', () => {
    const { container } = render(<MetricsTab />);

    const dataTable = container.querySelector('[data-testid="mocked-explore-metrics-data-table"]');
    expect(dataTable).toBeInTheDocument();
  });
});
