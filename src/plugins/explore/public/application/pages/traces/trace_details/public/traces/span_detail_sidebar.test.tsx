/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { SpanDetailSidebar } from './span_detail_sidebar';

describe('SpanDetailSidebar', () => {
  const mockSpan = {
    spanId: 'test-span-id',
    parentSpanId: 'parent-span-id',
    serviceName: 'test-service',
    name: 'test-operation',
    durationInNanos: 1000000000,
    startTime: '2023-01-01T00:00:00.000Z',
    endTime: '2023-01-01T00:00:01.000Z',
    events: [{ name: 'test-event', timestamp: 1234567890 }],
    'http.method': 'GET',
    'http.url': 'http://test.com',
    'status.code': 0,
    traceId: 'test-trace-id',
    traceGroup: 'test-trace-group',
  };

  const defaultProps = {
    selectedSpan: mockSpan,
    addSpanFilter: jest.fn(),
    serviceName: 'test-service',
    setCurrentSpan: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders span detail sidebar with span data', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    expect(screen.getByText('Span details')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();

    expect(screen.getByText('test-span-id')).toBeInTheDocument();

    expect(screen.getByText('test-service')).toBeInTheDocument();

    expect(screen.getByText('test-operation')).toBeInTheDocument();

    expect(screen.getByText('1000 ms')).toBeInTheDocument();
  });

  it('renders header but no content when no span is selected', () => {
    const propsWithoutSpan = {
      ...defaultProps,
      selectedSpan: undefined,
    };

    render(<SpanDetailSidebar {...propsWithoutSpan} />);

    expect(screen.getByText('Span details')).toBeInTheDocument();

    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('renders header but no content when span is empty object', () => {
    const propsWithEmptySpan = {
      ...defaultProps,
      selectedSpan: {},
    };

    render(<SpanDetailSidebar {...propsWithEmptySpan} />);

    expect(screen.getByText('Span details')).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('calls setCurrentSpan when back button is clicked', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(defaultProps.setCurrentSpan).toHaveBeenCalledWith('');
  });

  it('does not render back button when serviceName is not provided', () => {
    const propsWithoutServiceName = {
      ...defaultProps,
      serviceName: undefined,
    };

    render(<SpanDetailSidebar {...propsWithoutServiceName} />);

    expect(screen.queryByText('Back')).not.toBeInTheDocument();
  });

  it('renders span attributes section', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    expect(screen.getByText('Span attributes')).toBeInTheDocument();

    // Check for HTTP method attribute
    expect(screen.getByText('http.method')).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();

    // Check for HTTP URL attribute
    expect(screen.getByText('http.url')).toBeInTheDocument();
    expect(screen.getByText('http://test.com')).toBeInTheDocument();
  });

  it('renders events section when events are present', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    expect(screen.getByText('Event')).toBeInTheDocument();

    // Check that events are rendered as JSON
    const eventJson = screen.getByText(/"name": "test-event"/);
    expect(eventJson).toBeInTheDocument();
  });

  it('does not render events section when no events', () => {
    const spanWithoutEvents = {
      ...mockSpan,
      events: [],
    };

    const propsWithoutEvents = {
      ...defaultProps,
      selectedSpan: spanWithoutEvents,
    };

    render(<SpanDetailSidebar {...propsWithoutEvents} />);

    expect(screen.queryByText('Event')).not.toBeInTheDocument();
  });

  it('handles error status correctly', () => {
    const spanWithError = {
      ...mockSpan,
      'status.code': 2,
    };

    const propsWithError = {
      ...defaultProps,
      selectedSpan: spanWithError,
    };

    render(<SpanDetailSidebar {...propsWithError} />);

    const errorText = screen.getByText('Yes');
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveClass('euiTextColor--danger');
  });

  it('handles non-error status correctly', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('renders copy buttons for span ID and parent span ID', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    const copyButtons = screen.getAllByLabelText('copy-button');
    expect(copyButtons).toHaveLength(2); // One for span ID, one for parent span ID
  });

  it('renders parent span ID when present', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    expect(screen.getByText('Parent span ID')).toBeInTheDocument();
    expect(screen.getByText('parent-span-id')).toBeInTheDocument();
  });

  it('renders dash for missing parent span ID', () => {
    const spanWithoutParent = {
      ...mockSpan,
      parentSpanId: undefined,
    };

    const propsWithoutParent = {
      ...defaultProps,
      selectedSpan: spanWithoutParent,
    };

    render(<SpanDetailSidebar {...propsWithoutParent} />);

    // Look for the dash in the parent span ID section
    const parentSpanSection = screen.getByTestId('Parent span IDDescriptionList');
    expect(within(parentSpanSection).getByText('-')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    // Check that Start time and End time sections exist
    expect(screen.getByText('Start time')).toBeInTheDocument();
    expect(screen.getByText('End time')).toBeInTheDocument();

    const startTimeSection = screen.getByTestId('Start timeDescriptionList');
    const endTimeSection = screen.getByTestId('End timeDescriptionList');

    expect(startTimeSection).toBeInTheDocument();
    expect(endTimeSection).toBeInTheDocument();
  });

  it('renders dash for missing timestamps', () => {
    const spanWithoutTimes = {
      ...mockSpan,
      startTime: undefined,
      endTime: undefined,
    };

    const propsWithoutTimes = {
      ...defaultProps,
      selectedSpan: spanWithoutTimes,
    };

    render(<SpanDetailSidebar {...propsWithoutTimes} />);

    const startTimeSection = screen.getByTestId('Start timeDescriptionList');
    const endTimeSection = screen.getByTestId('End timeDescriptionList');

    expect(within(startTimeSection).getByText('-')).toBeInTheDocument();
    expect(within(endTimeSection).getByText('-')).toBeInTheDocument();
  });

  it('calls addSpanFilter when filter button is clicked', () => {
    render(<SpanDetailSidebar {...defaultProps} />);

    // Hover over a span attribute to show the filter button
    const httpMethodSection = screen.getByTestId('http.methodDescriptionList');
    fireEvent.mouseOver(httpMethodSection);

    // Find the filter button that appears on hover
    const filterButton = screen.getByLabelText('span-flyout-filter-icon');
    fireEvent.click(filterButton);

    expect(defaultProps.addSpanFilter).toHaveBeenCalled();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalSpan = {
      spanId: 'test-span-id',
      serviceName: 'test-service',
      name: 'test-operation',
      durationInNanos: 1000000000,
    };

    const propsWithMinimalSpan = {
      ...defaultProps,
      selectedSpan: minimalSpan,
    };

    render(<SpanDetailSidebar {...propsWithMinimalSpan} />);

    // Should still render basic information
    expect(screen.getByText('test-span-id')).toBeInTheDocument();
    expect(screen.getByText('test-service')).toBeInTheDocument();
    expect(screen.getByText('test-operation')).toBeInTheDocument();

    // Missing fields should show dashes
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('sorts attributes correctly with non-empty values first', () => {
    const spanWithMixedAttributes = {
      ...mockSpan,
      'empty.field': '',
      'null.field': null,
      'filled.field': 'value',
      'another.empty': undefined,
    };

    const propsWithMixedAttributes = {
      ...defaultProps,
      selectedSpan: spanWithMixedAttributes,
    };

    render(<SpanDetailSidebar {...propsWithMixedAttributes} />);

    // Non-empty attributes should be rendered
    expect(screen.getByText('filled.field')).toBeInTheDocument();
    expect(screen.getByText('value')).toBeInTheDocument();

    // Empty attributes should show dashes
    expect(screen.getByText('empty.field')).toBeInTheDocument();
    expect(screen.getByText('null.field')).toBeInTheDocument();
  });
});
