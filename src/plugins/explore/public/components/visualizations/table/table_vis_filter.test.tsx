/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColumnFilterContent, TableColumnHeader } from './table_vis_filter';
import { VisColumn, VisFieldType } from '../types';

describe('TableColumnHeader', () => {
  const mockCol: VisColumn = {
    name: 'Test Column',
    column: 'test_col',
    schema: VisFieldType.Categorical,
    id: 1,
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockSetFilters = jest.fn();
  const mockSetPopoverOpen = jest.fn();
  const mockUniques = ['value1', 'value2', 'value3'];

  const defaultProps = {
    col: mockCol,
    showColumnFilter: true,
    popoverOpen: false,
    setPopoverOpen: mockSetPopoverOpen,
    filters: {},
    setFilters: mockSetFilters,
    uniques: mockUniques,
  };

  it('renders column name without filter for date schema', () => {
    const dateCol: VisColumn = { ...mockCol, schema: VisFieldType.Date };
    render(<TableColumnHeader {...defaultProps} col={dateCol} />);
    expect(screen.getByText('Test Column')).toBeInTheDocument();
    expect(screen.queryByTestId('visTableFilterIcon-test_col')).not.toBeInTheDocument();
  });

  it('renders column name and filter icon for non-date schema', () => {
    render(<TableColumnHeader {...defaultProps} />);
    expect(screen.getByText('Test Column')).toBeInTheDocument();
    expect(screen.getByTestId('visTableFilterIcon-test_col')).toBeInTheDocument();
  });

  it('toggles popover when filter icon is clicked', () => {
    render(<TableColumnHeader {...defaultProps} />);
    const filterIcon = screen.getByTestId('visTableFilterIcon-test_col');
    fireEvent.click(filterIcon);
    expect(mockSetPopoverOpen).toHaveBeenCalledWith(true);
  });

  it('shows active filter color when filter is active', () => {
    const activeFilters = {
      test_col: { values: ['value1'], operator: 'contains' },
    };
    render(<TableColumnHeader {...defaultProps} filters={activeFilters} />);
    const filterIcon = screen.getByTestId('visTableFilterIcon-test_col');
    expect(filterIcon).toHaveStyle('color: primary');
  });
});

describe('ColumnFilterContent', () => {
  const mockCol: VisColumn = {
    name: 'Test Column',
    column: 'test_col',
    schema: VisFieldType.Categorical,
    id: 1,
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockOnApply = jest.fn();
  const mockOnClear = jest.fn();
  const mockOnCancel = jest.fn();
  const mockUniques = ['value1', 'value2', 'value3'];

  const defaultProps = {
    col: mockCol,
    currentFilter: { values: [], operator: 'contains', search: '' },
    onApply: mockOnApply,
    onClear: mockOnClear,
    onCancel: mockOnCancel,
    uniques: mockUniques,
  };

  it('renders filter content for categorical schema', () => {
    render(<ColumnFilterContent {...defaultProps} />);
    expect(screen.getByText('Test Column')).toBeInTheDocument();
    expect(screen.getByDisplayValue('contains')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter unique values')).toBeInTheDocument();
    mockUniques.forEach((value) => {
      expect(screen.getByLabelText(value)).toBeInTheDocument();
    });
  });

  it('renders correct operators for numerical schema', () => {
    const numericalCol: VisColumn = { ...mockCol, schema: VisFieldType.Numerical };
    render(<ColumnFilterContent {...defaultProps} col={numericalCol} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveDisplayValue('=');
    const options = ['=', '!=', '>', '>=', '<', '<='];
    options.forEach((op) => {
      expect(screen.getByText(op)).toBeInTheDocument();
    });
  });

  it('shows number input for numerical schema with appropriate operators', () => {
    const numericalCol: VisColumn = { ...mockCol, schema: VisFieldType.Numerical };
    render(
      <ColumnFilterContent
        {...defaultProps}
        col={numericalCol}
        currentFilter={{ values: [], operator: '>', search: '' }}
      />
    );
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('handles unique value filtering', () => {
    render(<ColumnFilterContent {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText('Filter unique values');
    fireEvent.change(searchInput, { target: { value: 'value1' } });
    expect(screen.getByLabelText('value1')).toBeInTheDocument();
    expect(screen.queryByLabelText('value2')).not.toBeInTheDocument();
  });

  it('handles select all checkbox', () => {
    render(<ColumnFilterContent {...defaultProps} />);
    const selectAllCheckbox = screen.getByTestId('selectAllCheckbox');
    fireEvent.click(selectAllCheckbox);
    mockUniques.forEach((value) => {
      expect(screen.getByLabelText(value)).toBeChecked();
    });
  });

  it('applies filter with selected values', () => {
    render(<ColumnFilterContent {...defaultProps} />);
    const value1Checkbox = screen.getByLabelText('value1');
    fireEvent.click(value1Checkbox);
    const applyButton = screen.getByText('OK');
    fireEvent.click(applyButton);
    expect(mockOnApply).toHaveBeenCalledWith({
      values: ['value1'],
      operator: 'contains',
      search: '',
    });
  });

  it('clears filter', () => {
    render(<ColumnFilterContent {...defaultProps} />);
    const clearButton = screen.getByText('Clear filter');
    fireEvent.click(clearButton);
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('cancels filter', () => {
    render(<ColumnFilterContent {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
