/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react';
import { TraceDetails } from './trace_view';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { getServiceInfo, NoMatchMessage } from './public/utils/helper_functions';

const mockChrome = {
  getIsNavDrawerLocked$: () => ({
    subscribe: jest.fn(),
  }),
};

const mockData = {
  query: {
    pplService: {
      execute: jest.fn(),
    },
  },
};

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      chrome: mockChrome,
      data: mockData,
      osdUrlStateStorage: {
        set: jest.fn(),
        get: jest.fn(),
        flush: jest.fn(),
        cancel: jest.fn(),
      },
      savedObjects: {
        client: {
          find: jest.fn(),
          get: jest.fn(),
        },
      },
      uiSettings: {
        get: jest.fn(),
      },
    },
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    hash:
      '#?traceId=test-trace-id&dataset={"id":"test-dataset-id","title":"test-index-*","type":"INDEX_PATTERN","timeFieldName":"endTime"}',
  }),
}));

jest.mock('./state/trace_app_state', () => ({
  createTraceAppState: jest.fn(({ stateDefaults }: any) => ({
    stateContainer: {
      get: () => ({
        ...stateDefaults,
        traceId: 'test-trace-id',
        dataset: {
          id: 'test-dataset-id',
          title: 'test-index-*',
          type: 'INDEX_PATTERN',
          timeFieldName: 'endTime',
        },
        spanId: undefined,
      }),
      set: jest.fn(),
      state$: {
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn(),
        })),
      },
      transitions: {
        setSpanId: jest.fn(),
        setTraceId: jest.fn(),
        setDataset: jest.fn(),
      },
    },
    stopStateSync: jest.fn(),
  })),
}));

jest.mock('./public/traces/span_detail_panel', () => ({
  SpanDetailPanel: ({ onSpanSelect, selectedSpanId, payloadData }: any) => (
    <div data-testid="span-detail-panel">
      <button onClick={() => onSpanSelect && onSpanSelect('test-span-id')}>Select Span</button>
      <div>Selected: {selectedSpanId || 'none'}</div>
      <div>Data count: {JSON.parse(payloadData || '[]').length}</div>
    </div>
  ),
}));

jest.mock('./public/traces/span_detail_tabs', () => ({
  SpanDetailTabs: ({ selectedSpan, addSpanFilter }: any) => (
    <div data-testid="span-detail-sidebar">
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
      <button
        onClick={() => addSpanFilter('spanId', selectedSpan.spanId)}
        data-test-subj="addSpanFilterButton"
      >
        Add span filter
      </button>
    </div>
  ),
}));

jest.mock('./public/traces/trace_detail_tabs', () => ({
  TraceDetailTabs: ({
    activeTab,
    setActiveTab,
    transformedHits,
    errorCount,
    setIsServiceLegendOpen,
    logDatasets,
    logCount,
    isLogsLoading,
  }: any) => (
    <div data-testid="trace-detail-tabs">
      <div data-testid="active-tab">{activeTab}</div>
      <div data-testid="hits-count">{transformedHits?.length || 0}</div>
      <div data-testid="error-count">{errorCount || 0}</div>
      <div data-testid="log-count">{logCount || 0}</div>
      <div data-testid="log-datasets-count">{logDatasets?.length || 0}</div>
      <div data-testid="logs-loading">{isLogsLoading ? 'true' : 'false'}</div>
      <button onClick={() => setActiveTab && setActiveTab('timeline')}>Timeline</button>
      <button onClick={() => setActiveTab && setActiveTab('span_list')}>Span list</button>
      <button onClick={() => setActiveTab && setActiveTab('tree_view')}>Tree view</button>
      <button onClick={() => setActiveTab && setActiveTab('service_map')}>Service map</button>
      <button onClick={() => setActiveTab && setActiveTab('logs')} data-testid="logs-tab-button">
        Logs
      </button>
      <button
        data-test-subj="openServiceLegendModalButton"
        onClick={() => setIsServiceLegendOpen(true)}
      >
        Open service legend
      </button>
    </div>
  ),
}));

jest.mock('./public/top_nav_buttons', () => ({
  TraceTopNavMenu: ({ traceId, title }: any) => (
    <div data-testid="trace-top-nav">
      <div data-test-subj="trace-details-title">{title}</div>
      <span data-testid="trace-id">{traceId || 'no-trace-id'}</span>
    </div>
  ),
}));

jest.mock('./public/services/service_map', () => ({
  ServiceMap: ({ hits }: any) => (
    <div data-testid="service-map">
      <span data-testid="service-hits-count">{hits?.length || 0}</span>
    </div>
  ),
}));

const mockPplService = {
  fetchTraceSpans: jest.fn(),
};

jest.mock('./server/ppl_request_trace', () => ({
  TracePPLService: jest.fn().mockImplementation(() => mockPplService),
}));

jest.mock('./public/traces/ppl_to_trace_hits', () => ({
  transformPPLDataToTraceHits: jest.fn(),
}));

const pplToTraceHits = jest.requireMock('./public/traces/ppl_to_trace_hits');
const mockTransformPPLDataToTraceHits = pplToTraceHits.transformPPLDataToTraceHits;

jest.mock('./public/traces/generate_color_map', () => ({
  generateColorMap: jest.fn(() => ({
    'service-a': '#ff0000',
    'service-b': '#00ff00',
  })),
}));

// Mock the correlation service
const mockCorrelationService = {
  checkCorrelationsAndFetchLogs: jest.fn().mockResolvedValue({
    logDatasets: [
      { id: 'log-dataset-1', title: 'app-logs-*', type: 'INDEX_PATTERN' },
      { id: 'log-dataset-2', title: 'error-logs-*', type: 'INDEX_PATTERN' },
    ],
    datasetLogs: {
      'log-dataset-1': [
        {
          _id: 'log1',
          _source: { message: 'Test log message 1', timestamp: '2023-01-01T00:00:00Z' },
        },
        {
          _id: 'log2',
          _source: { message: 'Test log message 2', timestamp: '2023-01-01T00:00:01Z' },
        },
      ],
      'log-dataset-2': [
        {
          _id: 'log3',
          _source: { message: 'Error log message', timestamp: '2023-01-01T00:00:02Z' },
        },
      ],
    },
    logHitCount: 3,
  }),
};

jest.mock('./public/logs/correlation_service', () => ({
  CorrelationService: jest.fn().mockImplementation(() => mockCorrelationService),
}));

// Mock the TraceLogsTab component
jest.mock('./public/logs/trace_logs_tab', () => ({
  TraceLogsTab: ({ traceId, logDatasets, datasetLogs, isLoading, onSpanClick }: any) => (
    <div data-testid="trace-logs-tab">
      <div data-testid="logs-trace-id">{traceId}</div>
      <div data-testid="logs-datasets-count">{logDatasets?.length || 0}</div>
      <div data-testid="logs-total-logs">
        {Object.values(datasetLogs || {}).reduce(
          (total: number, logs: any) => total + logs.length,
          0
        )}
      </div>
      <div data-testid="logs-loading-state">{isLoading ? 'loading' : 'loaded'}</div>
      <button
        onClick={() => onSpanClick && onSpanClick('test-span-from-logs')}
        data-testid="span-click-from-logs"
      >
        Click span from logs
      </button>
    </div>
  ),
}));

// Use the actual helper functions instead of mocking them

describe('TraceDetails', () => {
  const mockTraceData = [
    {
      spanId: 'span-1',
      traceId: 'test-trace-id',
      serviceName: 'service-a',
      name: 'operation-1',
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-01T00:00:01Z',
      startTimeUnixNano: '2023-01-01T00:00:00.000000000Z',
      endTimeUnixNano: '2023-01-01T00:00:01.000000000Z',
      durationInNanos: 1000000000,
      parentSpanId: '',
      status: { code: 0 },
    },
    {
      spanId: 'span-2',
      traceId: 'test-trace-id',
      serviceName: 'service-b',
      name: 'operation-2',
      startTime: '2023-01-01T00:00:01Z',
      endTime: '2023-01-01T00:00:02Z',
      startTimeUnixNano: '2023-01-01T00:00:01.000000000Z',
      endTimeUnixNano: '2023-01-01T00:00:02.000000000Z',
      durationInNanos: 1000000000,
      parentSpanId: 'span-1',
      status: { code: 0 },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPplService.fetchTraceSpans.mockResolvedValue({
      hits: mockTraceData,
    });
    mockTransformPPLDataToTraceHits.mockImplementation(() => mockTraceData);
  });

  it('handles color map generation errors', async () => {
    const generateColorMap = jest.requireMock('./public/traces/generate_color_map')
      .generateColorMap;
    generateColorMap.mockImplementation(() => {
      throw new Error('Color map generation failed');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles missing data service gracefully', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    });
  });

  it('renders trace details component', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    });
  });

  it('renders with trace data', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="span-detail-sidebar"]')).toBeInTheDocument();
    });

    const resizableContainer = document.querySelector('.euiResizableContainer');
    expect(resizableContainer).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    // Make the service call hang to test loading state
    mockPplService.fetchTraceSpans.mockImplementation(() => new Promise(() => {}));

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('.euiLoadingSpinner')).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    mockTransformPPLDataToTraceHits.mockImplementation(() => []);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('.euiCallOut')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockPplService.fetchTraceSpans.mockRejectedValue(new Error('API Error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('.euiLoadingSpinner')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles default dataset', async () => {
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;

    mockCreateTraceAppState.mockImplementationOnce(({ stateDefaults }: any) => ({
      stateContainer: {
        get: () => ({ ...stateDefaults, traceId: 'test-trace-id' }),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
      },
      stopStateSync: jest.fn(),
    }));

    const defaultDataset = {
      id: 'default-dataset-id',
      title: 'otel-v1-apm-span-*',
      type: 'INDEX_PATTERN',
      timeFieldName: 'endTime',
    };

    const history = createMemoryHistory();
    render(
      <Router history={history}>
        {/* @ts-expect-error TS2740 TODO(ts-error): fixme */}
        <TraceDetails defaultDataset={defaultDataset} />
      </Router>
    );

    expect(mockPplService.fetchTraceSpans).toHaveBeenCalledWith({
      traceId: 'test-trace-id',
      dataset: defaultDataset,
      filters: [],
      limit: 100,
    });
  });

  it('sets page title correctly', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    });

    expect(screen.getByTestId('trace-details-title')).toHaveTextContent('service-a: operation-1');
  });

  it('getServiceInfo function works correctly with span data', () => {
    const mockSpan = {
      serviceName: 'test-service',
      name: 'test-operation',
    };

    const result = getServiceInfo(mockSpan, 'test-trace-id');
    expect(result).toBe('test-service: test-operation');
  });

  it('getServiceInfo function uses span name as service fallback', () => {
    const mockSpan = {
      name: 'test-operation',
    };

    const result = getServiceInfo(mockSpan, 'test-trace-id');
    expect(result).toBe('test-operation: test-operation');
  });

  it('getServiceInfo function handles completely empty span', () => {
    const mockSpan = {};

    const result = getServiceInfo(mockSpan, 'test-trace-id');
    expect(result).toBe('Unknown Service: Unknown Operation');
  });

  it('getServiceInfo function handles missing operation name', () => {
    const mockSpan = {
      serviceName: 'test-service',
    };

    const result = getServiceInfo(mockSpan, 'test-trace-id');
    expect(result).toBe('test-service: Unknown Operation');
  });

  it('getServiceInfo function returns Unknown Trace when no span but has traceId', () => {
    const result = getServiceInfo(null, 'test-trace-id');
    expect(result).toBe('Unknown Trace');
  });

  it('getServiceInfo function returns empty string when no span and no traceId', () => {
    const result = getServiceInfo(null);
    expect(result).toBe('');
  });

  it('getServiceInfo function returns loading message when isLoading is true', () => {
    const result = getServiceInfo(null, undefined, true);
    expect(result).toBe('Loading trace...');
  });

  it('NoMatchMessage component renders correctly', () => {
    const testTraceId = 'test-trace-123';
    const { container } = render(<NoMatchMessage traceId={testTraceId} />);

    // Check that the actual NoMatchMessage component renders with EuiCallOut
    const callOut = container.querySelector('.euiCallOut');
    expect(callOut).toBeInTheDocument();

    // Check for the error styling
    expect(callOut).toHaveClass('euiCallOut--danger');

    // Check for the expected text content with trace ID
    expect(callOut).toHaveTextContent(`Error loading Trace Id: ${testTraceId}`);
    expect(callOut).toHaveTextContent('The Trace Id is invalid or could not be found');
  });

  it('sets page title for unknown trace', async () => {
    // Mock state container to return empty traceId and no data
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;
    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: 'no-trace-id', // Non-empty trace ID but no data
          dataset: {
            id: 'test-dataset-id',
            title: 'test-index-*',
            type: 'INDEX_PATTERN',
            timeFieldName: 'endTime',
          },
          spanId: undefined,
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: jest.fn(),
          setTraceId: jest.fn(),
          setDataset: jest.fn(),
        },
      },
      stopStateSync: jest.fn(),
    });

    // Mock empty data response
    mockTransformPPLDataToTraceHits.mockImplementation(() => []);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    });

    expect(screen.getByTestId('trace-details-title')).toHaveTextContent('Unknown Trace');
  });

  it('handles span filter updates', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
    });

    // Simulate filter update through SpanDetailSidebar
    const sidebar = document.querySelector('[data-testid="span-detail-sidebar"]');
    expect(sidebar).toBeInTheDocument();

    // Add filter
    fireEvent.click(screen.getByTestId('addSpanFilterButton'));
    expect(screen.getByText('spanId: span-1')).toBeInTheDocument();

    // Remove filter
    fireEvent.click(screen.getByLabelText('Remove filter'));
    expect(screen.queryByText('spanId: span-1')).not.toBeInTheDocument();
  });

  it('handles span filtering when no filters applied', async () => {
    mockTransformPPLDataToTraceHits.mockImplementation(() => mockTraceData);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
    });
  });

  it('handles span selection fallback to earliest span', async () => {
    const mockDataWithoutParent = [
      {
        spanId: 'span-1',
        traceId: 'test-trace-id',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: '2023-01-01T00:00:02Z', // Later start time
        parentSpanId: 'parent-1', // Has parent
        startTimeUnixNano: '2023-01-01T00:00:02.000000000Z',
        endTimeUnixNano: '2023-01-01T00:00:03.000000000Z',
      },
      {
        spanId: 'span-2',
        traceId: 'test-trace-id',
        serviceName: 'service-b',
        name: 'operation-2',
        startTime: '2023-01-01T00:00:01Z', // Earlier start time
        parentSpanId: 'parent-2', // Has parent
        startTimeUnixNano: '2023-01-01T00:00:01.000000000Z',
        endTimeUnixNano: '2023-01-01T00:00:02.000000000Z',
      },
    ];

    mockTransformPPLDataToTraceHits.mockImplementation(() => mockDataWithoutParent);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-sidebar"]')).toBeInTheDocument();
    });
  });

  it('filters spans without timestamp fields', async () => {
    const mockDataWithoutTimestamps = [
      {
        spanId: 'span-1',
        traceId: 'test-trace-id',
        serviceName: 'service-a',
        name: 'operation-1',
        startTime: '2023-01-01T00:00:00Z',
        endTime: null,
        startTimeUnixNano: '2023-01-01T00:00:00.000000000Z',
        endTimeUnixNano: null,
      },
      {
        spanId: 'span-2',
        traceId: 'test-trace-id',
        serviceName: 'service-b',
        name: 'operation-2',
        startTime: null,
        endTime: '2023-01-01T00:00:02Z',
        startTimeUnixNano: null,
        endTimeUnixNano: '2023-01-01T00:00:02.000000000Z',
      },
    ];

    mockTransformPPLDataToTraceHits.mockImplementation(() => mockDataWithoutTimestamps);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('.euiCallOut')).toBeInTheDocument();
    });
  });

  it('handles visualization resize trigger', async () => {
    const mockObserve = jest.fn();
    const mockDisconnect = jest.fn();
    let resizeCallback: any;
    const mockResizeObserver = jest.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      };
    });

    global.ResizeObserver = mockResizeObserver;

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
    });

    // Simulate resize event
    if (resizeCallback) {
      resizeCallback([{ target: document.createElement('div') }]);
    }

    // Wait for debounced resize
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  it('handles background loading state', async () => {
    // Mock initial data load
    mockPplService.fetchTraceSpans.mockResolvedValueOnce({
      hits: mockTraceData,
    });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
    });

    // Now mock a filter update that should trigger background loading
    mockPplService.fetchTraceSpans.mockImplementation(() => new Promise(() => {}));

    // Simulate filter change by re-rendering with different props
    const spanDetailSidebar = document.querySelector('[data-testid="span-detail-sidebar"]');
    expect(spanDetailSidebar).toBeInTheDocument();
  });

  it('handles span selection with specific spanId', async () => {
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;
    const mockSetSpanId = jest.fn();

    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: 'test-trace-id',
          dataset: {
            id: 'test-dataset-id',
            title: 'test-index-*',
            type: 'INDEX_PATTERN',
            timeFieldName: 'endTime',
          },
          spanId: 'span-1', // Specific span selected
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: mockSetSpanId,
          setTraceId: jest.fn(),
          setDataset: jest.fn(),
        },
      },
      stopStateSync: jest.fn(),
    });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-sidebar"]')).toBeInTheDocument();
    });

    // The selected span should be span-1 since it exists in mockTraceData
    const sidebar = document.querySelector('[data-testid="span-detail-sidebar"]');
    expect(sidebar).toHaveTextContent('Span: span-1');
  });

  it('handles span selection fallback when spanId not found', async () => {
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;
    const mockSetSpanId = jest.fn();

    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: 'test-trace-id',
          dataset: {
            id: 'test-dataset-id',
            title: 'test-index-*',
            type: 'INDEX_PATTERN',
            timeFieldName: 'endTime',
          },
          spanId: 'non-existent-span',
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: mockSetSpanId,
          setTraceId: jest.fn(),
          setDataset: jest.fn(),
        },
      },
      stopStateSync: jest.fn(),
    });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-sidebar"]')).toBeInTheDocument();
    });

    const sidebar = document.querySelector('[data-testid="span-detail-sidebar"]');
    expect(sidebar).toHaveTextContent('Span: span-1');
  });

  it('handles filter operations', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
    });

    const spanDetailSidebar = document.querySelector('[data-testid="span-detail-sidebar"]');
    expect(spanDetailSidebar).toBeInTheDocument();
  });

  it('handles tab switching', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-detail-tabs"]')).toBeInTheDocument();
    });

    // Test tab switching
    const timelineButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Timeline'
    );
    const spanListButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Span list'
    );
    const treeViewButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Tree view'
    );
    const serviceMapButton = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent === 'Service map'
    );

    if (timelineButton) fireEvent.click(timelineButton);
    if (spanListButton) fireEvent.click(spanListButton);
    if (treeViewButton) fireEvent.click(treeViewButton);
    if (serviceMapButton) fireEvent.click(serviceMapButton);

    expect(document.querySelector('[data-testid="trace-detail-tabs"]')).toBeInTheDocument();
  });

  it('handles state subscription changes', async () => {
    let stateSubscriptionCallback: any;
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;

    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: 'test-trace-id',
          dataset: {
            id: 'test-dataset-id',
            title: 'test-index-*',
            type: 'INDEX_PATTERN',
            timeFieldName: 'endTime',
          },
          spanId: undefined,
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn((callback) => {
            stateSubscriptionCallback = callback;
            return { unsubscribe: jest.fn() };
          }),
        },
        transitions: {
          setSpanId: jest.fn(),
          setTraceId: jest.fn(),
          setDataset: jest.fn(),
        },
      },
      stopStateSync: jest.fn(),
    });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    });

    if (stateSubscriptionCallback) {
      stateSubscriptionCallback({
        traceId: 'new-trace-id',
        dataset: {
          id: 'new-dataset-id',
          title: 'new-index-*',
          type: 'INDEX_PATTERN',
          timeFieldName: 'endTime',
        },
        spanId: 'new-span-id',
      });
    }

    expect(stateSubscriptionCallback).toBeDefined();
  });

  it('handles missing required parameters gracefully', async () => {
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;

    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: '', // Missing traceId
          dataset: {
            id: '',
            title: 'test-index-*',
            type: 'INDEX_PATTERN',
            timeFieldName: 'endTime',
          },
          spanId: undefined,
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: jest.fn(),
          setTraceId: jest.fn(),
          setDataset: jest.fn(),
        },
      },
      stopStateSync: jest.fn(),
    });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    // Should not call fetchTraceSpans when required params are missing
    expect(mockPplService.fetchTraceSpans).not.toHaveBeenCalled();
  });

  it('handles flyout case', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="span-detail-sidebar"]')).toBeInTheDocument();
    });

    const resizableContainer = document.querySelector('.euiResizableContainer');
    expect(resizableContainer).toBeInTheDocument();
  });

  it('renders logs tab with correlation service', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-detail-tabs"]')).toBeInTheDocument();
    });

    // Wait for correlation service to be called and logs to be fetched
    await waitFor(() => {
      expect(mockCorrelationService.checkCorrelationsAndFetchLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-dataset-id',
          title: 'test-index-*',
          type: 'INDEX_PATTERN',
          timeFieldName: 'endTime',
        }),
        mockData,
        'test-trace-id',
        10 // LOGS_DATA constant
      );
    });

    // Verify that the trace detail tabs component receives the log data
    const tabsComponent = document.querySelector('[data-testid="trace-detail-tabs"]');
    expect(tabsComponent).toBeInTheDocument();

    // Verify logs tab button is present
    const logsTabButton = document.querySelector('[data-testid="logs-tab-button"]');
    expect(logsTabButton).toBeInTheDocument();

    // Verify log data is passed to the tabs component
    expect(document.querySelector('[data-testid="log-count"]')).toHaveTextContent('3');
    expect(document.querySelector('[data-testid="log-datasets-count"]')).toHaveTextContent('2');
    expect(document.querySelector('[data-testid="logs-loading"]')).toHaveTextContent('false');

    // Click the logs tab to switch to logs view
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    fireEvent.click(logsTabButton);

    // Wait for the logs tab content to be rendered
    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-logs-tab"]')).toBeInTheDocument();
    });

    // Verify the TraceLogsTab component is rendered with correct data
    const logsTab = document.querySelector('[data-testid="trace-logs-tab"]');
    expect(logsTab).toBeInTheDocument();
    expect(document.querySelector('[data-testid="logs-trace-id"]')).toHaveTextContent(
      'test-trace-id'
    );
    expect(document.querySelector('[data-testid="logs-datasets-count"]')).toHaveTextContent('2');
    expect(document.querySelector('[data-testid="logs-total-logs"]')).toHaveTextContent('3');
    expect(document.querySelector('[data-testid="logs-loading-state"]')).toHaveTextContent(
      'loaded'
    );

    // Test span click functionality from logs
    const spanClickButton = document.querySelector('[data-testid="span-click-from-logs"]');
    expect(spanClickButton).toBeInTheDocument();
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    fireEvent.click(spanClickButton);

    // The logs functionality should be integrated into the component
    expect(mockCorrelationService.checkCorrelationsAndFetchLogs).toHaveBeenCalled();
  });

  it('displays "No span selected" message when traceId is undefined', async () => {
    // Mock state container to return empty/undefined traceId
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;
    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: '', // Empty traceId
          dataset: {
            id: 'test-dataset-id',
            title: 'test-index-*',
            type: 'INDEX_PATTERN',
            timeFieldName: 'endTime',
          },
          spanId: undefined,
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: jest.fn(),
          setTraceId: jest.fn(),
          setDataset: jest.fn(),
        },
      },
      stopStateSync: jest.fn(),
    });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    // Verify the "No span selected" message is displayed only in content (no header when no traceId)
    expect(screen.getByText('No span selected')).toBeInTheDocument();
    expect(screen.getByText('Please select a span to view details')).toBeInTheDocument();

    // Verify no header is rendered when traceId is empty
    expect(document.querySelector('[data-testid="trace-top-nav"]')).not.toBeInTheDocument();

    // Verify the message is in a panel
    const panel = document.querySelector('.euiPanel');
    expect(panel).toBeInTheDocument();

    // Verify that the PPL service is not called when traceId is empty
    expect(mockPplService.fetchTraceSpans).not.toHaveBeenCalled();

    // Verify that no other content (like span panels or tabs) is rendered
    expect(document.querySelector('[data-testid="span-detail-panel"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-testid="trace-detail-tabs"]')).not.toBeInTheDocument();
  });
});
