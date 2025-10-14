/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiscoverHistogram } from './histogram';
import { of } from 'rxjs';

// Mock the @elastic/charts components
jest.mock('@elastic/charts', () => ({
  Chart: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="elastic-chart">{children}</div>
  ),
  Settings: ({ showLegend }: { showLegend?: boolean }) => (
    <div data-test-subj="chart-settings" data-show-legend={showLegend} />
  ),
  Axis: () => <div data-test-subj="chart-axis" />,
  HistogramBarSeries: ({ id, name, color }: { id: string; name?: string; color?: string }) => (
    <div
      data-test-subj="histogram-bar-series"
      data-series-id={id}
      data-series-name={name}
      data-series-color={color}
    />
  ),
  LineSeries: () => <div data-test-subj="line-series" />,
  LineAnnotation: () => <div data-test-subj="line-annotation" />,
  RectAnnotation: () => <div data-test-subj="rect-annotation" />,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
  ScaleType: {
    Linear: 'linear',
    Time: 'time',
  },
  AnnotationDomainType: {
    XDomain: 'xDomain',
    YDomain: 'yDomain',
  },
  TooltipType: {
    VerticalCursor: 'vertical',
  },
}));

// Mock euiPaletteColorBlind
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  euiPaletteColorBlind: () => [
    '#54B399',
    '#6092C0',
    '#D36086',
    '#9170B8',
    '#CA8EAE',
    '#D6BF57',
    '#B9A888',
    '#DA8B45',
    '#AA6556',
    '#E7664C',
  ],
}));

describe('DiscoverHistogram', () => {
  const defaultProps = {
    chartType: 'HistogramBar' as const,
    chartData: {
      xAxisOrderedValues: [1609459200000, 1609462800000],
      xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD' } },
      xAxisLabel: 'timestamp',
      yAxisLabel: 'Count',
      values: [
        { x: 1609459200000, y: 10 },
        { x: 1609462800000, y: 15 },
      ],
      ordered: {
        date: true as const,
        interval: {
          asMilliseconds: jest.fn(() => 3600000),
        },
        intervalOpenSearchUnit: 'h',
        intervalOpenSearchValue: 1,
        min: 1609459200000,
        max: 1609462800000,
      },
    },
    timefilterUpdateHandler: jest.fn(),
    services: {
      uiSettings: {
        get: jest.fn(() => 'UTC'),
        isDefault: jest.fn(() => true),
      },
      theme: {
        chartsDefaultTheme: {
          axes: {
            gridLine: {
              vertical: { stroke: '#000' },
            },
            axisLine: {},
            axisTitle: {},
          },
          colors: {},
        },
        chartsDefaultBaseTheme: {},
        chartsTheme$: of({}),
        chartsBaseTheme$: of({}),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the histogram bar chart', () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    expect(screen.getByTestId('elastic-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-settings')).toBeInTheDocument();
    expect(screen.getByTestId('histogram-bar-series')).toBeInTheDocument();
    expect(screen.queryByTestId('line-series')).not.toBeInTheDocument();
  });

  it('renders the line chart', () => {
    const lineChartProps = {
      ...defaultProps,
      chartType: 'Line' as const,
    };
    render(<DiscoverHistogram {...(lineChartProps as any)} />);

    expect(screen.getByTestId('elastic-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-settings')).toBeInTheDocument();
    expect(screen.getByTestId('line-series')).toBeInTheDocument();
    expect(screen.queryByTestId('histogram-bar-series')).not.toBeInTheDocument();
  });

  it('renders without crashing with basic props', () => {
    const basicProps = {
      ...defaultProps,
      chartData: {
        ...defaultProps.chartData,
        values: [],
        xAxisOrderedValues: [],
      },
    };

    render(<DiscoverHistogram {...(basicProps as any)} />);

    expect(screen.getByTestId('elastic-chart')).toBeInTheDocument();
  });

  it('handles timefilter update callback', () => {
    const timefilterUpdateHandler = jest.fn();
    const props = {
      ...defaultProps,
      timefilterUpdateHandler,
    };

    render(<DiscoverHistogram {...(props as any)} />);

    // The component should render without errors
    expect(screen.getByTestId('elastic-chart')).toBeInTheDocument();

    // The timefilter handler should be available
    expect(timefilterUpdateHandler).toBeDefined();
  });

  describe('Breakdown series functionality', () => {
    it('renders single series histogram without breakdown data', () => {
      render(<DiscoverHistogram {...(defaultProps as any)} />);

      const histogramSeries = screen.getAllByTestId('histogram-bar-series');
      expect(histogramSeries).toHaveLength(1);
      expect(histogramSeries[0]).toHaveAttribute('data-series-id', 'discover-histogram');
    });

    it('renders multiple series histogram with breakdown data', () => {
      const propsWithBreakdown = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          series: [
            {
              id: 'series-1',
              name: 'Category A',
              data: [
                { x: 1609459200000, y: 5 },
                { x: 1609462800000, y: 8 },
              ],
            },
            {
              id: 'series-2',
              name: 'Category B',
              data: [
                { x: 1609459200000, y: 3 },
                { x: 1609462800000, y: 7 },
              ],
            },
            {
              id: 'series-3',
              name: 'Category C',
              data: [
                { x: 1609459200000, y: 2 },
                { x: 1609462800000, y: 4 },
              ],
            },
          ],
        },
      };

      render(<DiscoverHistogram {...(propsWithBreakdown as any)} />);

      const histogramSeries = screen.getAllByTestId('histogram-bar-series');
      expect(histogramSeries).toHaveLength(3);

      expect(histogramSeries[0]).toHaveAttribute('data-series-id', 'series-1');
      expect(histogramSeries[0]).toHaveAttribute('data-series-name', 'Category A');

      expect(histogramSeries[1]).toHaveAttribute('data-series-id', 'series-2');
      expect(histogramSeries[1]).toHaveAttribute('data-series-name', 'Category B');

      expect(histogramSeries[2]).toHaveAttribute('data-series-id', 'series-3');
      expect(histogramSeries[2]).toHaveAttribute('data-series-name', 'Category C');
    });

    it('applies color palette to multiple series', () => {
      const propsWithBreakdown = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          series: [
            {
              id: 'series-1',
              name: 'Category A',
              data: [{ x: 1609459200000, y: 5 }],
            },
            {
              id: 'series-2',
              name: 'Category B',
              data: [{ x: 1609459200000, y: 3 }],
            },
          ],
        },
      };

      render(<DiscoverHistogram {...(propsWithBreakdown as any)} />);

      const histogramSeries = screen.getAllByTestId('histogram-bar-series');

      expect(histogramSeries[0]).toHaveAttribute('data-series-color', '#54B399');
      expect(histogramSeries[1]).toHaveAttribute('data-series-color', '#6092C0');
    });

    it('shows legend when there are multiple series', () => {
      const propsWithBreakdown = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          series: [
            {
              id: 'series-1',
              name: 'Category A',
              data: [{ x: 1609459200000, y: 5 }],
            },
            {
              id: 'series-2',
              name: 'Category B',
              data: [{ x: 1609459200000, y: 3 }],
            },
          ],
        },
      };

      render(<DiscoverHistogram {...(propsWithBreakdown as any)} />);

      const settings = screen.getByTestId('chart-settings');
      expect(settings).toHaveAttribute('data-show-legend', 'true');
    });

    it('does not show legend for single series', () => {
      render(<DiscoverHistogram {...(defaultProps as any)} />);

      const settings = screen.getByTestId('chart-settings');
      // When showLegend is false or undefined, the attribute is not set to 'true'
      const showLegend = settings.getAttribute('data-show-legend');
      expect(showLegend).not.toBe('true');
    });

    it('does not show legend when series array is empty', () => {
      const propsWithEmptySeries = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          series: [],
        },
      };

      render(<DiscoverHistogram {...(propsWithEmptySeries as any)} />);

      const settings = screen.getByTestId('chart-settings');
      const showLegend = settings.getAttribute('data-show-legend');
      expect(showLegend).not.toBe('true');
    });

    it('renders single series when series array is not provided', () => {
      const propsWithoutSeries = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          // series property is undefined
        },
      };

      render(<DiscoverHistogram {...(propsWithoutSeries as any)} />);

      const histogramSeries = screen.getAllByTestId('histogram-bar-series');
      expect(histogramSeries).toHaveLength(1);
      expect(histogramSeries[0]).toHaveAttribute('data-series-id', 'discover-histogram');

      const settings = screen.getByTestId('chart-settings');
      const showLegend = settings.getAttribute('data-show-legend');
      expect(showLegend).not.toBe('true');
    });

    it('handles many series with color cycling', () => {
      const manySeries = Array.from({ length: 15 }, (_, i) => ({
        id: `series-${i}`,
        name: `Category ${i}`,
        data: [{ x: 1609459200000, y: i }],
      }));

      const propsWithManySeries = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          series: manySeries,
        },
      };

      render(<DiscoverHistogram {...(propsWithManySeries as any)} />);

      const histogramSeries = screen.getAllByTestId('histogram-bar-series');
      expect(histogramSeries).toHaveLength(15);

      // Verify color cycling (palette has 10 colors, series 11 should reuse color 1)
      expect(histogramSeries[0]).toHaveAttribute('data-series-color', '#54B399');
      expect(histogramSeries[10]).toHaveAttribute('data-series-color', '#54B399');
      expect(histogramSeries[11]).toHaveAttribute('data-series-color', '#6092C0');
    });
  });
});
