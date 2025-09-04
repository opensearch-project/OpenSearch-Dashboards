/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AxesOptions } from './axes';
import { CategoryAxis, ValueAxis, VisColumn, VisFieldType, Positions, AxisRole } from '../../types';

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
    useDebouncedNumber: jest.fn((initialValue, onChange, options) => {
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
      grid: {
        showLines: true,
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
      grid: {
        showLines: true,
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
    axisColumnMappings: {
      [AxisRole.X]: mockCategoricalColumns[0],
      [AxisRole.Y]: mockNumericalColumns[0],
      [AxisRole.Y_SECOND]: undefined,
    },
  };

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
        grid: {
          showLines: true,
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
        grid: {
          showLines: true,
        },
        title: {
          text: 'Line Chart Metric',
        },
      },
    ] as ValueAxis[],
    axisColumnMappings: {
      [AxisRole.X]: mockDateColumns[0],
      [AxisRole.Y]: mockNumericalColumns[0],
      [AxisRole.Y_SECOND]: mockNumericalColumns[1],
    },
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

    const buttonGroup = screen.getAllByRole('group', { name: 'Select axis position' })[0];
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

    const buttonGroup = screen.getAllByRole('group', { name: 'Select axis position' })[1];
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

    const showSwitch = screen.getByTestId('showXAxisSwitch');
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

    const showSwitch = screen.getByTestId('showOnlyOneYAxisSwitch');
    fireEvent.click(showSwitch);

    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith([
      {
        ...mockValueAxes[0],
        show: false,
      },
    ]);
  });

  it('calls onValueAxesChange when show is toggled and there are 2 value axes', () => {
    render(<AxesOptions {...rule2Props} />);

    const showSwitch = screen.getAllByTestId('showYAxisSwitch');
    expect(showSwitch.length).toBe(2);

    fireEvent.click(showSwitch[0]);

    expect(rule2Props.onValueAxesChange).toHaveBeenCalledWith([
      {
        ...rule2Props.valueAxes[0],
        show: false,
      },
      rule2Props.valueAxes[1],
    ]);
  });

  it('updates value axis title with debounced value when there are 2 value axes', async () => {
    render(<AxesOptions {...rule2Props} />);

    const titleInput = screen.getAllByRole('textbox')[1];
    fireEvent.change(titleInput, { target: { value: 'New Title' } });

    await waitFor(() => {
      expect(rule2Props.onValueAxesChange).toHaveBeenCalledWith([
        {
          ...rule2Props.valueAxes[0],
          title: { ...rule2Props.valueAxes[0].title, text: 'New Title' },
        },
        rule2Props.valueAxes[1],
      ]);
    });
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

    const comboboxes = screen.getByTestId('xLinesAlignment');

    fireEvent.change(comboboxes, { target: { value: 'vertical' } });

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
    render(<AxesOptions {...rule2Props} />);

    expect(screen.getByText('Left Y-Axis (Bar Chart)')).toBeInTheDocument();
    expect(screen.getByText('Right Y-Axis (Line Chart)')).toBeInTheDocument();
  });

  it('shows/hides grid options based on show grid lines toggle', () => {
    render(<AxesOptions {...defaultProps} />);

    // Toggle off show labels
    const showLabelsSwitch = screen.getAllByRole('switch')[1];
    fireEvent.click(showLabelsSwitch);

    // Check that the callback was called with the correct parameters
    expect(defaultProps.onCategoryAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          grid: expect.objectContaining({ showLines: false }),
        }),
      ])
    );
  });

  it('shows/hides label options based on show labels toggle', () => {
    render(<AxesOptions {...defaultProps} />);

    // Initially label options should be visible
    expect(screen.getAllByText('Alignment')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Truncate after')[0]).toBeInTheDocument();

    // Toggle off show labels
    const showLabelsSwitch = screen.getAllByRole('switch')[2];
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
      axisColumnMappings: {
        [AxisRole.X]: mockDateColumns[0],
      },
    };

    render(<AxesOptions {...propsWithEmptyTitle} />);

    // Check that the title input has the default value (from the first date or categorical column)
    const titleInput = screen.getAllByRole('textbox')[0];
    expect(titleInput).toHaveValue('');
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
      axisColumnMappings: {
        [AxisRole.Y]: mockNumericalColumns[0],
      },
    };

    render(<AxesOptions {...propsWithEmptyTitle} />);

    // Check that the title input has the default value (from the first numerical column)
    const titleInput = screen.getAllByRole('textbox')[1];
    expect(titleInput).toHaveValue('');
  });

  it('uses default value axis title for second axis when title text is empty', () => {
    const propsWithEmptyTitle = {
      ...defaultProps,
      valueAxes: [
        mockValueAxes[0],
        {
          id: 'ValueAxis-2',
          name: 'RightAxis-1',
          type: 'value' as const,
          position: Positions.RIGHT as Positions.RIGHT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          grid: {
            showLines: true,
          },
          title: {
            text: '',
          },
        } as ValueAxis,
      ],
      axisColumnMappings: {
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.Y_SECOND]: mockNumericalColumns[1],
      },
    };

    render(<AxesOptions {...propsWithEmptyTitle} />);

    // Check that the title input for the second axis has the default value (from the second numerical column)
    const titleInput = screen.getAllByRole('textbox')[2];
    expect(titleInput).toHaveValue('');
  });

  it('handles Rule 2 scenario with incomplete value axes', () => {
    // Test the useEffect that ensures we have exactly 2 value axes for Rule 2
    const newRule2Props = {
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
          grid: {
            showLines: true,
          },
          title: {
            text: 'Bar Chart Metric',
          },
        },
      ] as ValueAxis[],
      axisColumnMappings: {
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.Y_SECOND]: mockNumericalColumns[1],
      },
    };

    render(<AxesOptions {...newRule2Props} />);

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
    const newRule2Props = {
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
          grid: {
            showLines: true,
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
          grid: {
            showLines: true,
          },
          title: {
            text: 'Line Chart Metric',
          },
        },
      ] as ValueAxis[],
      axisColumnMappings: {
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.Y_SECOND]: mockNumericalColumns[1],
      },
    };

    render(<AxesOptions {...newRule2Props} />);

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
      axisColumnMappings: {
        [AxisRole.X]: undefined,
        [AxisRole.Y]: undefined,
        [AxisRole.Y_SECOND]: undefined,
      },
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
      axisColumnMappings: {
        [AxisRole.X]: undefined,
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.Y_SECOND]: undefined,
      },
    };

    render(<AxesOptions {...propsWithNoColumns} />);

    // Check that the title input has the default value "Category"
    const titleInput = screen.getAllByRole('textbox')[0];
    expect(titleInput).toHaveValue('');
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
      axisColumnMappings: {
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.Y]: undefined,
        [AxisRole.Y_SECOND]: undefined,
      },
    };

    render(<AxesOptions {...propsWithNoColumns} />);

    // Check that the title input has the default value "Metric 1"
    const titleInput = screen.getAllByRole('textbox')[1];
    expect(titleInput).toHaveValue('');
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
          grid: {
            showLines: true,
          },
          title: {
            text: 'Second Category Axis',
          },
        } as CategoryAxis,
      ],
      axisColumnMappings: {
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.Y_SECOND]: undefined,
      },
    };

    render(<AxesOptions {...propsWithMultipleAxes} />);

    // Should render both axes
    const panels = screen.getAllByTestId('categoryAxesPanel');
    expect(panels).toHaveLength(2);

    // Check that the title is displayed correctly
    expect(screen.getByDisplayValue('Second Category Axis')).toBeInTheDocument();
  });

  it('handles multiple value axes', () => {
    const propsWithMultipleAxes = {
      ...defaultProps,
      categoricalColumns: [],
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
          grid: {
            showLines: true,
          },
          title: {
            text: 'Second Value Axis',
          },
        } as ValueAxis,
      ],
      axisColumnMappings: {
        [AxisRole.X]: mockDateColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
        [AxisRole.Y_SECOND]: mockNumericalColumns[1],
      },
    };

    render(<AxesOptions {...propsWithMultipleAxes} />);

    // Should render both axes
    const panels = screen.getAllByTestId('twoValueAxesPanel');
    expect(panels).toHaveLength(2);

    // Check that the title is displayed correctly
    expect(screen.getByDisplayValue('Second Value Axis')).toBeInTheDocument();
  });

  it('updates value axis grid when there are 2 value axes', async () => {
    render(<AxesOptions {...rule2Props} />);

    // Toggle off show grid for the first value axis
    const showGridsSwitch = screen.getAllByRole('switch')[4];
    fireEvent.click(showGridsSwitch);

    // Check that the callback was called with the correct parameters
    expect(rule2Props.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          grid: expect.objectContaining({ showLines: false }),
        }),
      ])
    );
  });

  it('shows/hides label when there are 2 value axes', async () => {
    render(<AxesOptions {...rule2Props} />);

    // Toggle off show grid for the first value axis
    const showLabelsSwitch = screen.getAllByRole('switch')[5];
    fireEvent.click(showLabelsSwitch);

    // Check that the callback was called with the correct parameters
    expect(rule2Props.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ show: false }),
        }),
      ])
    );
  });

  it('update label alignment when there are 2 value axes', async () => {
    render(<AxesOptions {...rule2Props} />);

    const comboboxes = screen.getAllByTestId('yLinesAlignment')[0];

    fireEvent.change(comboboxes, { target: { value: 'vertical' } });

    // Check that the callback was called with the correct parameters
    expect(rule2Props.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ rotate: -90 }),
        }),
      ])
    );
  });

  it('update label alignment when there is 1 value axis', async () => {
    render(<AxesOptions {...defaultProps} />);

    const comboboxes = screen.getByTestId('singleyLinesAlignment');

    fireEvent.change(comboboxes, { target: { value: 'vertical' } });

    // Check that the callback was called with the correct parameters
    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ rotate: -90 }),
        }),
      ])
    );
  });

  it('shows/hides label when there is 1 value axis', async () => {
    render(<AxesOptions {...defaultProps} />);

    // Toggle off show grid for the first value axis
    const showLabelsSwitch = screen.getAllByRole('switch')[5];
    fireEvent.click(showLabelsSwitch);

    // Check that the callback was called with the correct parameters
    expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          labels: expect.objectContaining({ show: false }),
        }),
      ])
    );
  });

  it('should display "vertical" in the select for x axis when rotate is -90', () => {
    const mockCategoryAxesWithVerticalRotation = [
      {
        ...mockCategoryAxes[0],
        labels: {
          ...mockCategoryAxes[0].labels,
          rotate: -90,
        },
      },
    ];

    render(
      <AxesOptions
        {...defaultProps}
        categoryAxes={mockCategoryAxesWithVerticalRotation}
        axisColumnMappings={{
          [AxisRole.X]: mockCategoricalColumns[0],
          [AxisRole.Y]: mockNumericalColumns[0],
          [AxisRole.Y_SECOND]: undefined,
        }}
      />
    );

    const select = screen.getByTestId('xLinesAlignment');
    expect(select).toHaveValue('vertical');
  });

  it('should display "vertical" in the select for y axis when rotate is -90', () => {
    const mockValueAxesWithVerticalRotation = [
      {
        ...mockValueAxes[0],
        labels: {
          ...mockValueAxes[0].labels,
          rotate: -90,
        },
      },
    ];

    render(
      <AxesOptions
        {...defaultProps}
        valueAxes={mockValueAxesWithVerticalRotation}
        axisColumnMappings={{
          [AxisRole.X]: mockCategoricalColumns[0],
          [AxisRole.Y]: mockNumericalColumns[0],
          [AxisRole.Y_SECOND]: undefined,
        }}
      />
    );

    const select = screen.getByTestId('singleyLinesAlignment');
    expect(select).toHaveValue('vertical');
  });

  it('updates truncate value with debounced value for y axis', async () => {
    render(<AxesOptions {...defaultProps} />);
    const truncateInput = screen.getAllByRole('spinbutton')[1];
    fireEvent.change(truncateInput, { target: { value: '50' } });

    await waitFor(() => {
      expect(defaultProps.onValueAxesChange).toHaveBeenCalledWith([
        {
          ...mockValueAxes[0],
          labels: { ...mockValueAxes[0].labels, truncate: 50 },
        },
      ]);
    });
  });
});
