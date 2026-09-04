/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, act } from '@testing-library/react';
import { SplitContainer, getColumnCount } from './split_container';

const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();

  (global as any).ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: jest.fn(),
  }));

  (global as any).IntersectionObserver = jest.fn().mockImplementation((callback) => ({
    observe: (el: Element) => callback([{ isIntersecting: true }]),
    disconnect: jest.fn(),
    unobserve: jest.fn(),
  }));
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('getColumnCount', () => {
  it('returns 6 for width > 1600', () => {
    expect(getColumnCount(1601)).toBe(6);
    expect(getColumnCount(2000)).toBe(6);
  });

  it('returns 5 for width > 1200 and <= 1600', () => {
    expect(getColumnCount(1201)).toBe(5);
    expect(getColumnCount(1600)).toBe(5);
  });

  it('returns 3 for width > 800 and <= 1200', () => {
    expect(getColumnCount(801)).toBe(3);
    expect(getColumnCount(1200)).toBe(3);
  });

  it('returns 2 for width > 500 and <= 800', () => {
    expect(getColumnCount(501)).toBe(2);
    expect(getColumnCount(800)).toBe(2);
  });

  it('returns 1 for width <= 500', () => {
    expect(getColumnCount(500)).toBe(1);
    expect(getColumnCount(0)).toBe(1);
  });
});

describe('SplitContainer', () => {
  const mockRenderChart = jest.fn((group) => <div data-test-subj="mockChart">{group}</div>);

  const createGroups = (count: number): string[] =>
    Array.from({ length: count }, (_, i) => `group_${i}`);

  it('renders all groups', () => {
    const groups = createGroups(3);

    render(<SplitContainer groups={groups} layout="auto" renderChart={mockRenderChart} />);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getAllByTestId('mockChart')).toHaveLength(3);
  });

  it('passes showLabel to chart instances', () => {
    const groups = ['TestLabel'];

    render(
      <SplitContainer
        groups={groups}
        layout="auto"
        showLabel={true}
        renderChart={mockRenderChart}
      />
    );

    expect(screen.getByText('TestLabel')).toBeInTheDocument();
  });

  it('hides labels by default', () => {
    const groups = ['HiddenLabel'];

    render(<SplitContainer groups={groups} layout="auto" renderChart={mockRenderChart} />);

    expect(screen.queryByText('HiddenLabel')).not.toBeInTheDocument();
  });

  it('renders empty when no groups provided', () => {
    const { container } = render(
      <SplitContainer groups={[]} layout="auto" renderChart={mockRenderChart} />
    );

    expect(container.querySelectorAll('.splitChartInstance')).toHaveLength(0);
  });

  it('sets up ResizeObserver on mount', () => {
    render(<SplitContainer groups={createGroups(1)} layout="auto" renderChart={mockRenderChart} />);

    expect(global.ResizeObserver).toHaveBeenCalled();
    expect(mockObserve).toHaveBeenCalled();
  });

  it('uses the default vertical item min height', () => {
    const { container } = render(
      <SplitContainer groups={createGroups(1)} layout="vertical" renderChart={mockRenderChart} />
    );

    expect(container.querySelector('.splitChartInstance')).toHaveStyle({ minHeight: '200px' });
  });

  it('uses a custom vertical item min height when provided', () => {
    const { container } = render(
      <SplitContainer
        groups={createGroups(1)}
        layout="vertical"
        verticalItemMinHeight={60}
        renderChart={mockRenderChart}
      />
    );

    expect(container.querySelector('.splitChartInstance')).toHaveStyle({ minHeight: '60px' });
  });

  it('uses 300px as the default horizontal item min width', () => {
    const { container } = render(
      <SplitContainer groups={createGroups(1)} layout="horizontal" renderChart={mockRenderChart} />
    );

    expect(container.querySelector('.splitChartInstance')).toHaveStyle({ minWidth: '300px' });
  });

  it('uses the configured horizontal item min width', () => {
    const { container } = render(
      <SplitContainer
        groups={createGroups(1)}
        layout="horizontal"
        horizontalItemMinWidth={180}
        renderChart={mockRenderChart}
      />
    );

    expect(container.querySelector('.splitChartInstance')).toHaveStyle({ minWidth: '180px' });
  });
});
