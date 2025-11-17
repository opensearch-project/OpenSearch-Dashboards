/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AxisSelector } from './axes_selector';
import { AxisRole, VisFieldType } from '../../types';
import { ChartType } from '../../utils/use_visualization_types';

describe('AxisSelector', () => {
  const mockOnChange = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    chartType: 'bar' as ChartType,
    axisRole: AxisRole.X,
    selectedColumn: 'category',
    allColumnOptions: [
      {
        isGroupLabelOption: true,
        label: 'Categorical fields',
        options: [
          {
            column: {
              id: 1,
              name: 'category',
              schema: VisFieldType.Categorical,
              column: 'category',
              validValuesCount: 100,
              uniqueValuesCount: 10,
            },
            label: 'category',
          },
        ],
      },
    ],
    onRemove: mockOnRemove,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders axis selector with label', () => {
    render(<AxisSelector {...defaultProps} />);
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
  });

  it('displays selected column', () => {
    render(<AxisSelector {...defaultProps} />);
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    render(<AxisSelector {...defaultProps} />);

    const clearButton = screen.getByTestId('comboBoxClearButton');
    fireEvent.click(clearButton);

    expect(mockOnRemove).toHaveBeenCalledWith(AxisRole.X);
  });

  it('calls onRemove when selection is cleared', () => {
    render(<AxisSelector {...defaultProps} />);

    const clearButton = screen.getByTestId('comboBoxClearButton');
    fireEvent.click(clearButton);

    expect(mockOnRemove).toHaveBeenCalledWith(AxisRole.X);
  });

  it('renders different axis role labels correctly', () => {
    const yAxisProps = { ...defaultProps, axisRole: AxisRole.Y };
    const { rerender } = render(<AxisSelector {...yAxisProps} />);
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();

    const colorAxisProps = { ...defaultProps, axisRole: AxisRole.COLOR };
    rerender(<AxisSelector {...colorAxisProps} />);
    expect(screen.getByText('Color')).toBeInTheDocument();

    const facetAxisProps = { ...defaultProps, axisRole: AxisRole.FACET };
    rerender(<AxisSelector {...facetAxisProps} />);
    expect(screen.getByText('Split chart by')).toBeInTheDocument();
  });

  it('handles empty selected column', () => {
    const propsWithEmptySelection = { ...defaultProps, selectedColumn: '' };
    render(<AxisSelector {...propsWithEmptySelection} />);

    const input = screen.getByTestId('comboBoxSearchInput');
    expect(input).toHaveValue('');
  });

  // New tests to improve coverage

  it('selects a new column and calls onChange', async () => {
    const multipleOptionsProps = {
      ...defaultProps,
      selectedColumn: '',
      allColumnOptions: [
        {
          isGroupLabelOption: true,
          label: 'Categorical fields',
          options: [
            {
              column: {
                id: 1,
                name: 'category',
                schema: VisFieldType.Categorical,
                column: 'category',
                validValuesCount: 100,
                uniqueValuesCount: 10,
              },
              label: 'category',
            },
            {
              column: {
                id: 2,
                name: 'product',
                schema: VisFieldType.Categorical,
                column: 'product',
                validValuesCount: 100,
                uniqueValuesCount: 20,
              },
              label: 'product',
            },
          ],
        },
      ],
    };

    render(<AxisSelector {...multipleOptionsProps} />);

    // Open the combobox
    const combobox = screen.getByTestId('comboBoxSearchInput');
    fireEvent.click(combobox);

    // Select an option
    await waitFor(() => {
      const option = screen.getByText('product');
      fireEvent.click(option);
    });

    // Verify onChange was called with the correct parameters
    expect(mockOnChange).toHaveBeenCalledWith(AxisRole.X, 'product');
  });

  it('renders with SIZE axis role', () => {
    const sizeAxisProps = { ...defaultProps, axisRole: AxisRole.SIZE };
    render(<AxisSelector {...sizeAxisProps} />);
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('renders with Y_SECOND axis role', () => {
    const secondYAxisProps = { ...defaultProps, axisRole: AxisRole.Y_SECOND };
    render(<AxisSelector {...secondYAxisProps} />);
    expect(screen.getByText('Y-Axis (2nd)')).toBeInTheDocument();
  });

  it('renders with Value axis role', () => {
    const valueAxisProps = { ...defaultProps, axisRole: AxisRole.Value };
    render(<AxisSelector {...valueAxisProps} />);
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
});
