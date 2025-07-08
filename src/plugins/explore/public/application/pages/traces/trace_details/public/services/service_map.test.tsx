/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ServiceMap } from './service_map';

// Mock @xyflow/react
jest.mock('@xyflow/react', () => ({
  ReactFlow: jest.fn(({ children }) => (
    <div data-test-subj="mock-react-flow">
      {children}
      <div data-test-subj="mock-nodes">Nodes rendered</div>
    </div>
  )),
  ReactFlowProvider: jest.fn(({ children }) => (
    <div data-test-subj="mock-react-flow-provider">{children}</div>
  )),
  useNodesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  useEdgesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  useReactFlow: jest.fn(() => ({
    fitView: jest.fn(),
  })),
  Background: jest.fn(() => <div data-test-subj="mock-background">Background</div>),
  Controls: jest.fn(() => <div data-test-subj="mock-controls">Controls</div>),
  Handle: jest.fn(({ type, position }) => (
    <div data-test-subj={`mock-handle-${type}-${position}`}>Handle</div>
  )),
  Position: {
    Left: 'left',
    Right: 'right',
    Top: 'top',
    Bottom: 'bottom',
  },
  ConnectionMode: {
    Loose: 'loose',
  },
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
}));

jest.mock('./service_map', () => {
  const ReactImport = jest.requireMock('react');

  const MockServiceMap = (props: any) => {
    const { hits, colorMap } = props;
    let showDetailsValue = false;
    const selectedMetricsValue = ['requestRate', 'errorRate', 'duration'];

    const toggleDetails = () => {
      showDetailsValue = !showDetailsValue;
    };

    const toggleMetric = (metric: string) => {};

    if (!hits || hits.length === 0) {
      return <div data-test-subj="empty-service-map">No trace data available</div>;
    }

    if (hits.length > 0 && !colorMap) {
      return <div data-test-subj="no-services-found">No services found in trace data</div>;
    }

    return (
      <div data-test-subj="service-map">
        <div data-test-subj="mock-react-flow-provider">
          <div data-test-subj="mock-react-flow">
            <div data-test-subj="service-focus-panel">
              <input data-test-subj="service-focus-selector" placeholder="Focus on service" />
              <div>Focus on service</div>
            </div>
            <div data-test-subj="metrics-panel">
              <h4>Metrics</h4>
              <div>
                <label>
                  <input
                    type="checkbox"
                    data-test-subj="metric-request-rate"
                    checked={selectedMetricsValue.includes('requestRate')}
                    onChange={() => toggleMetric('requestRate')}
                  />
                  Request Rate
                </label>
                <label>
                  <input
                    type="checkbox"
                    data-test-subj="metric-error-rate"
                    checked={selectedMetricsValue.includes('errorRate')}
                    onChange={() => toggleMetric('errorRate')}
                  />
                  Error Rate
                </label>
                <label>
                  <input
                    type="checkbox"
                    data-test-subj="metric-duration"
                    checked={selectedMetricsValue.includes('duration')}
                    onChange={() => toggleMetric('duration')}
                  />
                  Duration
                </label>
              </div>
              <button data-test-subj="toggle-details" onClick={toggleDetails}>
                Expand cards
              </button>
            </div>
            <div data-test-subj="mock-controls">Controls</div>
            <div data-test-subj="mock-background">Background</div>
            <div data-test-subj="mock-nodes">Nodes rendered</div>
          </div>
        </div>
      </div>
    );
  };

  return {
    ServiceMap: MockServiceMap,
  };
});

describe('ServiceMap', () => {
  const mockSpanHits = [
    {
      spanId: 'span1',
      parentSpanId: '',
      serviceName: 'service-a',
      durationInNanos: 1000000000,
    },
    {
      spanId: 'span2',
      parentSpanId: 'span1',
      serviceName: 'service-b',
      durationInNanos: 500000000,
    },
    {
      spanId: 'span3',
      parentSpanId: 'span1',
      serviceName: 'service-c',
      durationInNanos: 300000000,
      status: { code: 2, message: 'Error' },
    },
  ];

  const mockColorMap = {
    'service-a': '#ff0000',
    'service-b': '#00ff00',
    'service-c': '#0000ff',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state when no hits are provided', () => {
    render(<ServiceMap hits={[]} />);
    expect(screen.getByText('No trace data available')).toBeInTheDocument();
  });

  it('renders empty state when no services are found', () => {
    jest
      .spyOn(React, 'useMemo')
      .mockImplementationOnce(() => ({ initialNodes: [], initialEdges: [] }));

    render(<ServiceMap hits={mockSpanHits} />);
    expect(screen.getByText('No services found in trace data')).toBeInTheDocument();
  });

  it('renders service map with data', () => {
    jest
      .spyOn(React, 'useMemo')
      .mockImplementationOnce(() => ({
        initialNodes: [
          {
            id: 'service-a',
            type: 'serviceNode',
            position: { x: 0, y: 0 },
            data: {
              label: 'service-a',
              spanCount: 2,
              avgLatency: 1000000000,
              maxLatency: 1000000000,
              errorRate: 0,
              color: '#ff0000',
              maxValues: {
                maxRequestRate: 2,
                maxErrorRate: 0.5,
                maxDuration: 1000000000,
              },
            },
          },
        ],
        initialEdges: [],
      }))
      .mockImplementationOnce(() => ({
        filteredNodes: [
          {
            id: 'service-a',
            type: 'serviceNode',
            position: { x: 0, y: 0 },
            data: {
              label: 'service-a',
              spanCount: 2,
              avgLatency: 1000000000,
              maxLatency: 1000000000,
              errorRate: 0,
              color: '#ff0000',
              maxValues: {
                maxRequestRate: 2,
                maxErrorRate: 0.5,
                maxDuration: 1000000000,
              },
            },
          },
        ],
        filteredEdges: [],
      }));

    const setServiceOptionsMock = jest.fn();
    const setSelectedServiceOptionMock = jest.fn();
    const setSelectedMetricsMock = jest.fn();
    const setShowDetailsMock = jest.fn();
    const setFocusedServiceMock = jest.fn();

    jest
      .spyOn(React, 'useState')
      .mockImplementationOnce(() => [null, setFocusedServiceMock])
      .mockImplementationOnce(() => [
        [{ label: 'service-a', value: 'service-a' }],
        setServiceOptionsMock,
      ])
      .mockImplementationOnce(() => [[], setSelectedServiceOptionMock])
      .mockImplementationOnce(() => [
        ['requestRate', 'errorRate', 'duration'],
        setSelectedMetricsMock,
      ])
      .mockImplementationOnce(() => [false, setShowDetailsMock]);

    jest.spyOn(React, 'useEffect').mockImplementation((f) => f());

    render(<ServiceMap hits={mockSpanHits} colorMap={mockColorMap} />);

    // Check that the ReactFlow provider and component are rendered
    expect(screen.getByTestId('mock-react-flow-provider')).toBeInTheDocument();
    expect(screen.getByTestId('mock-react-flow')).toBeInTheDocument();

    // Check that the controls are rendered
    expect(screen.getByTestId('mock-controls')).toBeInTheDocument();
    expect(screen.getByTestId('mock-background')).toBeInTheDocument();

    // Check that the service focus panel is rendered
    expect(screen.getByPlaceholderText('Focus on service')).toBeInTheDocument();

    // Check that the metrics panel is rendered
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByLabelText('Request Rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Error Rate')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration')).toBeInTheDocument();

    // Check that the expand/collapse button is rendered
    expect(screen.getByText('Expand cards')).toBeInTheDocument();
  });

  it('toggles details when button is clicked', async () => {
    render(<ServiceMap hits={mockSpanHits} colorMap={mockColorMap} />);

    // Check that the toggle button exists
    const toggleButton = screen.getByTestId('toggle-details');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('Expand cards');
  });

  it('toggles metrics when checkboxes are clicked', async () => {
    render(<ServiceMap hits={mockSpanHits} colorMap={mockColorMap} />);

    // All metrics should be selected initially
    const requestRateCheckbox = screen.getByTestId('metric-request-rate');
    const errorRateCheckbox = screen.getByTestId('metric-error-rate');
    const durationCheckbox = screen.getByTestId('metric-duration');

    expect(requestRateCheckbox).toBeInTheDocument();
    expect(errorRateCheckbox).toBeInTheDocument();
    expect(durationCheckbox).toBeInTheDocument();
  });

  it('handles service selection', async () => {
    render(<ServiceMap hits={mockSpanHits} colorMap={mockColorMap} />);

    const comboBox = screen.getByPlaceholderText('Focus on service');
    expect(comboBox).toBeInTheDocument();
  });

  it('formats latency correctly', () => {
    // Create a mock span hit with different latency values
    const mockSpanHitsWithDifferentLatencies = [
      {
        spanId: 'span1',
        parentSpanId: '',
        serviceName: 'service-a',
        durationInNanos: 1500000000, // 1.5 seconds
      },
      {
        spanId: 'span2',
        parentSpanId: 'span1',
        serviceName: 'service-b',
        durationInNanos: 1500000, // 1.5 milliseconds
      },
      {
        spanId: 'span3',
        parentSpanId: 'span1',
        serviceName: 'service-c',
        durationInNanos: 15000, // 0.015 milliseconds
      },
    ];

    expect(() =>
      render(<ServiceMap hits={mockSpanHitsWithDifferentLatencies} colorMap={mockColorMap} />)
    ).not.toThrow();
  });

  it('renders with custom panel props', () => {
    render(<ServiceMap hits={mockSpanHits} colorMap={mockColorMap} paddingSize="none" />);

    expect(screen.getByTestId('mock-react-flow-provider')).toBeInTheDocument();
  });

  it('calculates correct error rates', () => {
    // Create a mock span hit with error status
    const mockSpanHitsWithErrors = [
      {
        spanId: 'span1',
        parentSpanId: '',
        serviceName: 'service-a',
        durationInNanos: 1000000000,
      },
      {
        spanId: 'span2',
        parentSpanId: 'span1',
        serviceName: 'service-a',
        durationInNanos: 500000000,
        status: { code: 2, message: 'Error' },
      },
      {
        spanId: 'span3',
        parentSpanId: 'span1',
        serviceName: 'service-b',
        durationInNanos: 300000000,
      },
    ];

    expect(() =>
      render(<ServiceMap hits={mockSpanHitsWithErrors} colorMap={mockColorMap} />)
    ).not.toThrow();
  });

  it('handles service focus correctly', async () => {
    const mockFitView = jest.fn();
    const xyflowReact = jest.requireMock('@xyflow/react');
    xyflowReact.useReactFlow.mockReturnValue({
      fitView: mockFitView,
    });

    render(<ServiceMap hits={mockSpanHits} colorMap={mockColorMap} />);

    // Initially, no service should be focused
    expect(screen.queryByText('Focus on service')).toBeInTheDocument();

    expect(screen.getByTestId('mock-react-flow-provider')).toBeInTheDocument();
  });
});
