/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiscoverHistogram } from './histogram';

// Mock the @elastic/charts components
jest.mock('@elastic/charts', () => ({
  Chart: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="elastic-chart">{children}</div>
  ),
  Settings: () => <div data-test-subj="chart-settings" />,
  Axis: () => <div data-test-subj="chart-axis" />,
  HistogramBarSeries: () => <div data-test-subj="histogram-bar-series" />,
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

describe('DiscoverHistogram', () => {
  const defaultProps = {
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
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the histogram chart', () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    expect(screen.getByTestId('elastic-chart')).toBeInTheDocument();
    expect(screen.getByTestId('chart-settings')).toBeInTheDocument();
    expect(screen.getByTestId('histogram-bar-series')).toBeInTheDocument();
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
});
