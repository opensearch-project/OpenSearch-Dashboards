/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import dateMath from '@elastic/datemath';
import { VisualizationRender, CommonVisualizationRender } from './visualization_render';
import { VisData } from './visualization_builder.types';
import { VisFieldType, Positions, RenderChartConfig } from './types';
import { defaultBarChartStyles } from './bar/bar_vis_config';
import { defaultTableChartStyles } from './table/table_vis_config';
import { defaultMetricChartStyles } from './metric/metric_vis_config';

const mockRender = jest.fn(() => <div data-test-subj="echartsRender">Echarts Render</div>);
const mockFindRuleByAxesMapping = jest.fn();

jest.mock('./visualization_registry', () => ({
  visualizationRegistry: {
    findRuleByAxesMapping: (...args: any[]) => mockFindRuleByAxesMapping(...args),
  },
}));

jest.mock('./table/table_vis', () => ({
  TableVis: jest.fn(() => <div data-test-subj="tableVisualization">Table Visualization</div>),
}));

jest.mock('./visualization_empty_state', () => ({
  VisualizationEmptyState: jest.fn(() => (
    <div data-test-subj="visualizationEmptyState">Empty State</div>
  )),
}));

jest.mock('./custom_legend', () => ({
  CustomLegend: jest.fn(() => <div data-test-subj="customLegend">Custom Legend</div>),
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
    mockRender.mockReturnValue(<div data-test-subj="echartsRender">Echarts Render</div>);
    mockFindRuleByAxesMapping.mockReturnValue({ render: mockRender });
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
      unknownColumns: [],
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
    mockRender.mockReturnValue(<div data-test-subj="metricChartRender">Metric Chart Render</div>);

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

  it('returns null when no matching rule is found', () => {
    mockFindRuleByAxesMapping.mockReturnValue(null);

    const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
    const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(mockChartConfig);
    const showRawTable$ = new BehaviorSubject<boolean>(false);

    render(
      <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
    );

    expect(screen.queryByTestId('echartsRender')).not.toBeInTheDocument();
  });

  describe('custom legend visibility', () => {
    it.each(['area', 'line', 'bar', 'pie', 'scatter', 'state_timeline'])(
      'renders custom legend for %s chart type when addLegend is true',
      (chartType) => {
        const config: RenderChartConfig = {
          type: chartType,
          styles: {
            ...defaultBarChartStyles,
            addLegend: true,
            legendPosition: Positions.BOTTOM,
          },
          axesMapping: { x: 'field1', y: 'count' },
        };

        const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
        const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(config);
        const showRawTable$ = new BehaviorSubject<boolean>(false);

        render(
          <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
        );

        expect(screen.getByTestId('customLegend')).toBeInTheDocument();
      }
    );

    it('does not render custom legend when addLegend is false', () => {
      const config: RenderChartConfig = {
        type: 'bar',
        styles: {
          ...defaultBarChartStyles,
          addLegend: false,
          legendPosition: Positions.BOTTOM,
        },
        axesMapping: { x: 'field1', y: 'count' },
      };

      const data$ = new BehaviorSubject<VisData | undefined>(mockVisData);
      const visConfig$ = new BehaviorSubject<RenderChartConfig | undefined>(config);
      const showRawTable$ = new BehaviorSubject<boolean>(false);

      render(
        <VisualizationRender data$={data$} config$={visConfig$} showRawTable$={showRawTable$} />
      );

      expect(screen.queryByTestId('customLegend')).not.toBeInTheDocument();
    });

    it('clears legend$ when chart type does not support custom legend', () => {
      const barConfig: RenderChartConfig = {
        type: 'bar',
        styles: { ...defaultBarChartStyles, addLegend: true, legendPosition: Positions.BOTTOM },
        axesMapping: { x: 'field1', y: 'count' },
      };

      const metricConfig: RenderChartConfig = {
        type: 'metric',
        styles: {
          ...defaultMetricChartStyles,
          addLegend: true,
          legendPosition: Positions.BOTTOM,
        },
        axesMapping: { value: 'count' },
      };

      const { rerender } = render(
        <CommonVisualizationRender
          visualizationData={mockVisData}
          visConfig={barConfig}
          showRawTable={false}
        />
      );

      // Legend renders for bar chart
      expect(screen.getByTestId('customLegend')).toBeInTheDocument();

      // Switch to metric — legend still renders (addLegend is true) but legend$ data is cleared
      rerender(
        <CommonVisualizationRender
          visualizationData={mockVisData}
          visConfig={metricConfig}
          showRawTable={false}
        />
      );

      expect(screen.getByTestId('customLegend')).toBeInTheDocument();
    });
  });
});
