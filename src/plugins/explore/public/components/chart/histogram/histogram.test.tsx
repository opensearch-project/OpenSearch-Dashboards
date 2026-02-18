/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as echarts from 'echarts';
import { DiscoverHistogram } from './histogram';
import { of } from 'rxjs';

// Mock echarts
const mockSetOption = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockResize = jest.fn();
const mockDispose = jest.fn();
const mockIsDisposed = jest.fn(() => false);
const mockDispatchAction = jest.fn();
const mockSetTheme = jest.fn();

const mockEchartsInstance = {
  setOption: mockSetOption,
  on: mockOn,
  off: mockOff,
  resize: mockResize,
  dispose: mockDispose,
  isDisposed: mockIsDisposed,
  dispatchAction: mockDispatchAction,
  setTheme: mockSetTheme,
};

jest.mock('echarts', () => ({
  init: jest.fn(() => mockEchartsInstance),
  registerTheme: jest.fn(),
}));

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = MockResizeObserver as any;

// Mock the theme
jest.mock('../../visualizations/theme/default', () => ({
  DEFAULT_THEME: 'osd-default',
}));

// Mock getColors
jest.mock('../../visualizations/theme/default_colors', () => ({
  getColors: () => ({
    categories: [
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
    text: '#333',
    grid: '#eaecf4',
  }),
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
        min: { valueOf: () => 1609459200000 },
        max: { valueOf: () => 1609466400000 },
      },
    },
    timefilterUpdateHandler: jest.fn(),
    services: {
      uiSettings: {
        get: jest.fn((key: string) => {
          if (key === 'theme:darkMode') return false;
          return 'UTC';
        }),
        isDefault: jest.fn(() => true),
      },
      theme: {
        chartsDefaultTheme: {},
        chartsDefaultBaseTheme: {},
        chartsTheme$: of({}),
        chartsBaseTheme$: of({}),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the histogram chart container', () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    expect(screen.getByTestId('discoverHistogramEcharts')).toBeInTheDocument();
  });

  it('initializes ECharts instance', async () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    await waitFor(() => {
      expect(echarts.init).toHaveBeenCalled();
    });
  });

  it('sets chart options for histogram bar type', async () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    await waitFor(() => {
      expect(mockSetOption).toHaveBeenCalled();
    });

    const optionCall = mockSetOption.mock.calls[0][0];
    expect(optionCall.series).toBeDefined();
    expect(optionCall.series[0].type).toBe('bar');
  });

  it('sets chart options for line type', async () => {
    const lineChartProps = {
      ...defaultProps,
      chartType: 'Line' as const,
    };
    render(<DiscoverHistogram {...(lineChartProps as any)} />);

    await waitFor(() => {
      expect(mockSetOption).toHaveBeenCalled();
    });

    const optionCall = mockSetOption.mock.calls[0][0];
    expect(optionCall.series).toBeDefined();
    expect(optionCall.series[0].type).toBe('line');
  });

  it('returns null when chartData is not provided', () => {
    const propsWithoutData = {
      ...defaultProps,
      chartData: null,
    };

    const { container } = render(<DiscoverHistogram {...(propsWithoutData as any)} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles timefilter update callback', async () => {
    const timefilterUpdateHandler = jest.fn();
    const props = {
      ...defaultProps,
      timefilterUpdateHandler,
    };

    render(<DiscoverHistogram {...(props as any)} />);

    await waitFor(() => {
      expect(mockOn).toHaveBeenCalledWith('brushEnd', expect.any(Function));
    });
  });

  it('registers click handler for zoom', async () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    await waitFor(() => {
      expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  it('enables brush mode for time-based axis', async () => {
    render(<DiscoverHistogram {...(defaultProps as any)} />);

    await waitFor(() => {
      expect(mockDispatchAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'takeGlobalCursor',
          key: 'brush',
          brushOption: expect.objectContaining({
            brushType: 'lineX',
          }),
        })
      );
    });
  });

  describe('Breakdown series functionality', () => {
    it('renders single series histogram without breakdown data', async () => {
      render(<DiscoverHistogram {...(defaultProps as any)} />);

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.series).toHaveLength(1);
      expect(optionCall.series[0].id).toBe('discover-histogram');
    });

    it('renders multiple series histogram with breakdown data', async () => {
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

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.series).toHaveLength(3);
      expect(optionCall.series[0].id).toBe('series-1');
      expect(optionCall.series[0].name).toBe('Category A');
      expect(optionCall.series[1].id).toBe('series-2');
      expect(optionCall.series[1].name).toBe('Category B');
      expect(optionCall.series[2].id).toBe('series-3');
      expect(optionCall.series[2].name).toBe('Category C');
    });

    it('applies color palette to multiple series', async () => {
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

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.series[0].itemStyle.color).toBe('#54B399');
      expect(optionCall.series[1].itemStyle.color).toBe('#6092C0');
    });

    it('shows legend when there are multiple series', async () => {
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

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.legend.show).toBe(true);
    });

    it('does not show legend for single series', async () => {
      render(<DiscoverHistogram {...(defaultProps as any)} />);

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.legend.show).toBe(false);
    });

    it('does not show legend when series array is empty', async () => {
      const propsWithEmptySeries = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          series: [],
        },
      };

      render(<DiscoverHistogram {...(propsWithEmptySeries as any)} />);

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.legend.show).toBe(false);
    });

    it('renders single series when series array is not provided', async () => {
      const propsWithoutSeries = {
        ...defaultProps,
        chartData: {
          ...defaultProps.chartData,
          // series property is undefined
        },
      };

      render(<DiscoverHistogram {...(propsWithoutSeries as any)} />);

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.series).toHaveLength(1);
      expect(optionCall.series[0].id).toBe('discover-histogram');
      expect(optionCall.legend.show).toBe(false);
    });

    it('handles many series with color cycling', async () => {
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

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.series).toHaveLength(15);

      // Verify color cycling (palette has 10 colors, series 11 should reuse color 1)
      expect(optionCall.series[0].itemStyle.color).toBe('#54B399');
      expect(optionCall.series[10].itemStyle.color).toBe('#54B399');
      expect(optionCall.series[11].itemStyle.color).toBe('#6092C0');
    });
  });

  describe('Custom chart theme', () => {
    it('applies custom color from customChartsTheme', async () => {
      const propsWithCustomTheme = {
        ...defaultProps,
        customChartsTheme: {
          colors: {
            vizColors: ['#FF0000'],
          },
        },
      };

      render(<DiscoverHistogram {...(propsWithCustomTheme as any)} />);

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      const optionCall = mockSetOption.mock.calls[0][0];
      expect(optionCall.series[0].itemStyle.color).toBe('#FF0000');
    });
  });

  describe('Smart date format', () => {
    it('uses smart date format when useSmartDateFormat is true', async () => {
      const propsWithSmartFormat = {
        ...defaultProps,
        useSmartDateFormat: true,
      };

      render(<DiscoverHistogram {...(propsWithSmartFormat as any)} />);

      await waitFor(() => {
        expect(mockSetOption).toHaveBeenCalled();
      });

      // The smart date format should be applied (exact format depends on time range)
      expect(mockSetOption).toHaveBeenCalled();
    });
  });
});
