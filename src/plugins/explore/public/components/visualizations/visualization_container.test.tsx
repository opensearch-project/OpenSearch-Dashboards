/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { VisualizationContainer } from './visualization_container';
import * as VB from './visualization_builder';
import * as TabResultsHooks from '../../application/utils/hooks/use_tab_results';
import * as Utils from './visualization_container_utils';
import { BehaviorSubject } from 'rxjs';
import { ChartType } from './utils/use_visualization_types';
import { VisFieldType } from './types';

// Mock the StylePanel component to avoid rendering issues
jest.mock('./style_panel/style_panel', () => ({
  StylePanel: () => <div data-test-subj="mockStylePanel">Style Panel</div>,
}));

// Mock the TableVis component
jest.mock('./table/table_vis', () => ({
  TableVis: () => <div data-test-subj="mockTableVis">Table Visualization</div>,
}));

// Mock the hooks and services
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      expressions: {
        ReactExpressionRenderer: jest.fn(({ expression }) => (
          <div data-test-subj="mockExpressionRenderer">{expression}</div>
        )),
      },
    },
  })),
}));

jest.mock('../../application/context/dataset_context/dataset_context', () => ({
  useDatasetContext: jest.fn(() => ({
    dataset: { id: 'test-dataset', title: 'Test Dataset' },
  })),
}));

jest.mock('../../application/utils/hooks/use_tab_results', () => ({
  useTabResults: jest.fn(() => ({
    results: {
      hits: {
        hits: [{ _source: { field1: 'value1' } }, { _source: { field1: 'value2' } }],
      },
      fieldSchema: [
        { name: 'field1', type: 'string' },
        { name: 'count', type: 'number' },
      ],
    },
  })),
}));

jest.mock('../query_panel/utils/use_search_context', () => ({
  useSearchContext: jest.fn(() => ({
    timeRange: { from: 'now-15m', to: 'now' },
    query: 'source=test',
  })),
}));

// Mock the visualization builder
const mockVisualizationBuilder = {
  data$: new BehaviorSubject<VB.VisData | undefined>({
    transformedData: [
      { field1: 'value1', count: 10 },
      { field1: 'value2', count: 20 },
    ],
    numericalColumns: [
      {
        id: 1,
        name: 'count',
        schema: VisFieldType.Numerical,
        column: 'count',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'field1',
        schema: VisFieldType.Categorical,
        column: 'field1',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    ],
    dateColumns: [],
  }),
  axesMapping$: new BehaviorSubject({}),
  styles$: new BehaviorSubject({
    type: 'bar',
    styles: {
      legendPosition: 'right',
      thresholds: [],
      pageSize: 10,
    },
  }),
  currentChartType$: new BehaviorSubject<ChartType | undefined>(undefined),
  handleData: jest.fn(),
  init: jest.fn(),
  reset: jest.fn(),
};

describe('VisualizationContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(mockVisualizationBuilder as any);
  });

  it('renders the visualization container', () => {
    render(<VisualizationContainer />);

    expect(screen.getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
    expect(mockVisualizationBuilder.init).toHaveBeenCalled();
    expect(mockVisualizationBuilder.handleData).toHaveBeenCalled();
  });

  it('renders empty prompt when no chart type or axes are selected', () => {
    render(<VisualizationContainer />);

    expect(
      screen.getByText('Select a visualization type and fields to get started')
    ).toBeInTheDocument();
  });

  it('renders table visualization when chart type is table', () => {
    mockVisualizationBuilder.currentChartType$.next('table');

    render(<VisualizationContainer />);

    // The TableVis component should be rendered
    expect(screen.getByTestId('mockTableVis')).toBeInTheDocument();
    expect(
      screen.queryByText('Select a visualization type and fields to get started')
    ).not.toBeInTheDocument();
  });

  it('renders expression visualization when expression is available and axes are mapped', () => {
    // Mock the visualization_container_utils functions
    jest.spyOn(Utils, 'findRuleByIndex').mockReturnValue({
      id: 'test-rule',
      name: 'Test Rule',
      matches: jest.fn(),
      matchIndex: [1, 1, 0],
      chartTypes: [{ type: 'bar', name: 'Bar Chart', priority: 1, icon: 'barChart' }],
      toSpec: jest.fn(() => 'test-expression'),
    });

    jest.spyOn(Utils, 'convertStringsToMappings').mockReturnValue({
      x: {
        id: 2,
        name: 'field1',
        schema: VisFieldType.Categorical,
        column: 'field1',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
      y: {
        id: 1,
        name: 'count',
        schema: VisFieldType.Numerical,
        column: 'count',
        validValuesCount: 2,
        uniqueValuesCount: 2,
      },
    });

    mockVisualizationBuilder.currentChartType$.next('bar');
    mockVisualizationBuilder.axesMapping$.next({ x: 'field1', y: 'count' });

    render(<VisualizationContainer />);

    // The expression renderer should be used
    expect(screen.getByTestId('mockExpressionRenderer')).toBeInTheDocument();
    expect(
      screen.queryByText('Select a chart type, and x and y axes fields to get started')
    ).not.toBeInTheDocument();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<VisualizationContainer />);

    unmount();

    expect(mockVisualizationBuilder.reset).toHaveBeenCalled();
  });

  it('handles empty results', () => {
    // Override the mock for this test
    jest.spyOn(TabResultsHooks, 'useTabResults').mockReturnValueOnce({
      results: null,
    });

    render(<VisualizationContainer />);

    // Should still render without crashing
    expect(screen.getByTestId('exploreVisualizationLoader')).toBeInTheDocument();
  });

  it('handles empty visualization data', () => {
    // Override the mock for this test
    // Use undefined to simulate no visualization data
    mockVisualizationBuilder.data$.next(undefined);

    render(<VisualizationContainer />);

    // Should not render anything when visualization data is undefined
    expect(screen.queryByTestId('exploreVisualizationLoader')).not.toBeInTheDocument();
  });
});
