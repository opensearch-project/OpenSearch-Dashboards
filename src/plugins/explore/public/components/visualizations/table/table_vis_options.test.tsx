/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableVisStyleControls, TableVisStyleControlsProps } from './table_vis_options';
import { TableChartStyleControls } from './table_vis_config';
import { VisColumn, VisFieldType } from '../types';

jest.mock('../utils/use_debounced_value', () => ({
  useDebouncedNumber: jest.fn((initialValue, onChange) => {
    return [
      initialValue,
      (value: string) => {
        onChange(parseInt(value, 10));
      },
    ];
  }),
  useDebouncedValue: jest.fn((initialValue, onChange, delay) => {
    return [
      initialValue,
      (value: string) => {
        onChange(value);
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
    globalAlignment: 'auto',
    showColumnFilter: false,
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

    // Check if the global alignment select is rendered with the correct value
    const globalAlignmentSelect = screen.getByTestId('visTableGlobalAlignment');
    expect(globalAlignmentSelect).toBeInTheDocument();
    expect(globalAlignmentSelect).toHaveValue('auto');

    // Check if the column filter switch is rendered with the correct state
    const columnFilterSwitch = screen.getByTestId('visTableColumnFilter');
    expect(columnFilterSwitch).toBeInTheDocument();
    expect(columnFilterSwitch).not.toBeChecked();
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

  test('calls onStyleChange when global alignment is changed', () => {
    const onStyleChange = jest.fn();
    render(<TableVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Get the global alignment select
    const globalAlignmentSelect = screen.getByTestId('visTableGlobalAlignment');

    // Change the global alignment to 'center'
    fireEvent.change(globalAlignmentSelect, { target: { value: 'center' } });

    // Check if onStyleChange was called with the correct parameters
    expect(onStyleChange).toHaveBeenCalledWith({ globalAlignment: 'center' });
  });

  test('calls onStyleChange when column filter switch is toggled', () => {
    const onStyleChange = jest.fn();
    render(<TableVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Get the column filter switch
    const columnFilterSwitch = screen.getByTestId('visTableColumnFilter');

    // Toggle the column filter switch
    fireEvent.click(columnFilterSwitch);

    // Check if onStyleChange was called with the correct parameters
    expect(onStyleChange).toHaveBeenCalledWith({ showColumnFilter: true });
  });

  test('stops event propagation on mouse up in global alignment select', () => {
    render(<TableVisStyleControls {...mockProps} />);

    // Get the global alignment select
    const globalAlignmentSelect = screen.getByTestId('visTableGlobalAlignment');

    // Create a mock for stopPropagation
    const stopPropagation = jest.fn();

    // Create a MouseEvent with a mocked stopPropagation
    const mouseEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
    });

    // Spy on the stopPropagation method of the event
    jest.spyOn(mouseEvent, 'stopPropagation').mockImplementation(stopPropagation);

    // Simulate a mouse up event
    fireEvent(globalAlignmentSelect, mouseEvent);

    // Check if stopPropagation was called
    expect(stopPropagation).toHaveBeenCalled();
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
