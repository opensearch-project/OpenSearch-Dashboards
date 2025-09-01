/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableVisStyleControls, TableVisStyleControlsProps } from './table_vis_options';
import { TableChartStyleControls } from './table_vis_config';
import { VisColumn, VisFieldType } from '../types';

// Mock the useDebouncedNumericValue hook
jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumericValue: jest.fn((initialValue, onChange) => {
    return [
      initialValue,
      (value: string) => {
        onChange(parseInt(value, 10));
      },
    ];
  }),
}));

describe('TableVisStyleControls', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Value',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 10,
    uniqueValuesCount: 5,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 10,
    uniqueValuesCount: 3,
  };

  const mockDateColumn: VisColumn = {
    id: 3,
    name: 'Date',
    schema: VisFieldType.Date,
    column: 'field-3',
    validValuesCount: 10,
    uniqueValuesCount: 10,
  };

  const defaultStyleOptions: TableChartStyleControls = {
    pageSize: 10,
  };

  const mockProps: TableVisStyleControlsProps = {
    styleOptions: defaultStyleOptions,
    onStyleChange: jest.fn(),
    numericalColumns: [mockNumericalColumn],
    categoricalColumns: [mockCategoricalColumn],
    dateColumns: [mockDateColumn],
    axisColumnMappings: {},
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<TableVisStyleControls {...mockProps} />);

    // Check if the page size input is rendered with the correct value
    const pageSizeInput = screen.getByTestId('visTablePageSizeInput');
    expect(pageSizeInput).toBeInTheDocument();
    expect(pageSizeInput).toHaveValue(10);
  });

  test('calls onStyleChange when page size is changed', () => {
    const onStyleChange = jest.fn();
    render(<TableVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Get the page size input
    const pageSizeInput = screen.getByTestId('visTablePageSizeInput');

    // Change the page size
    fireEvent.change(pageSizeInput, { target: { value: '20' } });

    // Check if onStyleChange was called with the correct parameters
    expect(onStyleChange).toHaveBeenCalledWith({ pageSize: 20 });
  });

  test('handles empty columns gracefully', () => {
    const propsWithEmptyColumns = {
      ...mockProps,
      numericalColumns: undefined,
      categoricalColumns: undefined,
      dateColumns: undefined,
    };

    // Should render without errors even with empty columns
    expect(() => render(<TableVisStyleControls {...propsWithEmptyColumns} />)).not.toThrow();
  });

  test('renders with custom page size', () => {
    const customStyleOptions = {
      ...defaultStyleOptions,
      pageSize: 25,
    };

    render(<TableVisStyleControls {...mockProps} styleOptions={customStyleOptions} />);

    // Check if the page size input is rendered with the custom value
    const pageSizeInput = screen.getByTestId('visTablePageSizeInput');
    expect(pageSizeInput).toHaveValue(25);
  });
});
