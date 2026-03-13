/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

import { OpenSearchDashboardsDatatableRow } from 'src/plugins/expressions';
import { FormattedColumn } from '../types';
import { getTableVisCellValue } from './table_vis_cell';
import { FieldFormat } from 'src/plugins/data/public';

class MockFieldFormat extends FieldFormat {
  convert = jest.fn();
}

describe('getTableVisCellValue', () => {
  const mockFormatter = new MockFieldFormat();

  const columns: FormattedColumn[] = [
    {
      id: 'testId',
      title: 'Test Column',
      formatter: mockFormatter,
      filterable: true,
    },
  ];

  const sortedRows: OpenSearchDashboardsDatatableRow[] = [
    {
      testId: 'Test Value 1',
    },
    {
      testId: 'Test Value 2',
    },
  ];

  const TableCell = ({ rowIndex, columnId }: { rowIndex: number; columnId: string }) => {
    const getCellValue = getTableVisCellValue(sortedRows, columns);
    return getCellValue({ rowIndex, columnId });
  };

  beforeEach(() => {
    mockFormatter.convert.mockClear();
  });

  test('should render cell value with correct formatting', () => {
    mockFormatter.convert.mockReturnValueOnce('<strong>Test Value 1</strong>');
    const { getByText } = render(<TableCell rowIndex={0} columnId="testId" />);
    expect(mockFormatter.convert).toHaveBeenCalledWith('Test Value 1', 'html');
    expect(getByText('Test Value 1')).toBeInTheDocument();
    expect(getByText('Test Value 1').closest('strong')).toBeInTheDocument();
  });

  test('should return null when rowIndex is out of bounds', () => {
    const { container } = render(<TableCell rowIndex={2} columnId="testId" />);
    expect(container.firstChild).toBeNull();
  });

  test('should return null when no matching columnId is found', () => {
    const { container } = render(<TableCell rowIndex={0} columnId="nonexistent" />);
    expect(container.firstChild).toBeNull();
  });

  test('should sanitize HTML content using dompurify', () => {
    mockFormatter.convert.mockReturnValueOnce(
      '<a href="http://example.com" target="_blank">Link</a>'
    );
    const { container } = render(<TableCell rowIndex={0} columnId="testId" />);
    const anchorElement = container.querySelector('a');
    expect(anchorElement).toHaveAttribute('href', 'http://example.com');
    expect(anchorElement).toHaveAttribute('target', '_blank');
    expect(anchorElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should handle unsafe HTML content gracefully', () => {
    mockFormatter.convert.mockReturnValueOnce('<img src="x" onerror="alert(1)">');
    const { container } = render(<TableCell rowIndex={0} columnId="testId" />);
    const imgElement = container.querySelector('img');
    expect(imgElement).toHaveAttribute('src', 'x');
    expect(imgElement).not.toHaveAttribute('onerror');
  });
});
