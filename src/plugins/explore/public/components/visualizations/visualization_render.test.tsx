/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import dateMath from '@elastic/datemath';
import { VisualizationRender } from './visualization_render';
import { VisData } from './visualization_builder.types';
import { VisFieldType, Positions, RenderChartConfig } from './types';
import { ExecutionContextSearch } from '../../../../expressions/common/';
import { defaultBarChartStyles } from './bar/bar_vis_config';
import { defaultTableChartStyles } from './table/table_vis_config';
import { createVisSpec } from './utils/create_vis_spec';

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

jest.mock('./utils/create_vis_spec', () => ({
  createVisSpec: jest.fn(),
}));

jest.mock('./echarts_render', () => ({
  EchartsRender: jest.fn(() => <div data-test-subj="echartsRender">Echarts Render</div>),
}));

jest.mock('./vega_render', () => ({
  VegaRender: jest.fn(() => <div data-test-subj="vegaRender">Vega Render</div>),
}));

// Mock getServices
jest.mock('../../services/services', () => ({
  getServices: jest.fn(() => ({
    data: {
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => ({
              from: 'now-15m',
              to: 'now',
            })),
          },
        },
      },
    },
  })),
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

  const mockTableConfig: RenderChartConfig = {
    type: 'table',
    styles: {
      ...defaultTableChartStyles,
      pageSize: 10,
    },
    axesMapping: {},
  };

  const mockChartConfig: RenderChartConfig = {
    type: 'bar',
    styles: {
      ...defaultBarChartStyles,
      legendPosition: Positions.RIGHT,
    },
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
    // Default mock implementation returns a spec object
    (createVisSpec as jest.Mock).mockReturnValue({ type: 'bar' });
  });

  it('returns null when no visualization data is provided', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(undefined);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockTableConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    const { container } = render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders table visualization when type is table', () => {
    // Mock createVisSpec to return a spec for table visualization
    (createVisSpec as jest.Mock).mockReturnValue({ type: 'table' });

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockTableConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('tableVisualization')).toBeInTheDocument();
  });

  it('renders expression renderer when there is a selection mapping and ExpressionRenderer is provided', () => {
    // Mock createVisSpec to return a spec with $schema (Vega spec)
    (createVisSpec as jest.Mock).mockReturnValue({
      $schema: 'https://vega.github.io/schema/vega/v5.json',
    });

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender
        data$={data$}
        config$={visConfig$}
        showRawTable$={showRawTable$}
        searchContext={mockSearchContext}
        ExpressionRenderer={mockExpressionRenderer}
      />
    );

    expect(screen.getByTestId('echartsRender')).toBeInTheDocument();
  });

  it('renders echarts when there is a selection mapping but spec has no $schema', () => {
    // Mock createVisSpec to return a spec without $schema (Echarts spec)
    (createVisSpec as jest.Mock).mockReturnValue({ type: 'bar' });

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender
        data$={data$}
        config$={visConfig$}
        showRawTable$={showRawTable$}
        searchContext={mockSearchContext}
      />
    );

    expect(screen.getByTestId('echartsRender')).toBeInTheDocument();
  });

  it('renders empty state when there is no selection mapping', () => {
    // Mock createVisSpec to return a spec even though there's no axes mapping
    (createVisSpec as jest.Mock).mockReturnValue({ type: 'bar' });

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>({
      ...mockChartConfig,
      axesMapping: undefined,
    });
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('visualizationEmptyState')).toBeInTheDocument();
  });

  it('parses timeRange `from` and `to` with correct roundUp options', () => {
    const parseSpy = jest.spyOn(dateMath, 'parse');

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender
        data$={data$}
        config$={visConfig$}
        showRawTable$={showRawTable$}
        searchContext={mockSearchContext}
        ExpressionRenderer={mockExpressionRenderer}
      />
    );

    expect(parseSpy).toHaveBeenCalledWith('now-15m');
    expect(parseSpy).toHaveBeenCalledWith('now', { roundUp: true });
  });
});
