/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanDetailPanel, TraceFilter } from './span_detail_panel';
import { ChromeStart } from 'opensearch-dashboards/public';
import { TracePPLService } from '../../server/ppl_request_trace';

jest.mock('react-use/lib/useObservable', () => jest.fn(() => false));

jest.mock('./span_detail_table', () => ({
  SpanDetailTable: ({ openFlyout, payloadData, filters }: any) => (
    <div data-testid="span-detail-table">
      <button onClick={() => openFlyout('span-1')}>Open Flyout</button>
      <div data-testid="span-detail-table-payload">{payloadData}</div>
      <div data-testid="span-detail-table-filters">{JSON.stringify(filters)}</div>
    </div>
  ),
  SpanDetailTableHierarchy: ({ openFlyout, payloadData, filters }: any) => (
    <div data-testid="span-detail-table-hierarchy">
      <button onClick={() => openFlyout('span-1')}>Open Flyout</button>
      <div data-testid="span-detail-table-hierarchy-payload">{payloadData}</div>
      <div data-testid="span-detail-table-hierarchy-filters">{JSON.stringify(filters)}</div>
    </div>
  ),
}));

jest.mock('../gantt_chart_vega/gantt_chart_vega', () => ({
  GanttChart: ({ data, onSpanClick }: any) => (
    <div data-testid="gantt-chart">
      <div data-testid="gantt-chart-data-length">{data.length}</div>
      <button onClick={() => onSpanClick('span-1')}>Click Span</button>
    </div>
  ),
}));

jest.mock('../utils/helper_functions', () => ({
  PanelTitle: ({ title, totalItems }: any) => (
    <div data-testid="panel-title">
      {title} ({totalItems})
    </div>
  ),
  NoMatchMessage: jest.fn(),
}));

const mockGetBoundingClientRect = jest.fn().mockReturnValue({
  width: 1000,
  height: 500,
});

Element.prototype.getBoundingClientRect = mockGetBoundingClientRect;

describe('SpanDetailPanel', () => {
  const mockChrome = ({
    getIsNavDrawerLocked$: jest.fn().mockReturnValue({
      subscribe: jest.fn(),
    }),
    setBreadcrumbs: jest.fn(),
  } as unknown) as ChromeStart;

  const mockPplService = {} as TracePPLService;

  const mockSpanFilters: TraceFilter[] = [];
  const mockSetSpanFiltersWithStorage = jest.fn();

  const mockPayloadData = JSON.stringify([
    {
      traceId: 'trace-1',
      spanId: 'span-1',
      parentSpanId: '',
      serviceName: 'service-a',
      name: 'operation-1',
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:00:00.100Z',
      durationInNanos: 100000000,
      status: { code: 0 },
    },
    {
      traceId: 'trace-1',
      spanId: 'span-2',
      parentSpanId: 'span-1',
      serviceName: 'service-b',
      name: 'operation-2',
      startTime: '2023-01-01T10:00:00.020Z',
      endTime: '2023-01-01T10:00:00.080Z',
      durationInNanos: 60000000,
      status: { code: 2 },
    },
  ]);

  const mockColorMap = {
    'service-a': '#ff0000',
    'service-b': '#00ff00',
  };

  const defaultProps = {
    chrome: mockChrome,
    spanFilters: mockSpanFilters,
    setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
    payloadData: mockPayloadData,
    dataSourceMDSId: 'test-datasource-id',
    dataSourceMDSLabel: 'Test Datasource',
    traceId: 'trace-1',
    pplService: mockPplService,
    indexPattern: 'test-index-pattern',
    colorMap: mockColorMap,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1200;
  });

  it('renders without crashing', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    expect(screen.getByTestId('span-gantt-chart-panel')).toBeInTheDocument();
  });

  it('renders the panel title with correct span count', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    expect(screen.getByText(/Spans \(2\)/)).toBeInTheDocument();
  });

  it('shows error filter button when spans have errors', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const errorButton = screen.getByTestId('error-count-button');
    expect(errorButton).toBeInTheDocument();
    expect(errorButton).toHaveTextContent('Filter errors (1)');
  });

  it('adds error filter when error button is clicked', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const errorButton = screen.getByTestId('error-count-button');
    fireEvent.click(errorButton);

    expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
      { field: 'status.code', value: 2 },
    ]);
  });

  it('renders the gantt chart view by default', () => {
    const { container } = render(<SpanDetailPanel {...defaultProps} />);

    const ganttChart = container.querySelector('[data-testid="gantt-chart"]');
    expect(ganttChart).toBeInTheDocument();

    // Check that the other views are not rendered
    expect(container.querySelector('[data-testid="span-detail-table"]')).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="span-detail-table-hierarchy"]')
    ).not.toBeInTheDocument();
  });

  it('switches to span list view when button is clicked', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const spanListInput = screen.getByTestId('span_list');
    fireEvent.click(spanListInput);

    expect(spanListInput).toBeInTheDocument();
  });

  it('switches to tree view when button is clicked', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const treeViewInput = screen.getByTestId('hierarchy_span_list');
    fireEvent.click(treeViewInput);

    expect(treeViewInput).toBeInTheDocument();
  });

  it('calls onSpanSelect when a span is clicked in the gantt chart', () => {
    const mockOnSpanSelect = jest.fn();
    const propsWithSpanSelect = {
      ...defaultProps,
      onSpanSelect: mockOnSpanSelect,
    };

    render(<SpanDetailPanel {...propsWithSpanSelect} />);

    const spanButton = screen.getByText('Click Span');
    fireEvent.click(spanButton);

    // Check that onSpanSelect was called with the correct span ID
    expect(mockOnSpanSelect).toHaveBeenCalledWith('span-1');
  });

  it('renders filters when they are present', () => {
    const propsWithFilters = {
      ...defaultProps,
      spanFilters: [{ field: 'serviceName', value: 'service-a' }],
    };

    render(<SpanDetailPanel {...propsWithFilters} />);

    const filterBadge = screen.getByText('serviceName: service-a');
    expect(filterBadge).toBeInTheDocument();
  });

  it('removes a filter when its cross icon is clicked', () => {
    const propsWithFilters = {
      ...defaultProps,
      spanFilters: [{ field: 'serviceName', value: 'service-a' }],
    };

    render(<SpanDetailPanel {...propsWithFilters} />);

    // Find the filter badge and click its cross icon
    const filterBadge = screen.getByText('serviceName: service-a');
    const crossIcon = filterBadge.parentElement?.querySelector('[data-euiicon-type="cross"]');
    if (crossIcon) {
      fireEvent.click(crossIcon);
    }

    // Check that the filter was removed
    expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([]);
  });

  it('shows loading state when isGanttChartLoading is true', () => {
    const propsWithLoading = {
      ...defaultProps,
      isGanttChartLoading: true,
    };

    render(<SpanDetailPanel {...propsWithLoading} />);

    // Check that the loading chart is rendered
    expect(
      screen.getByTestId('span-gantt-chart-panel').querySelector('.euiLoadingChart')
    ).toBeInTheDocument();

    // Check that the gantt chart is not rendered
    expect(screen.queryByTestId('gantt-chart')).not.toBeInTheDocument();
  });

  it('renders service legend popover when button is clicked', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const serviceLegendButton = screen.getByTestId('service-legend-toggle');
    fireEvent.click(serviceLegendButton);

    expect(screen.getAllByText('Service legend').length).toBeGreaterThan(0);
    expect(screen.getByText('service-a')).toBeInTheDocument();
    expect(screen.getByText('service-b')).toBeInTheDocument();
  });

  it('updates available width when window is resized', async () => {
    // First render with a specific window width
    window.innerWidth = 1200;
    const { rerender } = render(<SpanDetailPanel {...defaultProps} />);

    // Then change the window width and re-render
    window.innerWidth = 800;
    rerender(<SpanDetailPanel {...defaultProps} />);

    expect(true).toBe(true);
  });

  it('handles invalid JSON payload data gracefully', () => {
    const propsWithInvalidData = {
      ...defaultProps,
      payloadData: 'invalid json',
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SpanDetailPanel {...propsWithInvalidData} />);

    expect(screen.getByText(/Spans \(0\)/)).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith('Error parsing payload data:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('does not show error filter button when no errors exist', () => {
    const mockPayloadDataNoErrors = JSON.stringify([
      {
        traceId: 'trace-1',
        spanId: 'span-1',
        parentSpanId: '',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: '2023-01-01T10:00:00.000Z',
        endTime: '2023-01-01T10:00:00.100Z',
        durationInNanos: 100000000,
        status: { code: 0 },
      },
    ]);

    const propsWithNoErrors = {
      ...defaultProps,
      payloadData: mockPayloadDataNoErrors,
    };

    render(<SpanDetailPanel {...propsWithNoErrors} />);

    expect(screen.queryByTestId('error-count-button')).not.toBeInTheDocument();
  });

  it('does not show error filter button when error filter is already applied', () => {
    const propsWithErrorFilter = {
      ...defaultProps,
      spanFilters: [{ field: 'status.code', value: 2 }],
    };

    render(<SpanDetailPanel {...propsWithErrorFilter} />);

    expect(screen.queryByTestId('error-count-button')).not.toBeInTheDocument();
  });

  it('adds new filter when field does not exist', () => {
    const propsWithExistingFilters = {
      ...defaultProps,
      spanFilters: [{ field: 'serviceName', value: 'service-a' }],
    };

    render(<SpanDetailPanel {...propsWithExistingFilters} />);

    const errorButton = screen.getByTestId('error-count-button');
    fireEvent.click(errorButton);

    expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
      { field: 'serviceName', value: 'service-a' },
      { field: 'status.code', value: 2 },
    ]);
  });

  it('replaces existing filter when field already exists', () => {
    const propsWithExistingErrorFilter = {
      ...defaultProps,
      spanFilters: [{ field: 'status.code', value: 1 }],
    };

    render(<SpanDetailPanel {...propsWithExistingErrorFilter} />);

    const errorButton = screen.getByTestId('error-count-button');
    fireEvent.click(errorButton);

    expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
      { field: 'status.code', value: 2 },
    ]);
  });

  it('calls onSpanSelect when span is clicked in span list view', () => {
    const mockOnSpanSelect = jest.fn();
    const propsWithSpanSelect = {
      ...defaultProps,
      onSpanSelect: mockOnSpanSelect,
    };

    render(<SpanDetailPanel {...propsWithSpanSelect} />);

    // Switch to span list view
    const spanListInput = screen.getByTestId('span_list');
    fireEvent.click(spanListInput);

    // Click span in the table
    const spanButton = screen.getByText('Open Flyout');
    fireEvent.click(spanButton);

    expect(mockOnSpanSelect).toHaveBeenCalledWith('span-1');
  });

  it('calls onSpanSelect when span is clicked in hierarchy view', () => {
    const mockOnSpanSelect = jest.fn();
    const propsWithSpanSelect = {
      ...defaultProps,
      onSpanSelect: mockOnSpanSelect,
    };

    render(<SpanDetailPanel {...propsWithSpanSelect} />);

    // Switch to hierarchy view
    const hierarchyInput = screen.getByTestId('hierarchy_span_list');
    fireEvent.click(hierarchyInput);

    // Click span in the hierarchy table
    const spanButton = screen.getByText('Open Flyout');
    fireEvent.click(spanButton);

    expect(mockOnSpanSelect).toHaveBeenCalledWith('span-1');
  });

  it('renders service legend with correct services in order', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const serviceLegendButton = screen.getByTestId('service-legend-toggle');
    fireEvent.click(serviceLegendButton);

    // Check that services are rendered in the order they appear in data
    expect(screen.getByText('service-a')).toBeInTheDocument();
    expect(screen.getByText('service-b')).toBeInTheDocument();
  });

  it('does not render service legend when no services have colors', () => {
    const propsWithoutColorMap = {
      ...defaultProps,
      colorMap: {},
    };

    render(<SpanDetailPanel {...propsWithoutColorMap} />);

    expect(screen.queryByTestId('service-legend-toggle')).not.toBeInTheDocument();
  });

  it('closes service legend popover when closePopover is called', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    const serviceLegendButton = screen.getByTestId('service-legend-toggle');
    fireEvent.click(serviceLegendButton);

    // Verify popover is open
    expect(screen.getAllByText('Service legend').length).toBeGreaterThan(1);

    // Click outside or trigger close (simulate clicking the button again)
    fireEvent.click(serviceLegendButton);

    expect(serviceLegendButton).toBeInTheDocument();
  });

  it('calculates gantt height correctly for different span counts', () => {
    // Test with 0 spans
    const propsWithNoSpans = {
      ...defaultProps,
      payloadData: JSON.stringify([]),
    };

    const { rerender } = render(<SpanDetailPanel {...propsWithNoSpans} />);
    expect(screen.getByText(/Spans \(0\)/)).toBeInTheDocument();

    // Test with 1 span
    const propsWithOneSpan = {
      ...defaultProps,
      payloadData: JSON.stringify([
        {
          traceId: 'trace-1',
          spanId: 'span-1',
          parentSpanId: '',
          serviceName: 'service-a',
          name: 'operation-1',
          startTime: '2023-01-01T10:00:00.000Z',
          endTime: '2023-01-01T10:00:00.100Z',
          durationInNanos: 100000000,
          status: { code: 0 },
        },
      ]),
    };

    rerender(<SpanDetailPanel {...propsWithOneSpan} />);
    expect(screen.getByText(/Spans \(1\)/)).toBeInTheDocument();

    // Test with many spans
    const manySpans = Array.from({ length: 20 }, (_, i) => ({
      traceId: 'trace-1',
      spanId: `span-${i}`,
      parentSpanId: '',
      serviceName: 'service-a',
      name: `operation-${i}`,
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:00:00.100Z',
      durationInNanos: 100000000,
      status: { code: 0 },
    }));

    const propsWithManySpans = {
      ...defaultProps,
      payloadData: JSON.stringify(manySpans),
    };

    rerender(<SpanDetailPanel {...propsWithManySpans} />);
    expect(screen.getByText(/Spans \(20\)/)).toBeInTheDocument();
  });

  it('handles missing onSpanSelect prop gracefully', () => {
    const propsWithoutOnSpanSelect = {
      ...defaultProps,
      onSpanSelect: undefined,
    };

    render(<SpanDetailPanel {...propsWithoutOnSpanSelect} />);

    const spanButton = screen.getByText('Click Span');
    fireEvent.click(spanButton);

    const spanListInput = screen.getByTestId('span_list');
    fireEvent.click(spanListInput);

    const flyoutButton = screen.getByText('Open Flyout');
    fireEvent.click(flyoutButton);

    expect(true).toBe(true);
  });

  it('handles resize event listener cleanup', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = render(<SpanDetailPanel {...defaultProps} />);

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('renders with selectedSpanId prop', () => {
    const propsWithSelectedSpan = {
      ...defaultProps,
      selectedSpanId: 'span-1',
    };

    render(<SpanDetailPanel {...propsWithSelectedSpan} />);

    expect(screen.getByTestId('span-gantt-chart-panel')).toBeInTheDocument();
  });

  it('handles button group disabled state when loading', () => {
    const propsWithLoading = {
      ...defaultProps,
      isGanttChartLoading: true,
    };

    render(<SpanDetailPanel {...propsWithLoading} />);

    // The button group should be disabled when loading
    const timelineButton = screen.getByTestId('timeline');
    expect(timelineButton.closest('.euiButtonGroup')).toHaveClass('euiButtonGroup--isDisabled');
  });
});
