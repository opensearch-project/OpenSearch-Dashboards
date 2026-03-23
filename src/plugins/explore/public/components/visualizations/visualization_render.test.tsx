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
import { defaultBarChartStyles } from './bar/bar_vis_config';
import { defaultTableChartStyles } from './table/table_vis_config';
import { defaultMetricChartStyles } from './metric/metric_vis_config';
import { createVisSpec } from './utils/create_vis_spec';

jest.mock('./table/table_vis', () => ({
  TableVis: jest.fn(() => <div data-test-subj="tableVisualization">Table Visualization</div>),
}));

jest.mock('./visualization_empty_state', () => ({
  VisualizationEmptyState: jest.fn(() => (
    <div data-test-subj="visualizationEmptyState">Empty State</div>
  )),
}));

jest.mock('./utils/create_vis_spec', () => ({
  createVisSpec: jest.fn(),
}));

jest.mock('./echarts_render', () => ({
  EchartsRender: jest.fn(() => <div data-test-subj="echartsRender">Echarts Render</div>),
}));

jest.mock('./metric/metric_component', () => ({
  MetricChartRender: jest.fn(() => (
    <div data-test-subj="metricChartRender">Metric Chart Render</div>
  )),
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    (createVisSpec as jest.Mock).mockReturnValue({ spec: { type: 'bar' }, axisColumnMappings: {} });
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

  it('renders table visualization when config type is table', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockTableConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('tableVisualization')).toBeInTheDocument();
  });

  it('renders EchartsRender when there is a selection mapping', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('echartsRender')).toBeInTheDocument();
  });

  it('renders empty state when there is no selection mapping', () => {
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

  it('parses timeRange from and to with correct roundUp options', () => {
    const parseSpy = jest.spyOn(dateMath, 'parse');

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender
        data$={data$}
        config$={visConfig$}
        showRawTable$={showRawTable$}
        timeRange={{ from: 'now-15m', to: 'now' }}
      />
    );

    expect(parseSpy).toHaveBeenCalledWith('now-15m');
    expect(parseSpy).toHaveBeenCalledWith('now', { roundUp: true });
  });

  it('renders raw table when showRawTable is true', () => {
    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(true);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('tableVisualization')).toBeInTheDocument();
  });

  it('returns null when data has no columns', () => {
    const emptyColumnsData: VisData = {
      transformedData: [{ field1: 'value1' }],
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
    };

    const data$ = new BehaviorSubject<VisData | undefined>(emptyColumnsData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    const { container } = render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders MetricChartRender when config type is metric', () => {
    (createVisSpec as jest.Mock).mockReturnValue({
      spec: { type: 'metric' },
      axisColumnMappings: {},
    });

    const metricConfig: RenderChartConfig = {
      type: 'metric',
      styles: { ...defaultMetricChartStyles },
      axesMapping: { value: 'count' },
    };

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(metricConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.getByTestId('metricChartRender')).toBeInTheDocument();
  });

  it('returns null when createVisSpec returns no spec', () => {
    (createVisSpec as jest.Mock).mockReturnValue({ spec: undefined, axisColumnMappings: {} });

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    const { container } = render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(container.firstChild).toBeNull();
  });
});
