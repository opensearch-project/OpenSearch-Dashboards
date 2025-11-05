/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableCell, ITableCellProps } from './table_cell';
import { useDatasetContext } from '../../../application/context';
import { useTraceFlyoutContext } from '../../../application/pages/traces/trace_flyout/trace_flyout_context';

jest.mock('../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../application/pages/traces/trace_flyout/trace_flyout_context');

jest.mock('../../../services/log_action_registry', () => ({
  logActionRegistry: {
    getCompatibleActions: jest.fn(() => [
      {
        id: 'mock-action',
        displayName: 'Mock Action',
        iconType: 'gear',
        order: 10,
        isCompatible: () => true,
        component: () => null,
      },
    ]),
    registerAction: jest.fn(),
    unregisterAction: jest.fn(),
    getAction: jest.fn(),
    getAllActions: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../../log_action_menu', () => ({
  LogActionMenu: ({ document, iconType, size }: any) => (
    <div
      data-test-subj="logActionMenu"
      data-document={JSON.stringify(document)}
      data-icon-type={iconType}
      data-size={size}
    >
      LogActionMenu
    </div>
  ),
}));

describe('TableCell', () => {
  const mockOnFilter = jest.fn();
  const mockUseDatasetContext = useDatasetContext as jest.MockedFunction<typeof useDatasetContext>;

  const mockDataset = {
    id: 'test-dataset-id',
    title: 'test-dataset-title',
    type: 'INDEX_PATTERN',
  } as any;

  const defaultProps: ITableCellProps = {
    columnId: 'test-column',
    sanitizedCellValue: '<strong>test value</strong>',
    setIsRowSelected: jest.fn(),
    onFilter: mockOnFilter,
    fieldMapping: { value: 'test' },
    isTimeField: false,
    isOnTracesPage: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the dataset context
    mockUseDatasetContext.mockReturnValue({
      dataset: mockDataset,
      isLoading: false,
      error: null,
    });
    // Reset window location
    delete (window as any).location;
    (window as any).location = {
      pathname: '/app/explore',
      hash: '',
      origin: 'http://localhost:5601',
    };
    // Mock window.open
    (window as any).open = jest.fn();
  });

  it('renders cell content with sanitized HTML', () => {
    render(<TableCell {...defaultProps} />);

    const cellContent = screen.getByTestId('osdDocTableCellDataField');
    expect(cellContent).toBeInTheDocument();
    expect(cellContent.innerHTML).toBe('<strong>test value</strong>');
  });

  it('renders filter buttons when onFilter is provided', () => {
    render(<TableCell {...defaultProps} />);

    expect(screen.getByTestId('filterForValue')).toBeInTheDocument();
    expect(screen.getByTestId('filterOutValue')).toBeInTheDocument();
  });

  it('calls onFilter with correct parameters when filter for value button is clicked', () => {
    render(<TableCell {...defaultProps} />);

    const filterForButton = screen.getByTestId('filterForValue');
    fireEvent.click(filterForButton);

    expect(mockOnFilter).toHaveBeenCalledWith('test-column', { value: 'test' }, '+');
  });

  it('calls onFilter with correct parameters when filter out value button is clicked', () => {
    render(<TableCell {...defaultProps} />);

    const filterOutButton = screen.getByTestId('filterOutValue');
    fireEvent.click(filterOutButton);

    expect(mockOnFilter).toHaveBeenCalledWith('test-column', { value: 'test' }, '-');
  });

  it('does not call onFilter when onFilter is not provided', () => {
    render(<TableCell {...defaultProps} onFilter={undefined} />);

    const filterForButton = screen.getByTestId('filterForValue');
    fireEvent.click(filterForButton);

    expect(mockOnFilter).not.toHaveBeenCalled();
  });

  it('renders as time field cell when isTimeField is true', () => {
    render(<TableCell {...defaultProps} isTimeField={true} />);

    const cell = screen.getByTestId('docTableField');
    expect(cell).toHaveClass('exploreDocTableCell', 'eui-textNoWrap');
    expect(cell).not.toHaveClass('eui-textBreakAll', 'eui-textBreakWord');
  });

  it('renders as regular field cell when isTimeField is false', () => {
    render(<TableCell {...defaultProps} isTimeField={false} />);

    const cell = screen.getByTestId('docTableField');
    expect(cell).toHaveClass('exploreDocTableCell', 'eui-textBreakAll', 'eui-textBreakWord');
    expect(cell).not.toHaveClass('eui-textNoWrap');
  });

  it('renders truncate wrapper for non-time fields', () => {
    render(<TableCell {...defaultProps} isTimeField={false} />);

    const truncateWrapper = document.querySelector('.truncate-by-height');
    expect(truncateWrapper).toBeInTheDocument();
  });

  it('does not render truncate wrapper for time fields', () => {
    render(<TableCell {...defaultProps} isTimeField={true} />);

    const truncateWrapper = document.querySelector('.truncate-by-height');
    expect(truncateWrapper).not.toBeInTheDocument();
  });

  it('renders filter section with correct test subjects', () => {
    render(<TableCell {...defaultProps} />);

    expect(screen.getByTestId('osdDocTableCellFilter')).toBeInTheDocument();
    expect(screen.getByTestId('osdDocTableCellDataField')).toBeInTheDocument();
  });

  describe('Duration cell functionality', () => {
    it('renders duration in milliseconds on traces page', () => {
      render(
        <TableCell
          {...defaultProps}
          columnId="durationNano"
          sanitizedCellValue="<span>2,000,000</span>"
          isOnTracesPage={true}
        />
      );

      const cellContent = screen.getByTestId('osdDocTableCellDataField');
      expect(cellContent).toBeInTheDocument();
      expect(cellContent.innerHTML).toBe('<span>2 ms</span>');
    });

    it('renders regular cell content when not on traces page', () => {
      render(
        <TableCell
          {...defaultProps}
          columnId="durationNano"
          sanitizedCellValue="<span>2,000,000</span>"
        />
      );

      const cellContent = screen.getByTestId('osdDocTableCellDataField');
      expect(cellContent).toBeInTheDocument();
      expect(cellContent.innerHTML).toBe('<span>2,000,000</span>');
    });
  });

  // Tests for trace timeline functionality
  describe('Span ID link functionality', () => {
    const spanIdProps: ITableCellProps = {
      columnId: 'spanId',
      sanitizedCellValue: '<strong>test-span-id-123</strong>',
      onFilter: mockOnFilter,
      fieldMapping: { value: 'test' },
      isTimeField: false,
      rowData: {
        _index: 'test-index',
        _id: 'test-id',
        _score: 1,
        _source: {
          traceId: 'test-trace-id-456',
          spanId: 'test-span-id-123',
          parentSpanId: 'test-parent-span-id-789',
          serviceName: 'test-service',
          name: 'test-operation',
          startTimeUnixNano: '1634567890000000000',
          endTimeUnixNano: '1634567891000000000',
          'status.code': '200',
        },
      },
      isOnTracesPage: true,
      setIsRowSelected: jest.fn(),
    };

    it('renders span ID as clickable link when on traces page', () => {
      render(<TableCell {...spanIdProps} isOnTracesPage={true} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      expect(spanIdLink).toBeInTheDocument();
      expect(spanIdLink).toHaveTextContent('test-span-id-123');

      const popoutIcon = spanIdLink.querySelector('[data-euiicon-type="popout"]');
      expect(popoutIcon).toBeInTheDocument();
    });

    it('renders regular cell content when not on traces page', () => {
      render(<TableCell {...spanIdProps} isOnTracesPage={false} />);

      const cellContent = screen.getByTestId('osdDocTableCellDataField');
      expect(cellContent).toBeInTheDocument();
      expect(cellContent.innerHTML).toBe('<strong>test-span-id-123</strong>');

      expect(screen.queryByTestId('spanIdLink')).not.toBeInTheDocument();
    });

    it('renders regular cell content for non-span ID columns', () => {
      (window as any).location.pathname = '/app/explore/traces';

      render(<TableCell {...{ ...spanIdProps, columnId: 'regularColumn' }} />);

      const cellContent = screen.getByTestId('osdDocTableCellDataField');
      expect(cellContent).toBeInTheDocument();
      expect(cellContent.innerHTML).toBe('<strong>test-span-id-123</strong>');

      expect(screen.queryByTestId('spanIdLink')).not.toBeInTheDocument();
    });

    it('opens trace details URL when span ID link is clicked', () => {
      (window as any).location.pathname = '/app/explore/traces';

      render(<TableCell {...spanIdProps} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      fireEvent.click(spanIdLink);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(
          "/app/explore/traces/traceDetails#/?_a=(dataset:(id:'test-dataset-id',title:'test-dataset-title',type:'INDEX_PATTERN'),spanId:'test-span-id-123',traceId:'test-trace-id-456')"
        ),
        '_blank'
      );
    });

    it('handles different span ID column variations', () => {
      (window as any).location.pathname = '/app/explore/traces';

      // Test span_id
      const { unmount: unmount1 } = render(
        <TableCell {...{ ...spanIdProps, columnId: 'span_id' }} />
      );
      expect(screen.getByTestId('spanIdLink')).toBeInTheDocument();
      unmount1();

      // Test spanID
      const { unmount: unmount2 } = render(
        <TableCell {...{ ...spanIdProps, columnId: 'spanID' }} />
      );
      expect(screen.getByTestId('spanIdLink')).toBeInTheDocument();
      unmount2();
    });

    it('extracts trace ID from different row data structures', () => {
      // Test with _source.traceId
      const propsWithSourceTraceId = {
        ...spanIdProps,
        rowData: {
          _index: 'test-index',
          _id: 'test-id',
          _score: 1,
          _source: {
            traceId: 'source-trace-id',
            serviceName: 'test-service',
            name: 'test-operation',
            startTimeUnixNano: '1634567890000000000',
            endTimeUnixNano: '1634567891000000000',
          },
          spanId: 'test-span-id-123',
          parentSpanId: 'test-parent-span-id-789',
          'status.code': '200',
        },
      };

      render(<TableCell {...propsWithSourceTraceId} />);
      const spanIdLink = screen.getByTestId('spanIdLink');
      fireEvent.click(spanIdLink);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("traceId:'source-trace-id'"),
        '_blank'
      );
    });

    it('renders non-clickable text when required fields are missing', () => {
      const propsWithMissingFields = {
        ...spanIdProps,
        rowData: {
          _index: 'test-index',
          _id: 'test-id',
          _score: 1,
          _source: {
            spanId: 'test-span-id-123',
            parentSpanId: 'test-parent-span-id-789',
            serviceName: 'test-service',
            name: 'test-operation',
            startTimeUnixNano: '1634567890000000000',
            endTimeUnixNano: '1634567891000000000',
            'status.code': '200',
            // Missing traceId - validation should fail
          },
        },
      };

      render(<TableCell {...propsWithMissingFields} />);

      // Should not render clickable link when validation fails
      expect(screen.queryByTestId('spanIdLink')).not.toBeInTheDocument();

      // Should render non-clickable text with tooltip instead
      const nonClickableText = screen.getByText('test-span-id-123');
      expect(nonClickableText).toBeInTheDocument();
      expect(nonClickableText.closest('.euiToolTipAnchor')).toBeTruthy();
    });

    it('works when traces page is detected via hash', () => {
      (window as any).location.pathname = '/app/explore';
      (window as any).location.hash = '#/explore/traces';

      render(<TableCell {...spanIdProps} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      expect(spanIdLink).toBeInTheDocument();
    });

    it('shows tooltip on span ID link hover', () => {
      render(<TableCell {...spanIdProps} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      expect(spanIdLink.closest('.euiToolTipAnchor')).toBeTruthy();
    });
  });

  describe('Span flyout button functionality', () => {
    const mockUseTraceFlyoutContext = useTraceFlyoutContext as jest.MockedFunction<
      typeof useTraceFlyoutContext
    >;
    const mockOpenTraceFlyout = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      mockUseTraceFlyoutContext.mockReturnValue({
        openTraceFlyout: mockOpenTraceFlyout,
        closeTraceFlyout: jest.fn(),
        isFlyoutOpen: false,
        flyoutData: undefined,
      });
    });

    const spanFlyoutProps: ITableCellProps = {
      columnId: 'endTimeUnixNano',
      sanitizedCellValue: '<span>Sep 20, 2025 @ 01:00:00.000000000</span>',
      onFilter: mockOnFilter,
      fieldMapping: { value: 'test' },
      isTimeField: true,
      isOnTracesPage: true,
      setIsRowSelected: jest.fn(),
      rowData: {
        _index: 'test-index',
        _id: 'test-id',
        _score: 1,
        _source: {
          traceId: 'test-trace-id-456',
          spanId: 'test-span-id-123',
          parentSpanId: 'test-parent-span-id-789',
          serviceName: 'test-service',
          name: 'test-operation',
          startTimeUnixNano: '1634567890000000000',
          endTimeUnixNano: '1634567891000000000',
          'status.code': '200',
        },
      },
    };

    it('opens data table flyout when clicked on traces page', () => {
      (window as any).location.pathname = '/app/explore/traces';

      render(<TableCell {...spanFlyoutProps} isOnTracesPage={true} />);

      const traceFlyoutButton = screen.getByTestId('traceFlyoutButton');
      expect(traceFlyoutButton).toBeInTheDocument();
      expect(traceFlyoutButton).toHaveTextContent('Sep 20, 2025 @ 01:00:00.000000000');

      fireEvent.click(traceFlyoutButton);

      expect(mockOpenTraceFlyout).toHaveBeenCalledWith({
        spanId: 'test-span-id-123',
        traceId: 'test-trace-id-456',
        dataset: mockDataset,
        rowData: spanFlyoutProps.rowData,
      });
    });

    it('renders regular cell content when not on traces page', () => {
      render(<TableCell {...spanFlyoutProps} isOnTracesPage={false} />);

      const cellContent = screen.getByTestId('osdDocTableCellDataField');
      expect(cellContent).toBeInTheDocument();
      expect(cellContent.innerHTML).toBe('<span>Sep 20, 2025 @ 01:00:00.000000000</span>');

      expect(screen.queryByTestId('traceFlyoutButton')).not.toBeInTheDocument();
    });
  });

  describe('LogActionMenu functionality', () => {
    const propsWithRowData: ITableCellProps = {
      columnId: 'message',
      sanitizedCellValue: '<span>Error occurred</span>',
      onFilter: mockOnFilter,
      fieldMapping: { value: 'test' },
      isTimeField: false,
      isOnTracesPage: false,
      setIsRowSelected: jest.fn(),
      rowData: {
        _index: 'test-index',
        _id: 'test-id',
        _score: 1,
        _source: {
          message: 'Error occurred',
          timestamp: '2024-01-01T00:00:00Z',
          level: 'error',
        },
      },
      index: 5,
    };

    it('renders LogActionMenu when rowData with _source is provided', () => {
      render(<TableCell {...propsWithRowData} />);

      const logActionMenu = screen.getByTestId('logActionMenu');
      expect(logActionMenu).toBeInTheDocument();
      expect(logActionMenu).toHaveAttribute('data-icon-type', 'generate');
      expect(logActionMenu).toHaveAttribute('data-size', 'xs');
    });

    it('passes correct document data to LogActionMenu', () => {
      render(<TableCell {...propsWithRowData} />);

      const logActionMenu = screen.getByTestId('logActionMenu');
      const documentData = JSON.parse(logActionMenu.getAttribute('data-document') || '{}');

      expect(documentData).toEqual({
        message: 'Error occurred',
        timestamp: '2024-01-01T00:00:00Z',
        level: 'error',
      });
    });

    it('does not render LogActionMenu for _source column', () => {
      const sourceColumnProps = {
        ...propsWithRowData,
        columnId: '_source',
      };

      render(<TableCell {...sourceColumnProps} />);

      expect(screen.queryByTestId('logActionMenu')).not.toBeInTheDocument();
    });

    it('does not render LogActionMenu when rowData is not provided', () => {
      const propsWithoutRowData = {
        ...defaultProps,
        columnId: 'message',
      };

      render(<TableCell {...propsWithoutRowData} />);

      expect(screen.queryByTestId('logActionMenu')).not.toBeInTheDocument();
    });

    it('does not render LogActionMenu when _source is not present in rowData', () => {
      const propsWithoutSource = {
        ...propsWithRowData,
        rowData: {
          _index: 'test-index',
          _id: 'test-id',
          _score: 1,
        } as any,
      };

      render(<TableCell {...propsWithoutSource} />);

      expect(screen.queryByTestId('logActionMenu')).not.toBeInTheDocument();
    });

    it('renders LogActionMenu for all non-_source columns with valid rowData', () => {
      const columns = ['timestamp', 'level', 'message', 'user'];

      columns.forEach((columnId) => {
        const { unmount } = render(<TableCell {...{ ...propsWithRowData, columnId }} />);

        expect(screen.getByTestId('logActionMenu')).toBeInTheDocument();
        unmount();
      });
    });

    it('passes index metadata to LogActionMenu', () => {
      const propsWithIndex = {
        ...propsWithRowData,
        index: 10,
      };

      render(<TableCell {...propsWithIndex} />);

      const logActionMenu = screen.getByTestId('logActionMenu');
      expect(logActionMenu).toBeInTheDocument();
    });
  });
});
