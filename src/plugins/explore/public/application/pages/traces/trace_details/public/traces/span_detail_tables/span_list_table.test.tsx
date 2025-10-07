/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { SpanListTable } from './span_list_table';
import { SpanTableProps } from './types';

// Mock dependencies
jest.mock('../../utils/custom_datagrid', () => ({
  RenderCustomDataGrid: jest.fn(),
}));

jest.mock('./span_cell', () => ({
  SpanCell: jest.fn(() => <div data-test-subj="span-cell">SpanCell</div>),
}));

jest.mock('../ppl_resolve_helpers');
jest.mock('./utils');

import { RenderCustomDataGrid } from '../../utils/custom_datagrid';
import { isSpanError } from '../ppl_resolve_helpers';
import { parseHits } from './utils';

const mockRenderCustomDataGrid = RenderCustomDataGrid as jest.MockedFunction<typeof RenderCustomDataGrid>;
const mockIsSpanError = isSpanError as jest.MockedFunction<typeof isSpanError>;
const mockParseHits = parseHits as jest.MockedFunction<typeof parseHits>;

describe('SpanListTable', () => {
  const mockOpenFlyout = jest.fn();
  const mockSetTotal = jest.fn();

  const mockSpans = [
    {
      spanId: 'span-1',
      serviceName: 'service-1',
      name: 'operation-1',
      durationInNanos: 1000000000,
      'status.code': 0,
      startTime: '2023-01-01T00:00:00.000Z',
      endTime: '2023-01-01T00:00:01.000Z',
      children: []
    },
    {
      spanId: 'span-2',
      serviceName: 'service-2',
      name: 'operation-2',
      durationInNanos: 2000000000,
      'status.code': 2,
      startTime: '2023-01-01T00:00:02.000Z',
      endTime: '2023-01-01T00:00:04.000Z',
      children: [],
    },
  ];

  const defaultProps: SpanTableProps = {
    hiddenColumns: [],
    openFlyout: mockOpenFlyout,
    payloadData: 'test-payload',
    filters: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderCustomDataGrid.mockImplementation((props) => (
      <div data-test-subj="custom-data-grid">
        <div data-test-subj="row-count">{props.rowCount}</div>
        <div data-test-subj="page-index">{props.pagination?.pageIndex}</div>
        <div data-test-subj="page-size">{props.pagination?.pageSize}</div>
        <div data-test-subj="sorting-columns">{JSON.stringify(props.sorting?.columns)}</div>
        <div data-test-subj="visible-columns">{JSON.stringify(props.visibleColumns)}</div>
      </div>
    ));
    mockParseHits.mockReturnValue(mockSpans);
    mockIsSpanError.mockImplementation((span) => span?.['status.code'] === 2);
  });

  it('renders with basic data', () => {
    const { getByTestId } = render(<SpanListTable {...defaultProps} />);

    expect(getByTestId('custom-data-grid')).toBeInTheDocument();
    expect(getByTestId('row-count')).toHaveTextContent('2');
  });

  it('calls setTotal when provided', () => {
    render(<SpanListTable {...defaultProps} setTotal={mockSetTotal} />);

    expect(mockSetTotal).toHaveBeenCalledWith(2);
  });

  it('applies pagination correctly', () => {
    const { getByTestId } = render(<SpanListTable {...defaultProps} />);

    expect(getByTestId('page-index')).toHaveTextContent('0');
    expect(getByTestId('page-size')).toHaveTextContent('10');
  });

  it('filters by error status', () => {
    const propsWithErrorFilter = {
      ...defaultProps,
      filters: [{ field: 'isError', value: true }],
    };

    const { getByTestId } = render(<SpanListTable {...propsWithErrorFilter} />);

    expect(getByTestId('row-count')).toHaveTextContent('1');
  });

  it('filters by field value', () => {
    const propsWithServiceFilter = {
      ...defaultProps,
      filters: [{ field: 'serviceName', value: 'service-1' }],
    };

    const { getByTestId } = render(<SpanListTable {...propsWithServiceFilter} />);

    expect(getByTestId('row-count')).toHaveTextContent('1');
  });

  it('applies multiple filters', () => {
    const propsWithMultipleFilters = {
      ...defaultProps,
      filters: [
        { field: 'serviceName', value: 'service-2' },
        { field: 'isError', value: true },
      ],
    };

    const { getByTestId } = render(<SpanListTable {...propsWithMultipleFilters} />);

    expect(getByTestId('row-count')).toHaveTextContent('1');
  });

  it('handles empty payload data', () => {
    mockParseHits.mockReturnValue([]);

    const { getByTestId } = render(<SpanListTable {...defaultProps} />);

    expect(getByTestId('row-count')).toHaveTextContent('0');
  });

  it('handles invalid JSON payload', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockParseHits.mockImplementation(() => {
      throw new Error('Invalid JSON');
    });

    const { getByTestId } = render(<SpanListTable {...defaultProps} />);

    expect(getByTestId('row-count')).toHaveTextContent('0');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing payloadData in SpanDetailTable:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('respects hidden columns', () => {
    const propsWithHiddenColumns = {
      ...defaultProps,
      hiddenColumns: ['serviceName', 'name'],
    };

    const { getByTestId } = render(<SpanListTable {...propsWithHiddenColumns} />);

    const visibleColumns = JSON.parse(getByTestId('visible-columns').textContent || '[]');
    expect(visibleColumns).not.toContain('serviceName');
    expect(visibleColumns).not.toContain('name');
    expect(visibleColumns).toContain('spanId');
  });

  it('handles undefined payloadData', () => {
    const propsWithUndefinedData = {
      ...defaultProps,
      payloadData: undefined as any,
    };

    const { getByTestId } = render(<SpanListTable {...propsWithUndefinedData} />);

    expect(getByTestId('row-count')).toHaveTextContent('0');
  });

  it('passes availableWidth to RenderCustomDataGrid', () => {
    const propsWithWidth = {
      ...defaultProps,
      availableWidth: 800,
    };

    render(<SpanListTable {...propsWithWidth} />);

    expect(mockRenderCustomDataGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        availableWidth: 800,
      })
    );
  });

  it('handles hits.hits format payload', () => {
    mockParseHits.mockReturnValue([{
      spanId: 'span-3',
      serviceName: 'service-3',
      name: 'operation-3',
      children: [],
    }]);

    const { getByTestId } = render(<SpanListTable {...defaultProps} />);

    expect(getByTestId('row-count')).toHaveTextContent('1');
  });

  it('includes all expected columns from getListColumns', () => {
    render(<SpanListTable {...defaultProps} />);

    const mockCall = mockRenderCustomDataGrid.mock.calls[0]?.[0];
    expect(mockCall).toBeDefined();
    const columnIds = mockCall!.columns.map((col: any) => col.id);

    const expectedColumns = [
      'serviceName',
      'name',
      'spanId',
      'parentSpanId',
      'traceId',
      'traceGroup',
      'status.code',
      'durationInNanos',
      'startTime',
      'endTime',
    ];

    expectedColumns.forEach(columnId => {
      expect(columnIds).toContain(columnId);
    });
  });

  it('handles sorting functionality', () => {
    render(<SpanListTable {...defaultProps} />);

    const mockCall = mockRenderCustomDataGrid.mock.calls[0]?.[0];
    expect(mockCall).toBeDefined();
    expect(mockCall!.sorting?.onSort).toBeDefined();

    // Test sorting callback
    mockCall!.sorting?.onSort([{ id: 'serviceName', direction: 'asc' }]);
    expect(mockRenderCustomDataGrid).toHaveBeenCalled();
  });

  it('handles pagination callbacks', () => {
    render(<SpanListTable {...defaultProps} />);

    const mockCall = mockRenderCustomDataGrid.mock.calls[0]?.[0];
    expect(mockCall).toBeDefined();
    expect(mockCall!.pagination?.onChangePage).toBeDefined();
    expect(mockCall!.pagination?.onChangeItemsPerPage).toBeDefined();

    // Test pagination callbacks
    mockCall!.pagination?.onChangePage(1);
    mockCall!.pagination?.onChangeItemsPerPage(50);
    expect(mockRenderCustomDataGrid).toHaveBeenCalled();
  });
});
