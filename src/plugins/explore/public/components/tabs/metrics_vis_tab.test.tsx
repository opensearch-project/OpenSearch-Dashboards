/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';

const mockHandleData = jest.fn();
const mockVisualizationBuilder = {
  handleData: mockHandleData,
  data$: { subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })), pipe: jest.fn() },
  visConfig$: { subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })), pipe: jest.fn() },
  setCurrentChartType: jest.fn(),
  renderStylePanel: jest.fn(() => null),
};

jest.mock('../visualizations/visualization_builder', () => ({
  getVisualizationBuilder: () => mockVisualizationBuilder,
}));

const mockResults: {
  hits: { hits: Array<{ _source: Record<string, unknown> }> };
  fieldSchema: Array<{ name: string; type: string }>;
} = {
  hits: {
    hits: Array.from({ length: 25 }, (_, i) => ({
      _source: { Series: `series-${i}`, Time: 1000 + i, Value: i },
    })),
  },
  fieldSchema: [
    { name: 'Time', type: 'time' },
    { name: 'Series', type: 'string' },
    { name: 'Value', type: 'number' },
  ],
};

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: () => ({ results: mockResults }),
}));

jest.mock('react-use', () => ({
  useObservable: (obs: unknown) => {
    if (obs === mockVisualizationBuilder.data$) return [{}];
    if (obs === mockVisualizationBuilder.visConfig$) return { type: 'line' };
    return undefined;
  },
}));

const mockQuery = {};
jest.mock('react-redux', () => ({
  useSelector: () => mockQuery,
}));

jest.mock('../../application/utils/state_management/actions/query_actions', () => ({
  shouldSkipQueryExecution: () => false,
}));

jest.mock('../visualizations/visualization_container', () => ({
  VisualizationContainer: () => <div data-testid="vis-container" />,
}));

jest.mock('../data_table/explore_metrics_raw_table', () => ({
  ExploreMetricsRawTable: () => <div data-testid="raw-table" />,
}));

jest.mock('./action_bar/action_bar', () => ({
  ActionBar: () => null,
}));

jest.mock('./tabs', () => ({
  EXPLORE_ACTION_BAR_SLOT_ID: 'action-bar-slot',
}));

jest.mock('../../components/data_transformations', () => ({
  TransformPanel: () => null,
  useTransformationService: () => ({}),
}));

import { MetricsVisTab } from './metrics_vis_tab';

describe('MetricsVisTab handleData with showAllSeries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls handleData with limited rows on initial render', () => {
    render(<MetricsVisTab />);

    expect(mockHandleData).toHaveBeenCalled();
    // Should be limited to 20 series (DEFAULT_SERIES_LIMIT)
    const rows = mockHandleData.mock.calls[mockHandleData.mock.calls.length - 1][0];
    const series = new Set(rows.map((r: { _source: { Series: string } }) => r._source.Series));
    expect(series.size).toBe(20);
  });

  it('calls handleData with all rows when showAllSeries is clicked', () => {
    const { getByTestId } = render(<MetricsVisTab />);

    mockHandleData.mockClear();
    act(() => {
      fireEvent.click(getByTestId('showAllSeriesButton'));
    });

    expect(mockHandleData).toHaveBeenCalled();
    const rows = mockHandleData.mock.calls[mockHandleData.mock.calls.length - 1][0];
    expect(rows).toHaveLength(25);
  });
});
