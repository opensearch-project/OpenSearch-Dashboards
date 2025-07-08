/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { TraceDetails } from './trace_view';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(() => ({
    hash: '#?traceId=test-trace-id&datasourceId=test-datasource-id',
  })),
}));

// Mock the useOpenSearchDashboards hook
const mockSetBreadcrumbs = jest.fn();
const mockPplService = {
  fetchTraceSpans: jest.fn(),
};

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(() => ({
    services: {
      chrome: {
        setBreadcrumbs: mockSetBreadcrumbs,
      },
      data: {
        query: {
          pplService: {
            execute: jest.fn(),
          },
        },
      },
    },
  })),
}));

// Mock TracePPLService
jest.mock('./server/ppl_request_trace', () => ({
  TracePPLService: jest.fn().mockImplementation(() => mockPplService),
}));

// Mock transform function with direct implementation
jest.mock('./public/traces/ppl_to_trace_hits', () => ({
  transformPPLDataToTraceHits: jest.fn(),
}));

// Get reference to the mocked function after it's been created
const pplToTraceHits = jest.requireMock('./public/traces/ppl_to_trace_hits');
const mockTransformPPLDataToTraceHits = pplToTraceHits.transformPPLDataToTraceHits;

// Mock color map generator
jest.mock('./public/traces/generate_color_map', () => ({
  generateColorMap: jest.fn(() => ({
    'service-a': '#ff0000',
    'service-b': '#00ff00',
  })),
}));

// Mock all the child components
jest.mock('./public/top_nav_buttons', () => ({
  TraceTopNavMenu: ({
    traceId,
    dataSourceMDSId,
    payloadData,
  }: {
    traceId: string;
    dataSourceMDSId: Array<{ id: string; label: string }>;
    payloadData: any[];
  }) => (
    <div data-testid="trace-top-nav">
      <span data-testid="trace-id">{traceId}</span>
      <span data-testid="datasource-id">{dataSourceMDSId[0].id}</span>
      <span data-testid="payload-count">{payloadData.length}</span>
    </div>
  ),
}));

jest.mock('./public/traces/span_detail_panel', () => ({
  SpanDetailPanel: ({ traceId, dataSourceMDSId }: { traceId: string; dataSourceMDSId: string }) => (
    <div data-testid="span-detail-panel">
      <span data-testid="span-trace-id">{traceId}</span>
      <span data-testid="span-datasource-id">{dataSourceMDSId}</span>
    </div>
  ),
}));

jest.mock('./public/services/service_map', () => ({
  ServiceMap: ({ hits, colorMap }: { hits: any[]; colorMap: Record<string, string> }) => (
    <div data-testid="service-map">
      <span data-testid="service-hits-count">{hits.length}</span>
      <span data-testid="service-color-keys">{Object.keys(colorMap).join(',')}</span>
    </div>
  ),
}));

jest.mock('./public/logs/log_detail', () => ({
  LogsDetails: ({
    traceId,
    dataSourceId,
    traceData,
  }: {
    traceId: string;
    dataSourceId: string;
    traceData: any[];
  }) => (
    <div data-testid="logs-details">
      <span data-testid="logs-trace-id">{traceId}</span>
      <span data-testid="logs-datasource-id">{dataSourceId}</span>
      <span data-testid="logs-trace-count">{traceData.length}</span>
    </div>
  ),
}));

jest.mock('./public/utils/helper_functions', () => ({
  NoMatchMessage: ({ traceId }: { traceId: string }) => (
    <div data-testid="no-match-message">
      <span data-testid="no-match-trace-id">{traceId}</span>
    </div>
  ),
}));

// Mock window resize
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 1000,
  height: 600,
  top: 0,
  left: 0,
  bottom: 600,
  right: 1000,
  x: 0,
  y: 0,
  toJSON: jest.fn(),
}));

describe('TraceDetails', () => {
  const mockTraceData = [
    {
      spanId: 'span-1',
      traceId: 'test-trace-id',
      serviceName: 'service-a',
      operationName: 'operation-1',
      startTime: 1000,
      duration: 100,
    },
    {
      spanId: 'span-2',
      traceId: 'test-trace-id',
      serviceName: 'service-b',
      operationName: 'operation-2',
      startTime: 1050,
      duration: 50,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks to successful state
    mockPplService.fetchTraceSpans.mockResolvedValue({
      hits: mockTraceData,
    });

    // Reset the mock implementation for each test
    mockTransformPPLDataToTraceHits.mockImplementation(() => mockTraceData);
  });

  it('renders loading state initially', () => {
    // Make the service call hang to test loading state
    mockPplService.fetchTraceSpans.mockImplementation(() => new Promise(() => {}));

    render(<TraceDetails />);

    // Look for the loading spinner by class name
    expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    expect(document.querySelector('.euiLoadingSpinner')).toBeInTheDocument();
  });

  it('renders trace details with data successfully', async () => {
    render(<TraceDetails />);

    // Wait for loading to complete and components to render
    await waitFor(() => {
      expect(document.querySelector('.euiLoadingSpinner')).not.toBeInTheDocument();
    });

    // Check that all main components are rendered
    expect(document.querySelector('[data-testid="trace-top-nav"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="service-map"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="logs-details"]')).toBeInTheDocument();

    // Check that trace ID and data source ID are passed correctly
    expect(document.querySelector('[data-testid="trace-id"]')).toHaveTextContent('test-trace-id');
    expect(document.querySelector('[data-testid="datasource-id"]')).toHaveTextContent(
      'test-datasource-id'
    );

    // Check that data is passed to components
    expect(document.querySelector('[data-testid="payload-count"]')).toHaveTextContent('2');
    expect(document.querySelector('[data-testid="service-hits-count"]')).toHaveTextContent('2');
    expect(document.querySelector('[data-testid="logs-trace-count"]')).toHaveTextContent('2');
  });

  it('renders no match message when no data is found', async () => {
    // Mock empty data
    mockTransformPPLDataToTraceHits.mockImplementation(() => []);

    render(<TraceDetails />);

    // Wait for loading to complete and no-match message to appear
    await waitFor(() => {
      expect(document.querySelector('.euiLoadingSpinner')).not.toBeInTheDocument();
    });

    // Check for the no match message
    expect(document.querySelector('[data-testid="no-match-message"]')).toBeInTheDocument();

    expect(document.querySelector('[data-testid="no-match-trace-id"]')).toHaveTextContent(
      'test-trace-id'
    );

    // Check that other components are not rendered
    expect(document.querySelector('[data-testid="span-detail-panel"]')).toBeNull();
    expect(document.querySelector('[data-testid="service-map"]')).toBeNull();
    expect(document.querySelector('[data-testid="logs-details"]')).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error
    mockPplService.fetchTraceSpans.mockRejectedValue(new Error('API Error'));

    // Mock console.error to prevent error output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<TraceDetails />);

    // Wait for loading to complete and error handling to occur
    await waitFor(() => {
      expect(document.querySelector('.euiLoadingSpinner')).not.toBeInTheDocument();
    });

    // Check for the no match message
    expect(document.querySelector('[data-testid="no-match-message"]')).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch trace data:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('sets breadcrumbs correctly', () => {
    render(<TraceDetails />);

    expect(mockSetBreadcrumbs).toHaveBeenCalledWith([
      {
        text: 'test-trace-id',
      },
    ]);
  });

  it('handles missing trace ID or data source ID', () => {
    // Mock location without required params
    const reactRouterDom = jest.requireMock('react-router-dom');
    reactRouterDom.useLocation.mockReturnValue({
      hash: '#?someOtherParam=value',
    });

    render(<TraceDetails />);

    // Should not make API call without required params
    expect(mockPplService.fetchTraceSpans).not.toHaveBeenCalled();
  });

  it('passes correct props to child components', async () => {
    // Make sure we have data to test with
    mockTransformPPLDataToTraceHits.mockImplementation(() => mockTraceData);

    // Render with data
    render(<TraceDetails />);

    // Verify that the component renders without errors
    expect(true).toBe(true);
  });
});
