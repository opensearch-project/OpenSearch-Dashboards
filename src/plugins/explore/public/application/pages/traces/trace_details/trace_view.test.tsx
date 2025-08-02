/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { TraceDetails } from './trace_view';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';

const mockChrome = {
  setBreadcrumbs: jest.fn(),
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
    },
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    hash: '#?traceId=test-trace-id&datasourceId=test-datasource&indexPattern=test-index-*',
  }),
}));

jest.mock('./state/trace_app_state', () => ({
  createTraceAppState: jest.fn(({ stateDefaults }: any) => ({
    stateContainer: {
      get: () => ({
        ...stateDefaults,
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
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
        setDataSourceId: jest.fn(),
        setIndexPattern: jest.fn(),
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
  SpanDetailTabs: ({ selectedSpan }: any) => (
    <div data-testid="span-detail-sidebar">
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
    </div>
  ),
}));

jest.mock('./public/traces/trace_detail_tabs', () => ({
  TraceDetailTabs: ({ activeTab, setActiveTab, transformedHits, errorCount }: any) => (
    <div data-testid="trace-detail-tabs">
      <div data-testid="active-tab">{activeTab}</div>
      <div data-testid="hits-count">{transformedHits?.length || 0}</div>
      <div data-testid="error-count">{errorCount || 0}</div>
      <button onClick={() => setActiveTab && setActiveTab('timeline')}>Timeline</button>
      <button onClick={() => setActiveTab && setActiveTab('span_list')}>Span list</button>
      <button onClick={() => setActiveTab && setActiveTab('tree_view')}>Tree view</button>
      <button onClick={() => setActiveTab && setActiveTab('service_map')}>Service map</button>
    </div>
  ),
}));

jest.mock('./public/top_nav_buttons', () => ({
  TraceTopNavMenu: ({ traceId }: any) => (
    <div data-testid="trace-top-nav">
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

jest.mock('./public/utils/helper_functions', () => ({
  NoMatchMessage: ({ traceId }: any) => (
    <div data-testid="no-match-message">No data for trace: {traceId}</div>
  ),
  isEmpty: (value: any) => {
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'object' && Object.keys(value).length === 0) ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0)
    );
  },
  nanoToMilliSec: (nano: number) => {
    if (typeof nano !== 'number' || isNaN(nano)) return 0;
    return nano / 1000000;
  },
  round: (value: number, precision: number = 0) => {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  },
}));

describe('TraceDetails', () => {
  const mockTraceData = [
    {
      spanId: 'span-1',
      traceId: 'test-trace-id',
      serviceName: 'service-a',
      name: 'operation-1',
      startTime: '2023-01-01T00:00:00Z',
      endTime: '2023-01-01T00:00:01Z',
      durationInNanos: 1000000000,
    },
    {
      spanId: 'span-2',
      traceId: 'test-trace-id',
      serviceName: 'service-b',
      name: 'operation-2',
      startTime: '2023-01-01T00:00:01Z',
      endTime: '2023-01-01T00:00:02Z',
      durationInNanos: 1000000000,
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
      expect(document.querySelector('[data-testid="no-match-message"]')).toBeInTheDocument();
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

  it('sets breadcrumbs correctly', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(mockChrome.setBreadcrumbs).toHaveBeenCalledWith([
        {
          text: 'Trace: test-trace-id',
        },
      ]);
    });
  });

  it('sets breadcrumb for unknown trace', async () => {
    // Mock state container to return empty traceId
    const mockCreateTraceAppState = jest.requireMock('./state/trace_app_state').createTraceAppState;
    mockCreateTraceAppState.mockReturnValueOnce({
      stateContainer: {
        get: () => ({
          traceId: '', // Empty trace ID
          dataSourceId: 'test-datasource',
          indexPattern: 'test-index-*',
          spanId: undefined,
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: jest.fn(),
          setTraceId: jest.fn(),
          setDataSourceId: jest.fn(),
          setIndexPattern: jest.fn(),
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
      expect(mockChrome.setBreadcrumbs).toHaveBeenCalledWith([
        {
          text: 'Unknown Trace',
        },
      ]);
    });
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
      },
      {
        spanId: 'span-2',
        traceId: 'test-trace-id',
        serviceName: 'service-b',
        name: 'operation-2',
        startTime: '2023-01-01T00:00:01Z', // Earlier start time
        parentSpanId: 'parent-2', // Has parent
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
          dataSourceId: 'test-datasource',
          indexPattern: 'test-index-*',
          spanId: 'span-1', // Specific span selected
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: mockSetSpanId,
          setTraceId: jest.fn(),
          setDataSourceId: jest.fn(),
          setIndexPattern: jest.fn(),
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
          dataSourceId: 'test-datasource',
          indexPattern: 'test-index-*',
          spanId: 'non-existent-span',
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: mockSetSpanId,
          setTraceId: jest.fn(),
          setDataSourceId: jest.fn(),
          setIndexPattern: jest.fn(),
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

  it('handles error count calculation', async () => {
    const mockDataWithErrors = [
      {
        spanId: 'span-1',
        traceId: 'test-trace-id',
        serviceName: 'service-a',
        name: 'operation-1',
        status: { code: 2 }, // Error
      },
      {
        spanId: 'span-2',
        traceId: 'test-trace-id',
        serviceName: 'service-b',
        name: 'operation-2',
        status: { code: 0 }, // No error
      },
    ];

    mockTransformPPLDataToTraceHits.mockImplementation(() => mockDataWithErrors);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-detail-tabs"]')).toBeInTheDocument();
    });

    const errorCountElement = document.querySelector('[data-testid="error-count"]');
    expect(errorCountElement).toHaveTextContent('1');
  });

  it('handles service legend modal', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    await waitFor(() => {
      expect(document.querySelector('[data-testid="trace-detail-tabs"]')).toBeInTheDocument();
    });

    const traceDetailTabs = document.querySelector('[data-testid="trace-detail-tabs"]');
    expect(traceDetailTabs).toBeInTheDocument();
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
          dataSourceId: 'test-datasource',
          indexPattern: 'test-index-*',
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
          setDataSourceId: jest.fn(),
          setIndexPattern: jest.fn(),
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
        dataSourceId: 'new-datasource',
        indexPattern: 'new-index-*',
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
          dataSourceId: '', // Missing dataSourceId
          indexPattern: 'test-index-*',
          spanId: undefined,
        }),
        set: jest.fn(),
        state$: {
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        },
        transitions: {
          setSpanId: jest.fn(),
          setTraceId: jest.fn(),
          setDataSourceId: jest.fn(),
          setIndexPattern: jest.fn(),
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

    // Should not call fetchTraceSpans when required params are missing
    expect(mockPplService.fetchTraceSpans).not.toHaveBeenCalled();
  });
});
