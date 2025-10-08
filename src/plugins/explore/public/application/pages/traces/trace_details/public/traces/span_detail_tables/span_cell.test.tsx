/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpanCell, renderSpanCellValue } from './span_cell';
import { ParsedHit, SpanTableProps } from './types';

// Mock dependencies
jest.mock('./timeline_waterfall_bar', () => ({
  TimelineWaterfallBar: jest.fn(() => <div data-testid="timeline-waterfall-bar">Timeline</div>),
}));

jest.mock('../../utils/helper_functions', () => ({
  nanoToMilliSec: jest.fn((nanos: number) => nanos / 1000000),
  round: jest.fn((num: number, decimals: number) => Math.round(num * 100) / 100),
}));

jest.mock('../../utils/span_data_utils', () => ({
  extractSpanDuration: jest.fn((span) => span.durationInNanos || 0),
}));

jest.mock('../ppl_resolve_helpers', () => ({
  resolveServiceNameFromSpan: jest.fn((span) => span.serviceName),
}));

jest.mock('./utils', () => ({
  parseHits: jest.fn(),
}));

describe('renderSpanCellValue', () => {
  const mockSpan: ParsedHit = {
    spanId: 'test-span-id',
    serviceName: 'test-service',
    operationName: 'test-operation',
    durationInNanos: 1500000000,
    startTime: '2023-01-01T12:00:00.000Z',
    endTime: '2023-01-01T12:00:01.500Z',
    'status.code': 0,
    children: [],
  };

  const mockTraceTimeRange = {
    startTimeMs: 0,
    endTimeMs: 2000,
    durationMs: 2000,
  };

  const mockColorMap = { 'test-service': '#ff0000' };

  it('returns dash for null item', () => {
    const result = renderSpanCellValue({ item: null as any, columnId: 'spanId' });
    expect(result).toBe('-');
  });

  it('renders error status correctly', () => {
    const errorSpan = { ...mockSpan, 'status.code': 2 };
    const result = renderSpanCellValue({ item: errorSpan, columnId: 'status.code' });
    expect(result.props.color).toBe('danger');
    expect(result.props.children).toBe('Yes');
  });

  it('renders no error status correctly', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'status.code' });
    expect(result).toBe('No');
  });

  it('renders spanId correctly', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'spanId' });
    expect(result.props.children).toBe('test-span-id');
  });

  it('renders duration correctly', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'durationInNanos' });
    expect(result).toBe('1500 ms');
  });

  it('renders start time correctly', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'startTime' });
    expect(result).toContain('01/01/2023');
  });

  it('renders end time correctly', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'endTime' });
    expect(result).toContain('01/01/2023');
  });

  it('renders service name correctly', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'serviceName' });
    expect(result).toBe('test-service');
  });

  it('renders timeline with TimelineWaterfallBar', () => {
    const result = renderSpanCellValue(
      { item: mockSpan, columnId: 'timeline' },
      mockTraceTimeRange,
      mockColorMap
    );
    expect(result.props.span).toBe(mockSpan);
    expect(result.props.traceTimeRange).toBe(mockTraceTimeRange);
    expect(result.props.colorMap).toBe(mockColorMap);
  });

  it('returns null for timeline without traceTimeRange', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'timeline' });
    expect(result).toBeNull();
  });

  it('returns default value for unknown column', () => {
    const spanWithCustomField = { ...mockSpan, customField: 'custom-value' };
    const result = renderSpanCellValue({ item: spanWithCustomField, columnId: 'customField' });
    expect(result).toBe('custom-value');
  });

  it('returns dash for missing field', () => {
    const result = renderSpanCellValue({ item: mockSpan, columnId: 'nonExistentField' });
    expect(result).toBe('-');
  });
});

describe('SpanCell', () => {
  const mockOpenFlyout = jest.fn();
  const mockSetCellProps = jest.fn();

  const mockItems: ParsedHit[] = [
    {
      spanId: 'test-span-id',
      serviceName: 'test-service',
      operationName: 'test-operation',
      durationInNanos: 1000000000,
      'status.code': 0,
      children: [],
    },
  ];

  const mockProps: SpanTableProps = {
    hiddenColumns: [],
    openFlyout: mockOpenFlyout,
    payloadData: '',
    filters: [],
    selectedSpanId: undefined,
  };

  const defaultSpanCellProps = {
    rowIndex: 0,
    columnId: 'spanId',
    items: mockItems,
    tableParams: { page: 0, size: 10 },
    disableInteractions: false,
    props: mockProps,
    setCellProps: mockSetCellProps,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button when interactions enabled', () => {
    render(<SpanCell {...defaultSpanCellProps} />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('exploreSpanDetailTable__flyoutButton');
    expect(screen.getByText('test-span-id')).toBeInTheDocument();
  });

  it('calls openFlyout when button clicked', () => {
    render(<SpanCell {...defaultSpanCellProps} />);

    fireEvent.click(screen.getByRole('button'));
    expect(mockOpenFlyout).toHaveBeenCalledWith('test-span-id');
  });

  it('renders content without button when interactions disabled', () => {
    render(<SpanCell {...defaultSpanCellProps} disableInteractions={true} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('test-span-id')).toBeInTheDocument();
  });

  it('renders content without button when item is null', () => {
    render(<SpanCell {...defaultSpanCellProps} items={[]} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('sets selected row class when span is selected', () => {
    const propsWithSelectedSpan = {
      ...mockProps,
      selectedSpanId: 'test-span-id',
    };

    render(<SpanCell {...defaultSpanCellProps} props={propsWithSelectedSpan} />);

    expect(mockSetCellProps).toHaveBeenCalledWith({
      className: 'exploreSpanDetailTable__selectedRow',
    });
  });

  it('clears cell props when span is not selected', () => {
    render(<SpanCell {...defaultSpanCellProps} />);

    expect(mockSetCellProps).toHaveBeenCalledWith({});
  });

  it('handles different page and row index', () => {
    const tableParams = { page: 1, size: 10 };
    render(<SpanCell {...defaultSpanCellProps} rowIndex={15} tableParams={tableParams} />);

    // Should access items[5] (15 - 1*10 = 5) which doesn't exist, so shows '-'
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('passes traceTimeRange and colorMap to renderSpanCellValue', () => {
    const traceTimeRange = { startTimeMs: 0, endTimeMs: 1000, durationMs: 1000 };
    const colorMap = { 'test-service': '#ff0000' };

    render(
      <SpanCell {...defaultSpanCellProps} traceTimeRange={traceTimeRange} colorMap={colorMap} />
    );

    // Just verify the component renders with the props
    expect(screen.getByText('test-span-id')).toBeInTheDocument();
  });
});
