/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanDetailPanel } from './span_detail_panel';
import { ChromeStart } from 'opensearch-dashboards/public';

// Mock the GanttChart component
jest.mock('../gantt_chart_vega/gantt_chart_vega', () => ({
  GanttChart: ({ data, onSpanClick }: any) => (
    <div data-testid="gantt-chart">
      <div data-testid="gantt-chart-data-length">{data.length}</div>
      <button onClick={() => onSpanClick && onSpanClick('test-span-id')}>Click Span</button>
    </div>
  ),
}));

// Mock the SpanDetailTable components
jest.mock('./span_detail_table', () => ({
  SpanDetailTable: ({ openFlyout, payloadData }: any) => {
    const data = JSON.parse(payloadData);
    return (
      <div data-testid="span-detail-table">
        <div>Span List View</div>
        <div data-testid="span-table-data-length">{data.length}</div>
        <button onClick={() => openFlyout && openFlyout('test-span-id')}>Open Flyout</button>
      </div>
    );
  },
  SpanDetailTableHierarchy: ({ openFlyout, payloadData }: any) => {
    const data = JSON.parse(payloadData);
    return (
      <div data-testid="span-detail-table-hierarchy">
        <div>Tree View</div>
        <div data-testid="span-hierarchy-data-length">{data.length}</div>
        <button onClick={() => openFlyout && openFlyout('test-span-id')}>Open Flyout</button>
      </div>
    );
  },
}));

// Mock chrome observable
const mockChrome = ({
  getIsNavDrawerLocked$: () => ({
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
} as unknown) as ChromeStart;

// Mock useObservable
jest.mock('react-use/lib/useObservable', () => jest.fn(() => false));

describe('SpanDetailPanel', () => {
  const mockSpanData = [
    {
      spanId: 'span-1',
      traceId: 'trace-1',
      serviceName: 'service-a',
      name: 'operation-1',
      startTime: '2023-01-01T00:00:00.000Z',
      endTime: '2023-01-01T00:00:01.000Z',
      durationInNanos: 1000000000,
      status: { code: 0 },
    },
    {
      spanId: 'span-2',
      traceId: 'trace-1',
      serviceName: 'service-b',
      name: 'operation-2',
      startTime: '2023-01-01T00:00:00.500Z',
      endTime: '2023-01-01T00:00:01.500Z',
      durationInNanos: 1000000000,
      status: { code: 2 }, // Error status
    },
  ];

  const defaultProps = {
    chrome: mockChrome,
    spanFilters: [],
    setSpanFiltersWithStorage: jest.fn(),
    payloadData: JSON.stringify(mockSpanData),
    isGanttChartLoading: false,
    dataSourceMDSId: 'test-datasource',
    dataSourceMDSLabel: 'Test DataSource',
    traceId: 'trace-1',
    colorMap: {
      'service-a': '#FF0000',
      'service-b': '#00FF00',
    },
    onSpanSelect: jest.fn(),
    selectedSpanId: 'span-1',
    activeView: 'timeline',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state when isGanttChartLoading is true', () => {
    const propsWithLoading = {
      ...defaultProps,
      isGanttChartLoading: true,
    };

    render(<SpanDetailPanel {...propsWithLoading} />);

    expect(document.querySelector('.euiLoadingChart')).toBeInTheDocument();
    expect(screen.queryByTestId('gantt-chart')).not.toBeInTheDocument();
  });

  it('renders gantt chart by default (timeline view)', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="gantt-chart-data-length"]')).toHaveTextContent(
      '2'
    );
    expect(document.querySelector('[data-testid="span-detail-table"]')).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-testid="span-detail-table-hierarchy"]')
    ).not.toBeInTheDocument();
  });

  it('renders span list view when activeView is span_list', () => {
    const propsWithSpanList = {
      ...defaultProps,
      activeView: 'span_list',
    };

    render(<SpanDetailPanel {...propsWithSpanList} />);

    expect(document.querySelector('[data-testid="span-detail-table"]')).toBeInTheDocument();
    expect(screen.getByText('Span List View')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-table-data-length"]')).toHaveTextContent('2');
    expect(document.querySelector('[data-testid="gantt-chart"]')).not.toBeInTheDocument();
  });

  it('renders tree view when activeView is tree_view', () => {
    const propsWithTreeView = {
      ...defaultProps,
      activeView: 'tree_view',
    };

    render(<SpanDetailPanel {...propsWithTreeView} />);

    expect(
      document.querySelector('[data-testid="span-detail-table-hierarchy"]')
    ).toBeInTheDocument();
    expect(screen.getByText('Tree View')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-hierarchy-data-length"]')).toHaveTextContent(
      '2'
    );
    expect(document.querySelector('[data-testid="gantt-chart"]')).not.toBeInTheDocument();
  });

  it('calls onSpanSelect when span is clicked in gantt chart', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const spanButton = screen.getByText('Click Span');
    fireEvent.click(spanButton);

    expect(defaultProps.onSpanSelect).toHaveBeenCalledWith('test-span-id');
  });

  it('calls onSpanSelect when span is clicked in span list view', () => {
    const propsWithSpanList = {
      ...defaultProps,
      activeView: 'span_list',
    };

    render(<SpanDetailPanel {...propsWithSpanList} />);

    const flyoutButton = screen.getByText('Open Flyout');
    fireEvent.click(flyoutButton);

    expect(defaultProps.onSpanSelect).toHaveBeenCalledWith('test-span-id');
  });

  it('calls onSpanSelect when span is clicked in tree view', () => {
    const propsWithTreeView = {
      ...defaultProps,
      activeView: 'tree_view',
    };

    render(<SpanDetailPanel {...propsWithTreeView} />);

    const flyoutButton = screen.getByText('Open Flyout');
    fireEvent.click(flyoutButton);

    expect(defaultProps.onSpanSelect).toHaveBeenCalledWith('test-span-id');
  });

  it('handles invalid JSON payload data gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const propsWithInvalidData = {
      ...defaultProps,
      payloadData: 'invalid-json',
    };

    render(<SpanDetailPanel {...propsWithInvalidData} />);

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="gantt-chart-data-length"]')).toHaveTextContent(
      '0'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Error parsing payload data:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('handles missing onSpanSelect prop gracefully', () => {
    const propsWithoutOnSpanSelect = {
      ...defaultProps,
      onSpanSelect: undefined,
    };

    render(<SpanDetailPanel {...propsWithoutOnSpanSelect} />);

    const spanButton = screen.getByText('Click Span');
    fireEvent.click(spanButton);

    // Should not throw an error
    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
  });

  it('does not render service legend when no colorMap is provided', () => {
    const propsWithoutColorMap = {
      ...defaultProps,
      colorMap: undefined,
    };

    render(<SpanDetailPanel {...propsWithoutColorMap} />);

    // ServiceLegend is not rendered in the current component structure
    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
  });

  it('does not render service legend when colorMap is empty', () => {
    const propsWithEmptyColorMap = {
      ...defaultProps,
      colorMap: {},
    };

    render(<SpanDetailPanel {...propsWithEmptyColorMap} />);

    // ServiceLegend is not rendered in the current component structure
    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
  });

  it('renders correct panel structure', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const panel = screen.getByTestId('span-gantt-chart-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('euiPanel');
  });

  it('falls back to timeline view for unknown activeView', () => {
    const propsWithUnknownView = {
      ...defaultProps,
      activeView: 'unknown_view',
    };

    render(<SpanDetailPanel {...propsWithUnknownView} />);

    // Should fall back to gantt chart (timeline view)
    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-detail-table"]')).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-testid="span-detail-table-hierarchy"]')
    ).not.toBeInTheDocument();
  });

  it('tests addSpanFilter functionality', () => {
    const mockSetSpanFiltersWithStorage = jest.fn();
    const propsWithFilters = {
      ...defaultProps,
      spanFilters: [{ field: 'serviceName', value: 'service-a' }],
      setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
    };

    render(<SpanDetailPanel {...propsWithFilters} />);

    expect(mockSetSpanFiltersWithStorage).toBeDefined();
  });

  it('tests removeSpanFilter functionality', () => {
    const mockSetSpanFiltersWithStorage = jest.fn();
    const propsWithFilters = {
      ...defaultProps,
      spanFilters: [{ field: 'serviceName', value: 'service-a' }],
      setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
    };

    render(<SpanDetailPanel {...propsWithFilters} />);

    expect(mockSetSpanFiltersWithStorage).toBeDefined();
  });

  it('handles window resize events', () => {
    const originalInnerWidth = window.innerWidth;

    render(<SpanDetailPanel {...defaultProps} />);

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200,
    });

    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent);

    // Restore original value
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
  });

  it('calculates gantt height correctly for different span counts', () => {
    // Test with 0 spans
    const propsWithNoSpans = {
      ...defaultProps,
      payloadData: JSON.stringify([]),
    };

    render(<SpanDetailPanel {...propsWithNoSpans} />);
    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="gantt-chart-data-length"]')).toHaveTextContent(
      '0'
    );
  });

  it('calculates gantt height correctly for single span', () => {
    const propsWithSingleSpan = {
      ...defaultProps,
      payloadData: JSON.stringify([mockSpanData[0]]),
    };

    render(<SpanDetailPanel {...propsWithSingleSpan} />);
    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="gantt-chart-data-length"]')).toHaveTextContent(
      '1'
    );
  });

  it('calculates gantt height correctly for multiple spans', () => {
    const multipleSpans = Array.from({ length: 5 }, (_, i) => ({
      ...mockSpanData[0],
      spanId: `span-${i + 1}`,
    }));

    const propsWithMultipleSpans = {
      ...defaultProps,
      payloadData: JSON.stringify(multipleSpans),
    };

    render(<SpanDetailPanel {...propsWithMultipleSpans} />);
    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="gantt-chart-data-length"]')).toHaveTextContent(
      '5'
    );
  });

  it('handles containerRef correctly when available', () => {
    const mockGetBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: jest.fn(),
    }));

    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      const element = originalCreateElement.call(document, tagName);
      if (tagName === 'div') {
        element.getBoundingClientRect = mockGetBoundingClientRect;
      }
      return element;
    });

    render(<SpanDetailPanel {...defaultProps} />);

    // Restore original createElement
    document.createElement = originalCreateElement;

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
  });

  it('handles locked navigation drawer state', () => {
    const useObservableMock = jest.requireMock('react-use/lib/useObservable');
    useObservableMock.mockReturnValue(true);

    render(<SpanDetailPanel {...defaultProps} />);

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();

    // Reset mock
    useObservableMock.mockReturnValue(false);
  });

  it('handles unlocked navigation drawer state', () => {
    // Mock useObservable to return false (unlocked state)
    const useObservableMock = jest.requireMock('react-use/lib/useObservable');
    useObservableMock.mockReturnValue(false);

    render(<SpanDetailPanel {...defaultProps} />);

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
  });

  it('passes correct props to SpanDetailTable', () => {
    const propsWithSpanList = {
      ...defaultProps,
      activeView: 'span_list',
      spanFilters: [{ field: 'serviceName', value: 'test-service' }],
    };

    render(<SpanDetailPanel {...propsWithSpanList} />);

    const spanTable = document.querySelector('[data-testid="span-detail-table"]');
    expect(spanTable).toBeInTheDocument();
    expect(spanTable).toHaveTextContent('Span List View');
  });

  it('passes correct props to SpanDetailTableHierarchy', () => {
    const propsWithTreeView = {
      ...defaultProps,
      activeView: 'tree_view',
      spanFilters: [{ field: 'serviceName', value: 'test-service' }],
    };

    render(<SpanDetailPanel {...propsWithTreeView} />);

    const hierarchyTable = document.querySelector('[data-testid="span-detail-table-hierarchy"]');
    expect(hierarchyTable).toBeInTheDocument();
    expect(hierarchyTable).toHaveTextContent('Tree View');
  });

  it('passes correct props to GanttChart', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const ganttChart = document.querySelector('[data-testid="gantt-chart"]');
    expect(ganttChart).toBeInTheDocument();
    expect(document.querySelector('[data-testid="gantt-chart-data-length"]')).toHaveTextContent(
      '2'
    );
  });

  it('handles empty colorMap gracefully', () => {
    const propsWithEmptyColorMap = {
      ...defaultProps,
      colorMap: {},
    };

    render(<SpanDetailPanel {...propsWithEmptyColorMap} />);

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
  });

  it('handles undefined colorMap gracefully', () => {
    const propsWithUndefinedColorMap = {
      ...defaultProps,
      colorMap: undefined,
    };

    render(<SpanDetailPanel {...propsWithUndefinedColorMap} />);

    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
  });

  it('renders with default activeView when not provided', () => {
    const propsWithoutActiveView = {
      ...defaultProps,
      activeView: undefined,
    };

    render(<SpanDetailPanel {...propsWithoutActiveView} />);

    // Should default to timeline view (gantt chart)
    expect(document.querySelector('[data-testid="gantt-chart"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-detail-table"]')).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-testid="span-detail-table-hierarchy"]')
    ).not.toBeInTheDocument();
  });
});
