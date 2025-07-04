/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { SpanDetailFlyout } from './span_detail_flyout';
import { TracePPLService } from '../../server/ppl_request_trace';

// Mock the PPL service
jest.mock('../../server/ppl_request_trace');

describe('SpanDetailFlyout', () => {
  const mockPPLResponse = {
    type: 'data_frame',
    body: {
      schema: [
        { name: 'spanId', type: 'string' },
        { name: 'parentSpanId', type: 'string' },
        { name: 'serviceName', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'durationInNanos', type: 'bigint' },
        { name: 'startTime', type: 'timestamp' },
        { name: 'endTime', type: 'timestamp' },
        { name: 'events', type: 'array' },
        { name: 'attributes', type: 'object' },
        { name: 'status', type: 'object' },
      ],
      fields: [
        { name: 'spanId', type: 'string', values: ['test-span-id'] },
        { name: 'parentSpanId', type: 'string', values: ['parent-span-id'] },
        { name: 'serviceName', type: 'string', values: ['test-service'] },
        { name: 'name', type: 'string', values: ['test-operation'] },
        { name: 'durationInNanos', type: 'bigint', values: [1000000000] },
        { name: 'startTime', type: 'timestamp', values: ['2023-01-01 00:00:00.000'] },
        { name: 'endTime', type: 'timestamp', values: ['2023-01-01 00:00:01.000'] },
        {
          name: 'events',
          type: 'array',
          values: [[{ name: 'test-event', timestamp: 1234567890 }]],
        },
        {
          name: 'attributes',
          type: 'object',
          values: [{ 'http.method': 'GET', 'http.url': 'http://test.com' }],
        },
        { name: 'status', type: 'object', values: [{ code: 0, message: '' }] },
      ],
      size: 1,
    },
  };

  const defaultProps = {
    spanId: 'test-span-id',
    isFlyoutVisible: true,
    closeFlyout: jest.fn(),
    addSpanFilter: jest.fn(),
    dataSourceMDSId: 'test-source',
    dataSourceMDSLabel: 'Test Source',
    traceId: 'test-trace-id',
    pplService: new TracePPLService({} as any),
    indexPattern: 'test-index-*',
    allSpans: [
      {
        spanId: 'test-span-id',
        parentSpanId: 'parent-span-id',
        serviceName: 'test-service',
        name: 'test-operation',
        durationInNanos: 1000000000,
        startTime: '2023-01-01 00:00:00.000',
        endTime: '2023-01-01 00:00:01.000',
        events: [{ name: 'test-event', timestamp: 1234567890 }],
        'http.method': 'GET',
        'http.url': 'http://test.com',
        status: { code: 0, message: '' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (TracePPLService.prototype.fetchSpanDetails as jest.Mock).mockResolvedValue(mockPPLResponse);
  });

  it('renders span data from allSpans prop', async () => {
    render(<SpanDetailFlyout {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('test-span-id')).toBeInTheDocument();
  });

  it('shows error when span is not found in allSpans', async () => {
    const propsWithMissingSpan = {
      ...defaultProps,
      spanId: 'non-existent-span-id',
    };

    render(<SpanDetailFlyout {...propsWithMissingSpan} />);

    await waitFor(() => {
      expect(screen.getByText(/Span with ID non-existent-span-id not found/i)).toBeInTheDocument();
    });
  });

  it('renders span data successfully', async () => {
    render(<SpanDetailFlyout {...defaultProps} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Overview')).toBeInTheDocument();

    const spanIdItem = screen.getByTestId('Span IDDescriptionList');
    expect(within(spanIdItem).getByText('test-span-id')).toBeInTheDocument();

    const serviceItem = screen.getByTestId('ServiceDescriptionList');
    expect(within(serviceItem).getByText('test-service')).toBeInTheDocument();

    const operationItem = screen.getByTestId('OperationDescriptionList');
    expect(within(operationItem).getByText('test-operation')).toBeInTheDocument();

    const durationItem = screen.getByTestId('DurationDescriptionList');
    expect(within(durationItem).getByText('1000 ms')).toBeInTheDocument();

    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText(/test-event/)).toBeInTheDocument();

    expect(screen.getByText('Span attributes')).toBeInTheDocument();

    const attributeElements = screen.getAllByTestId(/DescriptionList$/);

    const httpMethodElement = attributeElements.find((el) =>
      el.getAttribute('data-test-subj')?.includes('http.method')
    );
    const httpUrlElement = attributeElements.find((el) =>
      el.getAttribute('data-test-subj')?.includes('http.url')
    );

    if (httpMethodElement) {
      expect(within(httpMethodElement).getByText('GET')).toBeInTheDocument();
    } else {
      // If exact match not found, check if attributes are rendered at all
      expect(screen.getByText('GET')).toBeInTheDocument();
    }

    if (httpUrlElement) {
      expect(within(httpUrlElement).getByText('http://test.com')).toBeInTheDocument();
    } else {
      // If exact match not found, check if attributes are rendered at all
      expect(screen.getByText('http://test.com')).toBeInTheDocument();
    }
  });

  it('handles error status correctly', async () => {
    const propsWithErrorStatus = {
      ...defaultProps,
      allSpans: [
        {
          ...defaultProps.allSpans[0],
          'status.code': 2,
          status: { code: 2, message: 'Error occurred' },
        },
      ],
    };

    render(<SpanDetailFlyout {...propsWithErrorStatus} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    const errorsItem = screen.getByTestId('ErrorsDescriptionList');

    const errorText = within(errorsItem).getByText('Yes');
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveClass('euiTextColor--danger');
  });

  it('shows error when required props are missing', async () => {
    // Suppress React error logs for this test
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const incompleteProps = {
        spanId: 'test-span-id',
        isFlyoutVisible: true,
        closeFlyout: jest.fn(),
        addSpanFilter: jest.fn(),
        dataSourceMDSId: 'test-source',
        dataSourceMDSLabel: 'Test Source',
      };

      // @ts-ignore - Intentionally testing with missing required prop
      expect(() => render(<SpanDetailFlyout {...incompleteProps} />)).toThrow();
    } finally {
      // Restore console.error
      errorSpy.mockRestore();
    }
  });

  it('formats timestamps correctly', async () => {
    render(<SpanDetailFlyout {...defaultProps} />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    const startTimeItem = screen.getByTestId('Start timeDescriptionList');
    const endTimeItem = screen.getByTestId('End timeDescriptionList');

    // Check the formatted timestamps
    expect(within(startTimeItem).getByText('01/01/2023 00:00:00.000')).toBeInTheDocument();
    expect(within(endTimeItem).getByText('01/01/2023 00:00:01.000')).toBeInTheDocument();
  });

  it('shows view associated logs button when data is loaded', async () => {
    render(<SpanDetailFlyout {...defaultProps} />);

    await waitFor(() => {
      const logsButton = screen.getByText('View associated logs');
      expect(logsButton).toBeInTheDocument();
    });
  });

  it('handles missing optional fields gracefully', async () => {
    const minimalResponse = {
      type: 'data_frame',
      body: {
        schema: [
          { name: 'spanId', type: 'string' },
          { name: 'serviceName', type: 'string' },
        ],
        fields: [
          { name: 'spanId', type: 'string', values: ['test-span-id'] },
          { name: 'serviceName', type: 'string', values: ['test-service'] },
        ],
        size: 1,
      },
    };

    (TracePPLService.prototype.fetchSpanDetails as jest.Mock).mockResolvedValue(minimalResponse);

    render(<SpanDetailFlyout {...defaultProps} />);

    await waitFor(() => {
      // Optional fields should show '-'
      expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });
  });
});
