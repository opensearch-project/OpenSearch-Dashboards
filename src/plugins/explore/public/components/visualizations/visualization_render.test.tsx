/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { VisualizationRender } from './visualization_render';
import { VisData, ChartConfig } from './visualization_builder.types';
import { VisFieldType, Positions } from './types';
import { ExecutionContextSearch } from '../../../../expressions/common/';

// Mock the dependencies
jest.mock('./table/table_vis', () => ({
  TableVis: jest.fn(() => <div data-test-subj="tableVisualization">Table Visualization</div>),
}));

jest.mock('./visualization_empty_state', () => ({
  VisualizationEmptyState: jest.fn(() => (
    <div data-test-subj="visualizationEmptyState">Empty State</div>
  )),
}));

jest.mock('./utils/to_expression', () => ({
  toExpression: jest.fn(() => 'mocked-expression'),
}));

describe('VisualizationRender', () => {
  // Sample data for testing
  const mockVisData: VisData = {
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
  };

  const mockTableConfig: ChartConfig = {
    type: 'table',
    styles: {
      pageSize: 10,
    },
    axesMapping: {},
  };

  const mockChartConfig: ChartConfig = {
    type: 'bar',
    styles: {
      legendPosition: Positions.RIGHT,
    } as any,
    axesMapping: {
      x: 'field1',
      y: 'count',
    },
  };

  const mockExpressionRenderer = jest.fn(({ expression, searchContext }) => (
    <div data-test-subj="expressionRenderer">Expression Renderer: {expression}</div>
  ));

  const mockSearchContext: ExecutionContextSearch = {
    timeRange: { from: 'now-15m', to: 'now' },
    query: {
      query: 'source=test',
      language: 'PPL',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when no visualization data is provided', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(undefined);
    const visConfig$ = new BehaviorSubject<ChartConfig | undefined>(mockTableConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    const { container } = render(
      <VisualizationRender data$={data$} visConfig$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders table visualization when type is table', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<ChartConfig | undefined>(mockTableConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} visConfig$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('tableVisualization')).toBeInTheDocument();
  });

  it('renders expression renderer when there is a selection mapping and ExpressionRenderer is provided', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<ChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender
        data$={data$}
        visConfig$={visConfig$}
        showRawTable$={showRawTable$}
        searchContext={mockSearchContext}
        ExpressionRenderer={mockExpressionRenderer}
      />
    );

    expect(screen.getByTestId('expressionRenderer')).toBeInTheDocument();
  });

  it('returns null when there is a selection mapping but no ExpressionRenderer', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<ChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    const { container } = render(
      <VisualizationRender
        data$={data$}
        visConfig$={visConfig$}
        showRawTable$={showRawTable$}
        searchContext={mockSearchContext}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders empty state when there is no selection mapping', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<ChartConfig | undefined>({
      ...mockChartConfig,
      axesMapping: undefined,
    });
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} visConfig$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('visualizationEmptyState')).toBeInTheDocument();
  });
});
