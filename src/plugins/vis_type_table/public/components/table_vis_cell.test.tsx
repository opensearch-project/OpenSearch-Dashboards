/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import dompurify from 'dompurify';

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
  
  test('should invoke dompurify hook', () => {
    mockFormatter.convert.mockReturnValueOnce('<strong>Test Value 1</strong>');
    const addHookSpy = jest.spyOn(dompurify, 'addHook').mockImplementation((currentNode, hookEvent) => { 
    });
	const { getByText } = render(<TableCell rowIndex={0} columnId="testId" />);
    expect(addHookSpy).toHaveBeenCalled();
  });
  
  test('should return node with value of target attribute as _blank', () => {
    mockFormatter.convert.mockReturnValueOnce('<a target="_blank" >Test Value 1</a>');
    const { getByText } = render(<TableCell rowIndex={0} columnId="testId" />);
    expect(getByText('Test Value 1')).toHaveAttribute('target', '_blank');
    expect(getByText('Test Value 1')).toHaveAttribute('rel', 'noopener noreferrer');
  });
  
  test('should return node with value of target attribute as _self', () => {
    mockFormatter.convert.mockReturnValueOnce('<a target="_self" >Test Value 1</a>');
    const { getByText } = render(<TableCell rowIndex={0} columnId="testId" />);
    expect(getByText('Test Value 1')).toHaveAttribute('target', '_self');
  });
  
  test('should return node with value of rel attribute as noopener noreferrer', () => {
    mockFormatter.convert.mockReturnValueOnce('<a>Test Value 1</a>');
    const { getByText } = render(<TableCell rowIndex={0} columnId="testId" />);
    expect(getByText('Test Value 1')).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
