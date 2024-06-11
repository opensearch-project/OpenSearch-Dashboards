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
});
