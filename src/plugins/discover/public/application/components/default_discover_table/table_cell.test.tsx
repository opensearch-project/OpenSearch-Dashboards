/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableCell, TableCellProps } from './table_cell';

describe('TableCell', () => {
  const defaultProps: TableCellProps = {
    columnId: 'testField',
    sanitizedCellValue: '<span>test value</span>',
    onFilter: jest.fn(),
    fieldMapping: { name: 'testField', type: 'text' },
    filterable: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the sanitized cell value', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByTestId('osdDocTableCellDataField')).toBeInTheDocument();
    expect(screen.getByTestId('osdDocTableCellDataField').innerHTML).toBe(
      '<span>test value</span>'
    );
  });

  it('renders filter buttons', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} />
          </tr>
        </tbody>
      </table>
    );
    expect(screen.getByTestId('filterForValue')).toBeInTheDocument();
    expect(screen.getByTestId('filterOutValue')).toBeInTheDocument();
  });

  it('calls onFilter with "+" when filter-for button is clicked', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} />
          </tr>
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByTestId('filterForValue'));
    expect(defaultProps.onFilter).toHaveBeenCalledWith('testField', defaultProps.fieldMapping, '+');
  });

  it('calls onFilter with "-" when filter-out button is clicked', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} />
          </tr>
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByTestId('filterOutValue'));
    expect(defaultProps.onFilter).toHaveBeenCalledWith('testField', defaultProps.fieldMapping, '-');
  });

  it('applies eui-textNoWrap class for time fields', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} isTimeField={true} />
          </tr>
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('eui-textNoWrap');
  });

  it('applies eui-textBreakAll class for non-time fields', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} isTimeField={false} />
          </tr>
        </tbody>
      </table>
    );
    const td = container.querySelector('td');
    expect(td).toHaveClass('eui-textBreakAll');
  });

  it('wraps non-time field content in a truncate-by-height div', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} isTimeField={false} />
          </tr>
        </tbody>
      </table>
    );
    expect(container.querySelector('.truncate-by-height')).toBeInTheDocument();
  });

  it('does not wrap time field content in truncate-by-height div', () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell {...defaultProps} isTimeField={true} />
          </tr>
        </tbody>
      </table>
    );
    expect(container.querySelector('.truncate-by-height')).not.toBeInTheDocument();
  });
});
