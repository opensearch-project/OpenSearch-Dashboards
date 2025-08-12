/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableCell, ITableCellProps } from './table_cell';
import { useDatasetContext } from '../../../application/context';

jest.mock('../../../application/context', () => ({
  useDatasetContext: jest.fn(),
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
    onFilter: mockOnFilter,
    fieldMapping: { value: 'test' },
    isTimeField: false,
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

  // Tests for trace timeline functionality
  describe('Span ID link functionality', () => {
    const spanIdProps: ITableCellProps = {
      columnId: 'spanId',
      sanitizedCellValue: '<strong>test-span-id-123</strong>',
      onFilter: mockOnFilter,
      fieldMapping: { value: 'test' },
      isTimeField: false,
      rowData: {
        traceId: 'test-trace-id-456',
        spanId: 'test-span-id-123',
      },
    };

    it('renders span ID as clickable link when on traces page', () => {
      (window as any).location.pathname = '/app/explore/traces';

      render(<TableCell {...spanIdProps} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      expect(spanIdLink).toBeInTheDocument();
      expect(spanIdLink).toHaveTextContent('test-span-id-123');

      const popoutIcon = spanIdLink.querySelector('[data-euiicon-type="popout"]');
      expect(popoutIcon).toBeInTheDocument();
    });

    it('renders regular cell content when not on traces page', () => {
      (window as any).location.pathname = '/app/explore/logs';

      render(<TableCell {...spanIdProps} />);

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
      (window as any).location.pathname = '/app/explore/traces';

      // Test with _source.traceId
      const propsWithSourceTraceId = {
        ...spanIdProps,
        rowData: {
          _source: { traceId: 'source-trace-id' },
          spanId: 'test-span-id-123',
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

    it('handles missing trace ID gracefully', () => {
      (window as any).location.pathname = '/app/explore/traces';

      const propsWithoutTraceId = {
        ...spanIdProps,
        rowData: {
          spanId: 'test-span-id-123',
          // No traceId
        },
      };

      render(<TableCell {...propsWithoutTraceId} />);
      const spanIdLink = screen.getByTestId('spanIdLink');
      fireEvent.click(spanIdLink);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("spanId:'test-span-id-123'"),
        '_blank'
      );
      expect(window.open).toHaveBeenCalledWith(expect.not.stringContaining('traceId:'), '_blank');
    });

    it('works when traces page is detected via hash', () => {
      (window as any).location.pathname = '/app/explore';
      (window as any).location.hash = '#/explore/traces';

      render(<TableCell {...spanIdProps} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      expect(spanIdLink).toBeInTheDocument();
    });

    it('shows tooltip on span ID link hover', () => {
      (window as any).location.pathname = '/app/explore/traces';

      render(<TableCell {...spanIdProps} />);

      const spanIdLink = screen.getByTestId('spanIdLink');
      expect(spanIdLink.closest('.euiToolTipAnchor')).toBeTruthy();
    });
  });
});
