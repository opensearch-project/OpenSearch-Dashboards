/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableCell, ITableCellProps } from './table_cell';

describe('TableCell', () => {
  const mockOnFilter = jest.fn();

  const defaultProps: ITableCellProps = {
    columnId: 'test-column',
    sanitizedCellValue: '<strong>test value</strong>',
    onFilter: mockOnFilter,
    fieldMapping: { value: 'test' },
    isTimeField: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
});
