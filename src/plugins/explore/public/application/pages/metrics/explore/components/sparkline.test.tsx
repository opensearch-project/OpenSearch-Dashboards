/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SparklineChart, SERIES_COLORS } from './sparkline';

// --- echarts mock ---
const mockSetOption = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockResize = jest.fn();
const mockDispose = jest.fn();
const mockIsDisposed = jest.fn(() => false);
const mockDispatchAction = jest.fn();
const mockGetHeight = jest.fn(() => 200);
const mockGetZr = jest.fn(() => ({ on: jest.fn(), off: jest.fn() }));

const mockEchartsInstance = {
  setOption: mockSetOption,
  on: mockOn,
  off: mockOff,
  resize: mockResize,
  dispose: mockDispose,
  isDisposed: mockIsDisposed,
  dispatchAction: mockDispatchAction,
  getHeight: mockGetHeight,
  getZr: mockGetZr,
};

jest.mock('echarts', () => ({
  init: jest.fn(() => mockEchartsInstance),
}));

// --- shared cursor mock ---
const mockPublishCursor = jest.fn();
let mockSharedCursor: { idx: number; yRatio: number } | null = null;

jest.mock('../hooks/cursor_context', () => ({
  useSharedCursor: () => [mockSharedCursor, mockPublishCursor],
}));

// --- ResizeObserver mock ---
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as any;

// --- helpers ---
const singleValues: Array<[number, string]> = [
  [1000, '10'],
  [2000, '20'],
  [3000, '30'],
];

const multiSeries = [
  {
    name: 'cpu',
    values: [
      [1000, '10'],
      [2000, '20'],
    ] as Array<[number, string]>,
  },
  {
    name: 'mem',
    values: [
      [1000, '30'],
      [2000, '40'],
    ] as Array<[number, string]>,
  },
];

describe('SparklineChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSharedCursor = null;
  });

  // --- formatValue (tested indirectly via yAxis formatter) ---
  describe('formatValue via yAxis formatter', () => {
    it.each([
      [2e9, '2.0 G'],
      [5e6, '5.0 M'],
      [15000, '15.0 k'],
      [500, '500'],
      [3.5, '3.5'],
      [0.05, '0.050'],
      [0, '0'],
      [0.001, '0.00100'],
    ])('formats %s as %s', (input, expected) => {
      render(<SparklineChart values={singleValues} height={100} />);
      const opts = mockSetOption.mock.calls[0][0];
      expect(opts.yAxis.axisLabel.formatter(input)).toBe(expected);
    });
  });

  // --- no data state ---
  it('renders no-data message when values is undefined', () => {
    render(<SparklineChart height={100} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders no-data message when only one data point', () => {
    render(<SparklineChart values={[[1000, '10']]} height={100} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  // --- single series rendering ---
  it('initializes echarts and sets option for single series', () => {
    const echarts = jest.requireMock('echarts');
    render(<SparklineChart values={singleValues} height={150} />);

    expect(echarts.init).toHaveBeenCalled();
    expect(mockSetOption).toHaveBeenCalledTimes(1);
    const opts = mockSetOption.mock.calls[0][0];
    expect(opts.series).toHaveLength(1);
    expect(opts.series[0].name).toBe('value');
    expect(opts.series[0].data).toEqual([
      [1000000, 10],
      [2000000, 20],
      [3000000, 30],
    ]);
  });

  // --- multi-series rendering ---
  it('renders multiple series with SERIES_COLORS palette', () => {
    render(<SparklineChart series={multiSeries} height={100} />);

    const opts = mockSetOption.mock.calls[0][0];
    expect(opts.series).toHaveLength(2);
    expect(opts.series[0].color).toBe(SERIES_COLORS[0]);
    expect(opts.series[1].color).toBe(SERIES_COLORS[1]);
  });

  // --- brush / onTimeRangeChange ---
  it('configures brush when onTimeRangeChange is provided', () => {
    const onTimeRangeChange = jest.fn();
    render(
      <SparklineChart values={singleValues} height={100} onTimeRangeChange={onTimeRangeChange} />
    );

    const opts = mockSetOption.mock.calls[0][0];
    expect(opts.brush).toBeDefined();
    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'takeGlobalCursor', key: 'brush' })
    );
  });

  it('calls onTimeRangeChange on brushEnd event', () => {
    const onTimeRangeChange = jest.fn();
    render(
      <SparklineChart values={singleValues} height={100} onTimeRangeChange={onTimeRangeChange} />
    );

    const brushEndHandler = mockOn.mock.calls.find(([evt]: any) => evt === 'brushEnd')?.[1];
    expect(brushEndHandler).toBeDefined();

    brushEndHandler({ areas: [{ coordRange: [1609459200000, 1609462800000] }] });
    expect(onTimeRangeChange).toHaveBeenCalledWith(
      new Date(1609459200000).toISOString(),
      new Date(1609462800000).toISOString()
    );
  });

  // --- shared cursor ---
  it('dispatches showTip when sharedCursor is set', () => {
    mockSharedCursor = { idx: 1, yRatio: 0.5 };
    render(<SparklineChart values={singleValues} height={100} />);

    expect(mockDispatchAction).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'showTip', dataIndex: 1 })
    );
  });

  it('dispatches hideTip when sharedCursor is null', () => {
    mockSharedCursor = null;
    render(<SparklineChart values={singleValues} height={100} />);

    expect(mockDispatchAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'hideTip' }));
  });

  // --- cleanup ---
  it('disposes echarts instance on unmount', () => {
    const { unmount } = render(<SparklineChart values={singleValues} height={100} />);
    unmount();
    expect(mockDispose).toHaveBeenCalled();
  });
});
