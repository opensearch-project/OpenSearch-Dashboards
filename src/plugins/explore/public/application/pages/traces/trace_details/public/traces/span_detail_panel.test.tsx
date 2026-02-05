/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanDetailPanel } from './span_detail_panel';
import { TraceDetailTab } from '../../constants/trace_detail_tabs';
import { ChromeStart } from 'opensearch-dashboards/public';

// Mock the SpanDetailTables components
jest.mock('./span_detail_tables', () => ({
  SpanListTable: ({ openFlyout, payloadData }: any) => {
    const data = JSON.parse(payloadData);
    return (
      <div data-testid="span-list-table">
        <div>Span List View</div>
        <div data-testid="span-table-data-length">{data.length}</div>
        <button onClick={() => openFlyout && openFlyout('test-span-id')}>Open Flyout</button>
      </div>
    );
  },
  SpanHierarchyTable: ({ openFlyout, payloadData }: any) => {
    const data = JSON.parse(payloadData);
    return (
      <div data-testid="span-hierarchy-table">
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
    payloadData: JSON.stringify(mockSpanData),
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

  it('renders hierarchy table by default (timeline view)', () => {
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...defaultProps} />);

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-hierarchy-data-length"]')).toHaveTextContent(
      '2'
    );
    expect(document.querySelector('[data-testid="span-list-table"]')).not.toBeInTheDocument();
  });

  it('renders span list view when activeView is span_list', () => {
    const propsWithSpanList = {
      ...defaultProps,
      activeView: TraceDetailTab.SPAN_LIST,
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithSpanList} />);

    expect(document.querySelector('[data-testid="span-list-table"]')).toBeInTheDocument();
    expect(screen.getByText('Span List View')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-table-data-length"]')).toHaveTextContent('2');
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).not.toBeInTheDocument();
  });

  it('calls onSpanSelect when span is clicked in hierarchy table', () => {
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...defaultProps} />);

    const flyoutButton = screen.getByText('Open Flyout');
    fireEvent.click(flyoutButton);

    expect(defaultProps.onSpanSelect).toHaveBeenCalledWith('test-span-id');
  });

  it('calls onSpanSelect when span is clicked in span list view', () => {
    const propsWithSpanList = {
      ...defaultProps,
      activeView: TraceDetailTab.SPAN_LIST,
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithSpanList} />);

    const flyoutButton = screen.getByText('Open Flyout');
    fireEvent.click(flyoutButton);

    expect(defaultProps.onSpanSelect).toHaveBeenCalledWith('test-span-id');
  });

  it('handles missing onSpanSelect prop gracefully', () => {
    const propsWithoutOnSpanSelect = {
      ...defaultProps,
      onSpanSelect: undefined,
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithoutOnSpanSelect} />);

    const flyoutButton = screen.getByText('Open Flyout');
    fireEvent.click(flyoutButton);

    // Should not throw an error
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
  });

  it('does not render service legend when no colorMap is provided', () => {
    const propsWithoutColorMap = {
      ...defaultProps,
      colorMap: undefined,
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithoutColorMap} />);

    // ServiceLegend is not rendered in the current component structure
    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
  });

  it('does not render service legend when colorMap is empty', () => {
    const propsWithEmptyColorMap = {
      ...defaultProps,
      colorMap: {},
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithEmptyColorMap} />);

    // ServiceLegend is not rendered in the current component structure
    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
  });

  it('renders correct panel structure', () => {
    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...defaultProps} />);

    const panel = screen.getByTestId('span-detail-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('euiPanel');
  });

  it('falls back to timeline view for unknown activeView', () => {
    const propsWithUnknownView = {
      ...defaultProps,
      activeView: 'unknown_view',
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithUnknownView} />);

    // Should fall back to hierarchy table (timeline view)
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-list-table"]')).not.toBeInTheDocument();
  });

  it('handles window resize events', () => {
    const originalInnerWidth = window.innerWidth;

    // @ts-expect-error TS2741 TODO(ts-error): fixme
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

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
  });

  it('renders table correctly for different span counts', () => {
    // Test with 0 spans
    const propsWithNoSpans = {
      ...defaultProps,
      payloadData: JSON.stringify([]),
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithNoSpans} />);
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-hierarchy-data-length"]')).toHaveTextContent(
      '0'
    );
  });

  it('renders table correctly for single span', () => {
    const propsWithSingleSpan = {
      ...defaultProps,
      payloadData: JSON.stringify([mockSpanData[0]]),
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithSingleSpan} />);
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-hierarchy-data-length"]')).toHaveTextContent(
      '1'
    );
  });

  it('renders table correctly for multiple spans', () => {
    const multipleSpans = Array.from({ length: 5 }, (_, i) => ({
      ...mockSpanData[0],
      spanId: `span-${i + 1}`,
    }));

    const propsWithMultipleSpans = {
      ...defaultProps,
      payloadData: JSON.stringify(multipleSpans),
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithMultipleSpans} />);
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-hierarchy-data-length"]')).toHaveTextContent(
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

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...defaultProps} />);

    // Restore original createElement
    document.createElement = originalCreateElement;

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
  });

  it('handles locked navigation drawer state', () => {
    const useObservableMock = jest.requireMock('react-use/lib/useObservable');
    useObservableMock.mockReturnValue(true);

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...defaultProps} />);

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();

    // Reset mock
    useObservableMock.mockReturnValue(false);
  });

  it('handles unlocked navigation drawer state', () => {
    // Mock useObservable to return false (unlocked state)
    const useObservableMock = jest.requireMock('react-use/lib/useObservable');
    useObservableMock.mockReturnValue(false);

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...defaultProps} />);

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
  });

  it('passes correct props to SpanListTable', () => {
    const propsWithSpanList = {
      ...defaultProps,
      activeView: TraceDetailTab.SPAN_LIST,
      spanFilters: [{ field: 'serviceName', value: 'test-service' }],
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithSpanList} />);

    const spanTable = document.querySelector('[data-testid="span-list-table"]');
    expect(spanTable).toBeInTheDocument();
    expect(spanTable).toHaveTextContent('Span List View');
  });

  it('passes correct props to SpanHierarchyTable', () => {
    const propsWithTreeView = {
      ...defaultProps,
      activeView: TraceDetailTab.TIMELINE,
      spanFilters: [{ field: 'serviceName', value: 'test-service' }],
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithTreeView} />);

    const hierarchyTable = document.querySelector('[data-testid="span-hierarchy-table"]');
    expect(hierarchyTable).toBeInTheDocument();
    expect(hierarchyTable).toHaveTextContent('Tree View');
  });

  it('handles empty colorMap gracefully', () => {
    const propsWithEmptyColorMap = {
      ...defaultProps,
      colorMap: {},
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithEmptyColorMap} />);

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
  });

  it('handles undefined colorMap gracefully', () => {
    const propsWithUndefinedColorMap = {
      ...defaultProps,
      colorMap: undefined,
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithUndefinedColorMap} />);

    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
  });

  it('renders with default activeView when not provided', () => {
    const propsWithoutActiveView = {
      ...defaultProps,
      activeView: undefined,
    };

    // @ts-expect-error TS2741 TODO(ts-error): fixme
    render(<SpanDetailPanel {...propsWithoutActiveView} />);

    // Should default to timeline view (hierarchy table)
    expect(document.querySelector('[data-testid="span-hierarchy-table"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-list-table"]')).not.toBeInTheDocument();
  });
});
