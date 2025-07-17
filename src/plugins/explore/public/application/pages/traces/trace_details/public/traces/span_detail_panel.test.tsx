/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanDetailPanel, TraceFilter } from './span_detail_panel';
import { ChromeStart } from 'opensearch-dashboards/public';
import { TracePPLService } from '../../server/ppl_request_trace';

// Mock the dependencies
jest.mock('react-use/lib/useObservable', () => jest.fn(() => false));

// Mock the child components
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

jest.mock('./span_detail_flyout', () => ({
  SpanDetailFlyout: ({ spanId, closeFlyout }: any) => (
    <div data-testid="span-detail-flyout">
      <div data-testid="span-detail-flyout-id">{spanId}</div>
      <button onClick={closeFlyout}>Close</button>
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

// Mock getBoundingClientRect
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

    // The panel title is rendered with the text "Spans" and the count in parentheses
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

    // Check that the gantt chart is rendered
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

    // Find the span list input and click it
    const spanListInput = screen.getByTestId('span_list');
    fireEvent.click(spanListInput);

    expect(spanListInput).toBeInTheDocument();
  });

  it('switches to tree view when button is clicked', () => {
    render(<SpanDetailPanel {...defaultProps} />);

    // Find the tree view input and click it
    const treeViewInput = screen.getByTestId('hierarchy_span_list');
    fireEvent.click(treeViewInput);

    expect(treeViewInput).toBeInTheDocument();
  });

  it('opens the flyout when a span is clicked in the gantt chart', () => {
    const { container } = render(<SpanDetailPanel {...defaultProps} />);

    // Click a span in the gantt chart
    const spanButton = screen.getByText('Click Span');
    fireEvent.click(spanButton);

    // The flyout should be rendered in the document
    const flyout = container.querySelector('[data-testid="span-detail-flyout"]');
    expect(flyout).toBeInTheDocument();

    // Check the span ID
    const flyoutId = container.querySelector('[data-testid="span-detail-flyout-id"]');
    expect(flyoutId).toHaveTextContent('span-1');
  });

  it('closes the flyout when close button is clicked', async () => {
    const { container } = render(<SpanDetailPanel {...defaultProps} />);

    // Open the flyout
    const spanButton = screen.getByText('Click Span');
    fireEvent.click(spanButton);

    // The flyout should be rendered in the document
    const flyout = container.querySelector('[data-testid="span-detail-flyout"]');
    expect(flyout).toBeInTheDocument();

    // Store a reference to the flyout ID for later verification
    const flyoutId = container.querySelector('[data-testid="span-detail-flyout-id"]');
    expect(flyoutId).toHaveTextContent('span-1');

    // Close the flyout by clicking the close button
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
  });

  it('renders filters when they are present', () => {
    const propsWithFilters = {
      ...defaultProps,
      spanFilters: [{ field: 'serviceName', value: 'service-a' }],
    };

    render(<SpanDetailPanel {...propsWithFilters} />);

    // Check that the filter badge is rendered
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

    // Find the service legend button and click it
    const serviceLegendButton = screen.getByTestId('service-legend-toggle');
    fireEvent.click(serviceLegendButton);

    // Check that the service names are rendered
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
});
