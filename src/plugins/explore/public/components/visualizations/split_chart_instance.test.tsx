/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, act } from '@testing-library/react';
import { SplitChartInstance } from './split_chart_instance';

let intersectionCallback: (entries: Array<{ isIntersecting: boolean }>) => void;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  (global as any).IntersectionObserver = jest.fn().mockImplementation((callback) => {
    intersectionCallback = callback;
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: jest.fn(),
    };
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('SplitChartInstance', () => {
  const mockRenderChart = jest.fn((data) => (
    <div data-test-subj="renderedChart">{data.length} items</div>
  ));
  const defaultProps = {
    label: 'Test Group',
    data: [{ v: 1 }, { v: 2 }],
    renderChart: mockRenderChart,
  };

  it('does not render chart content until visible', () => {
    render(<SplitChartInstance {...defaultProps} />);

    // Before timeout fires, observer not set up
    expect(mockRenderChart).not.toHaveBeenCalled();
  });

  it('sets up observer after delay and renders when visible', () => {
    render(<SplitChartInstance {...defaultProps} />);

    // Advance past the 100ms delay
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockObserve).toHaveBeenCalled();

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    expect(mockRenderChart).toHaveBeenCalledWith(defaultProps.data, defaultProps.label);
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('disconnects observer after becoming visible', () => {
    render(<SplitChartInstance {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('does not render chart when not intersecting', () => {
    render(<SplitChartInstance {...defaultProps} />);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      intersectionCallback([{ isIntersecting: false }]);
    });

    expect(mockRenderChart).not.toHaveBeenCalled();
  });

  it('shows label when showLabel is true', () => {
    render(<SplitChartInstance {...defaultProps} showLabel={true} />);

    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<SplitChartInstance {...defaultProps} showLabel={false} />);

    expect(screen.queryByText('Test Group')).not.toBeInTheDocument();
  });

  it('hides label by default', () => {
    render(<SplitChartInstance {...defaultProps} />);

    expect(screen.queryByText('Test Group')).not.toBeInTheDocument();
  });

  it('applies custom style', () => {
    const { container } = render(
      <SplitChartInstance {...defaultProps} style={{ gridColumn: 'span 20' }} />
    );

    const instance = container.querySelector('.splitChartInstance');
    expect(instance).toHaveStyle({ gridColumn: 'span 20' });
  });

  it('cleans up timer and observer on unmount', () => {
    const { unmount } = render(<SplitChartInstance {...defaultProps} />);

    unmount();

    // Advancing timers after unmount should not throw
    act(() => {
      jest.advanceTimersByTime(100);
    });
  });
});
