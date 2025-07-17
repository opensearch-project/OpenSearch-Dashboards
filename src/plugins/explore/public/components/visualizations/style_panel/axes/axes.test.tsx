/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AxesOptions } from './axes';
import { CategoryAxis, ValueAxis, VisColumn, VisFieldType, Positions } from '../../types';

// Mock the debounced value hooks
jest.mock('../../utils/use_debounced_value', () => {
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
    {
      id: 1,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    },
    {
      id: 2,
      name: 'price',
      schema: VisFieldType.Numerical,
      column: 'price',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 4,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 1,
      uniqueValuesCount: 1,
    },
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

  it('renders X axis section', () => {
    render(<AxesOptions {...defaultProps} />);
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
  });

  it('renders Y axis section', () => {
    render(<AxesOptions {...defaultProps} />);
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('calls onCategoryAxesChange when position is changed', () => {
    render(<AxesOptions {...defaultProps} />);
    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

    const buttonGroup = screen.getByRole('group', { name: 'Select axis position' });
    const topButton = within(buttonGroup).getByTestId('top');

    fireEvent.click(topButton);
    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith([
      {
        ...mockCategoryAxes[0],
        position: Positions.TOP,
      },
    ]);
  });

  it('calls onValueAxesChange when position is changed', () => {
    render(<AxesOptions {...defaultProps} />);
    const splitButton = screen.getByTestId('valueAxis-0-button');
    fireEvent.click(splitButton);

    const buttonGroup = screen.getByRole('group', { name: 'Select axis position' });
    const topButton = within(buttonGroup).getByTestId('left');

    fireEvent.click(topButton);
    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith([
      {
        ...mockValueAxes[0],
        position: Positions.LEFT,
      },
    ]);
  });

  it('calls onCategoryAxesChange when show is toggled', () => {
    render(<AxesOptions {...defaultProps} />);

    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

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

    const splitButton = screen.getByTestId('valueAxis-0-button');
    fireEvent.click(splitButton);

    const showSwitch = screen.getAllByRole('switch')[0];
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

    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

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

    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

    const comboboxes = screen.getAllByRole('combobox');

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
    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

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
        {
          id: 1,
          name: 'Bar Chart Metric',
          schema: VisFieldType.Numerical,
          column: 'count',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
        {
          id: 2,
          name: 'Line Chart Metric',
          schema: VisFieldType.Numerical,
          column: 'price',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
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

    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

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

  // New tests to improve coverage

  it('handles angled label rotation', () => {
    render(<AxesOptions {...defaultProps} />);

    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

    const comboboxes = screen.getAllByRole('combobox');
    const alignmentSelect = comboboxes.find((select) => select.innerHTML.includes('horizontal'));

    if (!alignmentSelect) {
      throw new Error('Alignment select not found');
    }

    fireEvent.change(alignmentSelect, { target: { value: 'angled' } });

    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ rotate: -45 }),
        }),
      ])
    );
  });

  it('uses default title when title text is empty', () => {
    const propsWithEmptyTitle = {
      ...defaultProps,
      categoryAxes: [
        {
          ...mockCategoryAxes[0],
          title: { text: '' },
        },
      ],
    };

    render(<AxesOptions {...propsWithEmptyTitle} />);
    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

    // Check that the title input has the default value (from the first date or categorical column)
    const titleInput = screen.getAllByRole('textbox')[0];
    expect(titleInput).toHaveValue('timestamp');
  });

  it('uses default value axis title when title text is empty', () => {
    const propsWithEmptyTitle = {
      ...defaultProps,
      valueAxes: [
        {
          ...mockValueAxes[0],
          title: { text: '' },
        },
      ],
    };

    render(<AxesOptions {...propsWithEmptyTitle} />);
    const splitButton = screen.getByTestId('valueAxis-0-button');
    fireEvent.click(splitButton);

    // Check that the title input has the default value (from the first numerical column)
    const titleInput = screen.getAllByRole('textbox')[0];
    expect(titleInput).toHaveValue('count');
  });

  it('handles Rule 2 scenario with incomplete value axes', () => {
    // Test the useEffect that ensures we have exactly 2 value axes for Rule 2
    const rule2Props = {
      ...defaultProps,
      categoricalColumns: [],
      dateColumns: [mockDateColumns[0]],
      numericalColumns: [
        {
          id: 1,
          name: 'Bar Chart Metric',
          schema: VisFieldType.Numerical,
          column: 'count',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
        {
          id: 2,
          name: 'Line Chart Metric',
          schema: VisFieldType.Numerical,
          column: 'price',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
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
      ] as ValueAxis[],
    };

    render(<AxesOptions {...rule2Props} />);

    // The useEffect should have added a second value axis
    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          position: Positions.LEFT,
        }),
        expect.objectContaining({
          position: Positions.RIGHT,
        }),
      ])
    );
  });

  it('handles Rule 2 scenario with incorrect axis positions', () => {
    // Test the useEffect that ensures correct positions for Rule 2
    const rule2Props = {
      ...defaultProps,
      categoricalColumns: [],
      dateColumns: [mockDateColumns[0]],
      numericalColumns: [
        {
          id: 1,
          name: 'Bar Chart Metric',
          schema: VisFieldType.Numerical,
          column: 'count',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
        {
          id: 2,
          name: 'Line Chart Metric',
          schema: VisFieldType.Numerical,
          column: 'price',
          validValuesCount: 1,
          uniqueValuesCount: 1,
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value',
          position: Positions.RIGHT, // Incorrect position
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
          position: Positions.LEFT, // Incorrect position
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

    // The useEffect should have corrected the positions
    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'ValueAxis-1',
          position: Positions.LEFT,
        }),
        expect.objectContaining({
          id: 'ValueAxis-2',
          position: Positions.RIGHT,
        }),
      ])
    );
  });

  it('handles null props gracefully', () => {
    const nullProps = {
      categoryAxes: null,
      valueAxes: null,
      onCategoryAxesChange: null,
      onValueAxesChange: null,
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
    };

    // @ts-ignore - Testing with null props
    const { container } = render(<AxesOptions {...nullProps} />);
    expect(container).toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('displays correct default title for category axis with no columns', () => {
    const propsWithNoColumns = {
      ...defaultProps,
      dateColumns: [],
      categoricalColumns: [],
      categoryAxes: [
        {
          ...mockCategoryAxes[0],
          title: { text: '' },
        },
      ],
    };

    render(<AxesOptions {...propsWithNoColumns} />);
    const splitButton = screen.getByTestId('categoryAxis-0-button');
    fireEvent.click(splitButton);

    // Check that the title input has the default value "Category"
    const titleInput = screen.getAllByRole('textbox')[0];
    expect(titleInput).toHaveValue('Category');
  });

  it('displays correct default title for value axis with no columns', () => {
    const propsWithNoColumns = {
      ...defaultProps,
      numericalColumns: [],
      valueAxes: [
        {
          ...mockValueAxes[0],
          title: { text: '' },
        },
      ],
    };

    render(<AxesOptions {...propsWithNoColumns} />);
    const splitButton = screen.getByTestId('valueAxis-0-button');
    fireEvent.click(splitButton);

    // Check that the title input has the default value "Metric 1"
    const titleInput = screen.getAllByRole('textbox')[0];
    expect(titleInput).toHaveValue('Metric 1');
  });

  it('handles multiple category axes', () => {
    const propsWithMultipleAxes = {
      ...defaultProps,
      categoryAxes: [
        mockCategoryAxes[0],
        {
          id: 'CategoryAxis-2',
          type: 'category' as const,
          position: Positions.TOP,
          show: true,
          labels: {
            show: true,
            filter: true,
            rotate: 0,
            truncate: 100,
          },
          title: {
            text: 'Second Category Axis',
          },
        } as CategoryAxis,
      ],
    };

    render(<AxesOptions {...propsWithMultipleAxes} />);

    // Should render both axes
    const buttons = screen.getAllByTestId(/categoryAxis-\d-button/);
    expect(buttons).toHaveLength(2);

    // Click on the second axis button
    fireEvent.click(buttons[1]);

    // Check that the title is displayed correctly
    expect(screen.getByDisplayValue('Second Category Axis')).toBeInTheDocument();
  });

  it('handles multiple value axes', () => {
    const propsWithMultipleAxes = {
      ...defaultProps,
      valueAxes: [
        mockValueAxes[0],
        {
          id: 'ValueAxis-2',
          name: 'RightAxis-1',
          type: 'value' as const,
          position: Positions.RIGHT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'Second Value Axis',
          },
        } as ValueAxis,
      ],
    };

    render(<AxesOptions {...propsWithMultipleAxes} />);

    // Should render both axes
    const buttons = screen.getAllByTestId(/valueAxis-\d-button/);
    expect(buttons).toHaveLength(2);

    // Click on the second axis button
    fireEvent.click(buttons[1]);

    // Check that the title is displayed correctly
    expect(screen.getByDisplayValue('Second Value Axis')).toBeInTheDocument();
  });
});
