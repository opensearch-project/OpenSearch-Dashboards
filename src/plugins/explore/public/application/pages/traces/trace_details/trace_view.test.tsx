/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { TraceDetails } from './trace_view';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';

// Mock useOpenSearchDashboards hook
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

// Mock useLocation to provide URL params
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    hash: '#?traceId=test-trace-id&datasourceId=test-datasource&indexPattern=test-index-*',
  }),
}));

// Mock the state management
jest.mock('./state/trace_app_state', () => ({
  createTraceAppState: ({ stateDefaults }: any) => ({
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
  }),
}));

// Mock the child components
jest.mock('./public/traces/span_detail_panel', () => ({
  SpanDetailPanel: ({ onSpanSelect, selectedSpanId, payloadData }: any) => (
    <div data-testid="span-detail-panel">
      <button onClick={() => onSpanSelect && onSpanSelect('test-span-id')}>Select Span</button>
      <div>Selected: {selectedSpanId || 'none'}</div>
      <div>Data count: {JSON.parse(payloadData || '[]').length}</div>
    </div>
  ),
}));

jest.mock('./public/traces/span_detail_sidebar', () => ({
  SpanDetailSidebar: ({ selectedSpan }: any) => (
    <div data-testid="span-detail-sidebar">
      <div>Span: {selectedSpan?.spanId || 'none'}</div>
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

jest.mock('./public/logs/log_detail', () => ({
  LogsDetails: ({ traceData }: any) => (
    <div data-testid="logs-details">
      <span data-testid="logs-trace-count">{traceData?.length || 0}</span>
    </div>
  ),
}));

// Mock TracePPLService
const mockPplService = {
  fetchTraceSpans: jest.fn(),
};

jest.mock('./server/ppl_request_trace', () => ({
  TracePPLService: jest.fn().mockImplementation(() => mockPplService),
}));

// Mock transform function
jest.mock('./public/traces/ppl_to_trace_hits', () => ({
  transformPPLDataToTraceHits: jest.fn(),
}));

const pplToTraceHits = jest.requireMock('./public/traces/ppl_to_trace_hits');
const mockTransformPPLDataToTraceHits = pplToTraceHits.transformPPLDataToTraceHits;

// Mock color map generator
jest.mock('./public/traces/generate_color_map', () => ({
  generateColorMap: jest.fn(() => ({
    'service-a': '#ff0000',
    'service-b': '#00ff00',
  })),
}));

// Mock NoMatchMessage
jest.mock('./public/utils/helper_functions', () => ({
  NoMatchMessage: ({ traceId }: any) => (
    <div data-testid="no-match-message">No data for trace: {traceId}</div>
  ),
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

  it('renders trace details component', async () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    // Wait for components to render
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

    // Wait for data to load and components to render
    await waitFor(() => {
      expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
      expect(document.querySelector('[data-testid="span-detail-sidebar"]')).toBeInTheDocument();
    });

    // Check for resizable container
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

    // Wait for loading state to appear
    await waitFor(() => {
      expect(document.querySelector('.euiLoadingSpinner')).toBeInTheDocument();
    });
  });

  it('handles empty data gracefully', async () => {
    // Mock empty data
    mockTransformPPLDataToTraceHits.mockImplementation(() => []);

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('[data-testid="no-match-message"]')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockPplService.fetchTraceSpans.mockRejectedValue(new Error('API Error'));

    // Mock console.error to prevent error output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TraceDetails />
      </Router>
    );

    // Wait for error handling
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

    // Wait for component to mount and set breadcrumbs
    await waitFor(() => {
      expect(mockChrome.setBreadcrumbs).toHaveBeenCalledWith([
        {
          text: 'test-trace-id',
        },
      ]);
    });
  });
});
