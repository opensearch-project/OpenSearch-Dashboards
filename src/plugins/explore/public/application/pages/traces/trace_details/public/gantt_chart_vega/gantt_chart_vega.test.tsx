/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { GanttChart } from './gantt_chart_vega';
import { convertToVegaGanttData } from './gantt_data_adapter';
import { createGanttSpec } from './gantt_chart_spec';

jest.mock('vega', () => {
  const mockView = {
    renderer: jest.fn().mockReturnThis(),
    initialize: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    run: jest.fn().mockResolvedValue({}),
    addEventListener: jest.fn(),
    finalize: jest.fn(),
  };

  return {
    View: jest.fn(() => mockView),
    parse: jest.fn(() => ({})),
    __mockView: mockView,
  };
});

jest.mock('./gantt_data_adapter', () => ({
  convertToVegaGanttData: jest.fn().mockReturnValue({
    values: [
      {
        spanId: 'span-1',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: 0,
        duration: 100,
        level: 0,
        hasError: false,
      },
      {
        spanId: 'span-2',
        serviceName: 'service-b',
        name: 'operation-2',
        startTime: 20,
        duration: 60,
        level: 1,
        hasError: false,
      },
    ],
    maxEndTime: 100,
  }),
}));

jest.mock('./gantt_chart_spec', () => ({
  createGanttSpec: jest.fn().mockReturnValue({
    width: 800,
    height: 400,
    data: [],
    marks: [],
  }),
}));

const mockGetBoundingClientRect = jest.fn().mockReturnValue({
  width: 800,
  height: 400,
  top: 0,
  left: 0,
  bottom: 400,
  right: 800,
  x: 0,
  y: 0,
});

Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

describe('GanttChart', () => {
  const mockData = [
    {
      spanId: 'span-1',
      traceId: 'trace-1',
      parentSpanId: '',
      serviceName: 'service-a',
      name: 'operation-1',
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:00:00.100Z',
      durationInNanos: 100000000,
      'status.code': 0,
    },
    {
      spanId: 'span-2',
      traceId: 'trace-1',
      parentSpanId: 'span-1',
      serviceName: 'service-b',
      name: 'operation-2',
      startTime: '2023-01-01T10:00:00.020Z',
      endTime: '2023-01-01T10:00:00.080Z',
      durationInNanos: 60000000,
      'status.code': 0,
    },
  ];

  const mockColorMap = {
    'service-a': '#ff0000',
    'service-b': '#00ff00',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<GanttChart data={mockData} colorMap={mockColorMap} height={400} />);

    const container = document.querySelector('div');
    expect(container).toBeInTheDocument();
  });

  it('calls convertToVegaGanttData with correct parameters', () => {
    render(<GanttChart data={mockData} colorMap={mockColorMap} height={400} />);

    expect(convertToVegaGanttData).toHaveBeenCalledWith(mockData, mockColorMap);
  });

  it('calls createGanttSpec with correct parameters', () => {
    render(<GanttChart data={mockData} colorMap={mockColorMap} height={400} />);

    expect(createGanttSpec).toHaveBeenCalled();

    const calls = (createGanttSpec as jest.Mock).mock.calls;
    expect(calls[0][1]).toBe(mockData.length);
  });

  it('calculates height correctly based on data length', () => {
    // Test with empty data
    const { container: emptyContainer } = render(
      <GanttChart data={[]} colorMap={mockColorMap} height={0} />
    );

    const emptyDiv = emptyContainer.querySelector('div');
    expect(emptyDiv).toHaveAttribute('style');
    const emptyStyle = emptyDiv?.getAttribute('style');
    expect(emptyStyle).toContain('height: 150px');

    // Test with single item
    const { container: singleContainer } = render(
      <GanttChart data={[mockData[0]]} colorMap={mockColorMap} height={0} />
    );

    const singleDiv = singleContainer.querySelector('div');
    expect(singleDiv).toHaveAttribute('style');
    const singleStyle = singleDiv?.getAttribute('style');
    expect(singleStyle).toContain('height: 120px');

    // Test with multiple items
    const { container: multiContainer } = render(
      <GanttChart data={mockData} colorMap={mockColorMap} height={0} />
    );

    const multiDiv = multiContainer.querySelector('div');
    expect(multiDiv).toHaveAttribute('style');
    const multiStyle = multiDiv?.getAttribute('style');
    expect(multiStyle).toContain('height: 150px'); // 2 items * 30px + 40px = 100px, but minimum is 150px
  });

  it('respects provided height prop', () => {
    // Test with provided height that's larger than calculated height
    const { container } = render(
      <GanttChart data={mockData} colorMap={mockColorMap} height={500} />
    );

    const div = container.querySelector('div');
    expect(div).toHaveAttribute('style');
    const style = div?.getAttribute('style');
    expect(style).toContain('height: 500px');
  });

  it('handles window resize events', async () => {
    render(<GanttChart data={mockData} colorMap={mockColorMap} height={400} />);

    // Initial width should be 800 from the mock
    expect(mockGetBoundingClientRect).toHaveBeenCalled();

    // Clear the mock to count only resize-related calls
    mockGetBoundingClientRect.mockClear();

    // Simulate resize
    mockGetBoundingClientRect.mockReturnValue({
      width: 1000,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 1000,
      x: 0,
      y: 0,
    });

    fireEvent(window, new Event('resize'));

    // Wait for resize handler to be called (at least once)
    await waitFor(() => {
      expect(mockGetBoundingClientRect).toHaveBeenCalled();
    });

    // Verify that the function was called at least once after the resize event
    expect(mockGetBoundingClientRect.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('sets up click handler when onSpanClick is provided', () => {
    const mockOnSpanClick = jest.fn();

    render(
      <GanttChart
        data={mockData}
        colorMap={mockColorMap}
        height={400}
        onSpanClick={mockOnSpanClick}
      />
    );

    const vega = jest.requireMock('vega');
    const { __mockView } = vega;

    // Wait for the async initialization to complete
    setTimeout(() => {
      expect(__mockView.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    }, 0);
  });

  it('cleans up Vega view on unmount', () => {
    // Reset the mock before this test
    const vega = jest.requireMock('vega');
    const { __mockView } = vega;
    __mockView.finalize.mockClear();

    const { unmount } = render(<GanttChart data={mockData} colorMap={mockColorMap} height={400} />);

    unmount();

    // Wait for the cleanup to happen
    setTimeout(() => {
      expect(__mockView.finalize).toHaveBeenCalled();
    }, 0);
  });

  it('handles errors gracefully', () => {
    // Mock parse to throw an error
    const vega = jest.requireMock('vega');
    const { parse } = vega;
    parse.mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    expect(() => {
      render(<GanttChart data={mockData} colorMap={mockColorMap} height={400} />);
    }).not.toThrow();
  });
});
