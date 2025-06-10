/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AxesOptions } from './axes_options';
import { CategoryAxis, ValueAxis, VisColumn, VisFieldType } from '../types';
import { Positions } from '../utils/collections';

// Mock the debounced value hooks
jest.mock('../utils/use_debounced_value', () => {
  return {
    useDebouncedValue: jest.fn((initialValue, onChange) => {
      // Use Jest's mock function instead of React.useState
      const value = initialValue;
      const handleChange = (newValue: any) => {
        onChange(newValue);
      };
      return [value, handleChange];
    }),
    useDebouncedNumericValue: jest.fn((initialValue, onChange, options) => {
      // Use Jest's mock function instead of React.useState
      const value = initialValue;
      const handleChange = (newValue: any) => {
        onChange(Number(newValue));
      };
      return [value, handleChange];
    }),
  };
});

describe('AxesOptions', () => {
  const mockNumericalColumns: VisColumn[] = [
    { id: 1, name: 'count', schema: VisFieldType.Numerical, column: 'count' },
    { id: 2, name: 'price', schema: VisFieldType.Numerical, column: 'price' },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    { id: 3, name: 'category', schema: VisFieldType.Categorical, column: 'category' },
  ];

  const mockDateColumns: VisColumn[] = [
    { id: 4, name: 'timestamp', schema: VisFieldType.Date, column: 'timestamp' },
  ];

  const mockCategoryAxes: CategoryAxis[] = [
    {
      id: 'CategoryAxis-1',
      type: 'category',
      position: Positions.BOTTOM,
      show: true,
      labels: {
        show: true,
        filter: true,
        rotate: 0,
        truncate: 100,
      },
      title: {
        text: 'Category Axis',
      },
    },
  ];

  const mockValueAxes: ValueAxis[] = [
    {
      id: 'ValueAxis-1',
      name: 'LeftAxis-1',
      type: 'value',
      position: Positions.LEFT,
      show: true,
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: {
        text: 'Value Axis',
      },
    },
  ];

  const defaultProps = {
    categoryAxes: mockCategoryAxes,
    valueAxes: mockValueAxes,
    onCategoryAxesChange: jest.fn(),
    onValueAxesChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: mockCategoricalColumns,
    dateColumns: mockDateColumns,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(<AxesOptions {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('renders category axis section', () => {
    render(<AxesOptions {...defaultProps} />);
    expect(screen.getByText('Category Axis (X-Axis)')).toBeInTheDocument();
  });

  it('renders value axis section', () => {
    render(<AxesOptions {...defaultProps} />);
    expect(screen.getByText('Value Axes (Y-Axes)')).toBeInTheDocument();
  });

  it('calls onCategoryAxesChange when position is changed', () => {
    render(<AxesOptions {...defaultProps} />);
    const positionSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(positionSelect, { target: { value: Positions.TOP } });

    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith([
      {
        ...mockCategoryAxes[0],
        position: Positions.TOP,
      },
    ]);
  });

  it('calls onCategoryAxesChange when show is toggled', () => {
    render(<AxesOptions {...defaultProps} />);
    const showSwitch = screen.getAllByRole('switch')[0];
    fireEvent.click(showSwitch);

    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith([
      {
        ...mockCategoryAxes[0],
        show: false,
      },
    ]);
  });

  it('calls onValueAxesChange when show is toggled', () => {
    render(<AxesOptions {...defaultProps} />);
    const showSwitch = screen.getAllByRole('switch')[2];
    fireEvent.click(showSwitch);

    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith([
      {
        ...mockValueAxes[0],
        show: false,
      },
    ]);
  });

  it('updates axis title with debounced value', async () => {
    render(<AxesOptions {...defaultProps} />);
    const titleInput = screen.getAllByRole('textbox')[0];
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    await waitFor(() => {
      expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith([
        {
          ...mockCategoryAxes[0],
          title: { ...mockCategoryAxes[0].title, text: 'New Title' },
        },
      ]);
    });
  });

  it('updates label rotation when alignment is changed', () => {
    render(<AxesOptions {...defaultProps} />);
    // Find all comboboxes and get the alignment select (usually the third one)
    const comboboxes = screen.getAllByRole('combobox');
    // Find the one that has options for alignment
    const alignmentSelect = comboboxes.find(
      (select) =>
        select.innerHTML.includes('horizontal') ||
        select.innerHTML.includes('vertical') ||
        select.innerHTML.includes('angled')
    );

    if (!alignmentSelect) {
      throw new Error('Alignment select not found');
    }

    fireEvent.change(alignmentSelect, { target: { value: 'vertical' } });

    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ rotate: -90 }),
        }),
      ])
    );
  });

  it('updates truncate value with debounced value', async () => {
    render(<AxesOptions {...defaultProps} />);
    const truncateInput = screen.getAllByRole('spinbutton')[0];
    fireEvent.change(truncateInput, { target: { value: '50' } });

    await waitFor(() => {
      expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith([
        {
          ...mockCategoryAxes[0],
          labels: { ...mockCategoryAxes[0].labels, truncate: 50 },
        },
      ]);
    });
  });

  it('handles Rule 2 scenario with 2 value axes', () => {
    const rule2Props = {
      ...defaultProps,
      categoricalColumns: [],
      numericalColumns: [
        { id: 1, name: 'Bar Chart Metric', schema: VisFieldType.Numerical, column: 'count' },
        { id: 2, name: 'Line Chart Metric', schema: VisFieldType.Numerical, column: 'price' },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: Positions.LEFT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Bar Chart Metric',
          },
        },
        {
          id: 'ValueAxis-2',
          name: 'RightAxis-1',
          type: 'value',
          position: Positions.RIGHT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Line Chart Metric',
          },
        },
      ] as ValueAxis[],
    };

    render(<AxesOptions {...rule2Props} />);

    expect(screen.getByText('Left Y-Axis (Bar Chart)')).toBeInTheDocument();
    expect(screen.getByText('Right Y-Axis (Line Chart)')).toBeInTheDocument();
  });

  it('shows/hides label options based on show labels toggle', () => {
    render(<AxesOptions {...defaultProps} />);

    // Initially label options should be visible
    expect(screen.getAllByText('Aligned')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Truncate')[0]).toBeInTheDocument();

    // Toggle off show labels
    const showLabelsSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(showLabelsSwitch);

    // Check that the callback was called with the correct parameters
    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ show: false }),
        }),
      ])
    );
  });
});
