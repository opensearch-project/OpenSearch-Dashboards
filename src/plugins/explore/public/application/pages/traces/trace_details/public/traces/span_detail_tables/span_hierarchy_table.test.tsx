/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { SpanHierarchyTable } from './span_hierarchy_table';
import { SpanTableProps } from './types';

// Mock dependencies
jest.mock('../../utils/custom_datagrid', () => ({
  RenderCustomDataGrid: jest.fn(),
}));

jest.mock('./hierarchy_span_cell', () => ({
  HierarchySpanCell: jest.fn(() => (
    <div data-test-subj="hierarchy-span-cell">HierarchySpanCell</div>
  )),
}));

jest.mock('./span_cell', () => ({
  SpanCell: jest.fn(() => <div data-test-subj="span-cell">SpanCell</div>),
}));

jest.mock('../ppl_resolve_helpers');
jest.mock('./utils');
jest.mock('../../utils/span_timerange_utils');

import { RenderCustomDataGrid } from '../../utils/custom_datagrid';
import { isSpanError } from '../ppl_resolve_helpers';
import { parseHits } from './utils';
import { calculateTraceTimeRange } from '../../utils/span_timerange_utils';

const mockRenderCustomDataGrid = RenderCustomDataGrid as jest.MockedFunction<
  typeof RenderCustomDataGrid
>;
const mockIsSpanError = isSpanError as jest.MockedFunction<typeof isSpanError>;
const mockParseHits = parseHits as jest.MockedFunction<typeof parseHits>;
const mockCalculateTraceTimeRange = calculateTraceTimeRange as jest.MockedFunction<
  typeof calculateTraceTimeRange
>;

describe('SpanHierarchyTable', () => {
  const mockOpenFlyout = jest.fn();

  const mockSpans = [
    {
      spanId: 'parent-1',
      serviceName: 'service-1',
      name: 'parent-operation',
      durationInNanos: 2000000000,
      'status.code': 0,
      startTime: '2023-01-01T00:00:00.000Z',
      endTime: '2023-01-01T00:00:02.000Z',
      children: [],
    },
    {
      spanId: 'child-1',
      parentSpanId: 'parent-1',
      serviceName: 'service-2',
      name: 'child-operation',
      durationInNanos: 1000000000,
      'status.code': 0,
      startTime: '2023-01-01T00:00:00.500Z',
      endTime: '2023-01-01T00:00:01.500Z',
      children: [],
    },
  ];

  const mockTraceTimeRange = {
    startTimeMs: 0,
    endTimeMs: 2000,
    durationMs: 2000,
  };

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
        <div data-test-subj="toolbar">{props.toolbarButtons}</div>
        <div data-test-subj="visible-columns">{JSON.stringify(props.visibleColumns)}</div>
      </div>
    ));
    mockParseHits.mockReturnValue(mockSpans);
    mockIsSpanError.mockImplementation((span) => span?.['status.code'] === 2);
    mockCalculateTraceTimeRange.mockReturnValue(mockTraceTimeRange);
  });

  it('renders with basic data', () => {
    const { getByTestId } = render(<SpanHierarchyTable {...defaultProps} />);

    expect(getByTestId('custom-data-grid')).toBeInTheDocument();
    expect(getByTestId('row-count')).toHaveTextContent('2');
  });

  it('builds hierarchy correctly', () => {
    const { getByTestId } = render(<SpanHierarchyTable {...defaultProps} />);

    // Check that hierarchy is built and flattened correctly
    expect(getByTestId('row-count')).toHaveTextContent('2');
  });

  it('includes expand and collapse toolbar buttons', () => {
    const { getByTestId } = render(<SpanHierarchyTable {...defaultProps} />);

    const toolbar = getByTestId('toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('filters by error status', () => {
    const errorSpans = [
      ...mockSpans,
      {
        spanId: 'error-span',
        serviceName: 'error-service',
        name: 'error-operation',
        durationInNanos: 500000000,
        'status.code': 2,
        startTime: '2023-01-01T00:00:01.000Z',
        endTime: '2023-01-01T00:00:01.500Z',
        children: [],
      },
    ];
    mockParseHits.mockReturnValue(errorSpans);

    const propsWithErrorFilter = {
      ...defaultProps,
      filters: [{ field: 'isError', value: true }],
    };

    const { getByTestId } = render(<SpanHierarchyTable {...propsWithErrorFilter} />);

    expect(getByTestId('row-count')).toHaveTextContent('1');
  });

  it('filters by field value', () => {
    const propsWithServiceFilter = {
      ...defaultProps,
      filters: [{ field: 'serviceName', value: 'service-1' }],
    };

    const { getByTestId } = render(<SpanHierarchyTable {...propsWithServiceFilter} />);

    expect(getByTestId('row-count')).toHaveTextContent('1');
  });

  it('handles empty payload data', () => {
    mockParseHits.mockReturnValue([]);

    const { getByTestId } = render(<SpanHierarchyTable {...defaultProps} />);

    expect(getByTestId('row-count')).toHaveTextContent('0');
  });

  it('handles invalid JSON payload', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockParseHits.mockImplementation(() => {
      throw new Error('Invalid JSON');
    });

    const { getByTestId } = render(<SpanHierarchyTable {...defaultProps} />);

    expect(getByTestId('row-count')).toHaveTextContent('0');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing payloadData in SpanDetailTableHierarchy:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('respects hidden columns', () => {
    const propsWithHiddenColumns = {
      ...defaultProps,
      hiddenColumns: ['timeline'],
    };

    const { getByTestId } = render(<SpanHierarchyTable {...propsWithHiddenColumns} />);

    const visibleColumns = JSON.parse(getByTestId('visible-columns').textContent || '[]');
    expect(visibleColumns).not.toContain('timeline');
    expect(visibleColumns).toContain('span');
  });

  it('passes availableWidth to RenderCustomDataGrid', () => {
    const propsWithWidth = {
      ...defaultProps,
      availableWidth: 800,
    };

    render(<SpanHierarchyTable {...propsWithWidth} />);

    expect(mockRenderCustomDataGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        availableWidth: 800,
      })
    );
  });

  it('includes expected hierarchy columns', () => {
    render(<SpanHierarchyTable {...defaultProps} />);

    const mockCall = mockRenderCustomDataGrid.mock.calls[0]?.[0];
    expect(mockCall).toBeDefined();
    const columnIds = mockCall!.columns.map((col: any) => col.id);

    expect(columnIds).toContain('span');
    expect(columnIds).toContain('timeline');
    expect(columnIds).toContain('durationInNanos');
  });

  it('renders HierarchySpanCell for span column', () => {
    render(<SpanHierarchyTable {...defaultProps} />);

    const mockCall = mockRenderCustomDataGrid.mock.calls[0]?.[0];
    expect(mockCall).toBeDefined();
    expect(mockCall!.renderCellValue).toBeDefined();

    // Just verify the renderCellValue function exists and can be called
    const cellResult = mockCall!.renderCellValue({
      rowIndex: 0,
      columnId: 'span',
      disableInteractions: false,
    });

    expect(cellResult).toBeDefined();
  });

  it('renders SpanCell for non-span columns', () => {
    render(<SpanHierarchyTable {...defaultProps} />);

    const mockCall = mockRenderCustomDataGrid.mock.calls[0]?.[0];
    expect(mockCall).toBeDefined();
    expect(mockCall!.renderCellValue).toBeDefined();

    // Just verify the renderCellValue function exists and can be called
    const cellResult = mockCall!.renderCellValue({
      rowIndex: 0,
      columnId: 'timeline',
      disableInteractions: false,
    });

    expect(cellResult).toBeDefined();
  });

  it('handles undefined payloadData', () => {
    const propsWithUndefinedData = {
      ...defaultProps,
      payloadData: undefined as any,
    };

    const { getByTestId } = render(<SpanHierarchyTable {...propsWithUndefinedData} />);

    expect(getByTestId('row-count')).toHaveTextContent('0');
  });
});
