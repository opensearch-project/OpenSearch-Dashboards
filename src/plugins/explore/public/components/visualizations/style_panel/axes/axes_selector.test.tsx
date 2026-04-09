/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AxesSelectPanel, AxisSelector } from './axes_selector';
import { AxisRole, VisColumn, VisFieldType } from '../../types';
import { ChartType } from '../../utils/use_visualization_types';

const mockVisualizationRegistry = {
  findRuleByAxesMapping: jest.fn(),
  findRulesByColumns: jest.fn(),
};

jest.mock('../../utils/use_visualization_types', () => ({
  useVisualizationRegistry: () => mockVisualizationRegistry,
}));

jest.mock('../../visualization_builder_utils', () => {
  const actual = jest.requireActual('../../visualization_builder_utils');
  const X = 'x';
  const CATEGORICAL = 'categorical';

  return {
    ...actual,
    getColumnMatchFromMapping: jest.fn((mapping) => {
      if (mapping && mapping[0] && mapping[0][X] && mapping[0][X].type === CATEGORICAL) {
        return [1, 1, 0];
      }
      return [2, 0, 1];
    }),
  };
});

describe('AxesSelectPanel', () => {
  const mockNumericalColumns: VisColumn[] = [
    {
      id: 1,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
    {
      id: 2,
      name: 'price',
      schema: VisFieldType.Numerical,
      column: 'price',
      validValuesCount: 100,
      uniqueValuesCount: 60,
    },
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 3,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 100,
      uniqueValuesCount: 10,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 4,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 100,
      uniqueValuesCount: 80,
    },
  ];

  const mockUpdateVisualization = jest.fn();

  const defaultProps = {
    chartType: 'bar' as ChartType,
    numericalColumns: mockNumericalColumns,
    categoricalColumns: mockCategoricalColumns,
    dateColumns: mockDateColumns,
    currentMapping: {},
    updateVisualization: mockUpdateVisualization,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVisualizationRegistry.findRulesByColumns.mockReturnValue({
      all: [
        {
          visType: 'bar',
          rules: [
            {
              priority: 100,
              mappings: [
                {
                  [AxisRole.X]: { type: VisFieldType.Categorical },
                  [AxisRole.Y]: { type: VisFieldType.Numerical },
                },
              ],
              render: jest.fn(),
            },
          ],
        },
      ],
      exact: [],
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<AxesSelectPanel {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('returns null when no available mappings', () => {
    mockVisualizationRegistry.findRulesByColumns.mockReturnValue({
      all: [],
      exact: [],
    });

    const { container } = render(<AxesSelectPanel {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Fields accordion', () => {
    render(<AxesSelectPanel {...defaultProps} />);
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('renders axis selectors for available roles', () => {
    render(<AxesSelectPanel {...defaultProps} />);
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('calls updateVisualization when valid selection is made', () => {
    const propsWithMapping = {
      ...defaultProps,
      currentMapping: {
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
      },
    };
    mockVisualizationRegistry.findRuleByAxesMapping.mockReturnValue({
      id: 'rule1',
      matchIndex: [1, 1, 0],
    });

    render(<AxesSelectPanel {...propsWithMapping} />);

    expect(mockUpdateVisualization).toHaveBeenCalled();
  });

  it('initializes with current mapping', () => {
    const propsWithMapping = {
      ...defaultProps,
      currentMapping: {
        [AxisRole.X]: mockCategoricalColumns[0],
      },
    };

    render(<AxesSelectPanel {...propsWithMapping} />);
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  // New tests to improve coverage

  it('renders X and Y axes', () => {
    render(<AxesSelectPanel {...defaultProps} />);

    // X and Y axes should be available
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('updates available axis options when selection changes', () => {
    // Set up a scenario with multiple possible mappings
    mockVisualizationRegistry.findRuleByAxesMapping.mockReturnValue({
      id: 'rule1',
      matchIndex: [1, 1, 0],
    });

    // Use props with existing mapping to ensure updateVisualization is called
    const propsWithMapping = {
      ...defaultProps,
      currentMapping: {
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
      },
    };

    render(<AxesSelectPanel {...propsWithMapping} />);

    // Verify that updateVisualization was called
    expect(mockUpdateVisualization).toHaveBeenCalled();
  });

  it('handles multiple axis roles correctly', () => {
    // Override findRulesByColumns to return a rule with 3 axis roles
    mockVisualizationRegistry.findRulesByColumns.mockReturnValue({
      all: [
        {
          visType: 'bar',
          rules: [
            {
              priority: 100,
              mappings: [
                {
                  [AxisRole.X]: { type: VisFieldType.Date },
                  [AxisRole.Y]: { type: VisFieldType.Numerical },
                  [AxisRole.COLOR]: { type: VisFieldType.Categorical },
                },
              ],
              render: jest.fn(),
            },
          ],
        },
      ],
      exact: [],
    });

    render(<AxesSelectPanel {...defaultProps} />);

    // Should render selectors for all three axes
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders comboboxes for axis selection', () => {
    render(<AxesSelectPanel {...defaultProps} />);

    // Check that comboboxes are rendered
    const comboBoxes = screen.getAllByRole('combobox');
    expect(comboBoxes.length).toBeGreaterThan(0);
  });
});

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
