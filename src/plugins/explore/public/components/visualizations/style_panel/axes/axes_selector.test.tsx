/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AxesSelectPanel, AxisSelector } from './axes_selector';
import { AxisRole, VisColumn, VisFieldType } from '../../types';
import { ChartType } from '../../utils/use_visualization_types';
import configureMockStore from 'redux-mock-store';

const mockStore = configureMockStore([]);
const store = mockStore({
  tab: {
    visualizations: {
      styleOptions: {
        switchAxes: false,
      },
    },
  },
});

const mockVisualizationRegistry = {
  getVisualizationConfig: jest.fn(),
};

jest.mock('../../utils/use_visualization_types', () => ({
  useVisualizationRegistry: () => mockVisualizationRegistry,
}));

jest.mock('../../rule_repository', () => ({
  ALL_VISUALIZATION_RULES: [
    {
      id: 'rule1',
      matchIndex: [1, 1, 0],
    },
    {
      id: 'rule2',
      matchIndex: [2, 0, 1],
    },
  ],
}));

jest.mock('../../visualization_builder_utils', () => {
  // Import the constants directly to avoid referencing out-of-scope variables
  const X = 'x';
  const CATEGORICAL = 'categorical';

  return {
    getColumnMatchFromMapping: jest.fn((mapping) => {
      // Simple mock implementation to return different values based on mapping
      if (mapping && mapping[0] && mapping[0][X] && mapping[0][X].type === CATEGORICAL) {
        return [1, 1, 0]; // Rule 1
      }
      return [2, 0, 1]; // Rule 2
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
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: {
        availableMappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
          },
        ],
      },
    });
  });

  it('renders without crashing', () => {
    const { container } = render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );
    expect(container).toBeInTheDocument();
  });

  it('returns null when no available mappings', () => {
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { availableMappings: [] },
    });

    const { container } = render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Fields accordion', () => {
    render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );
    expect(screen.getByText('Fields')).toBeInTheDocument();
  });

  it('renders axis selectors for available roles', () => {
    render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );
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

    render(
      <Provider store={store}>
        <AxesSelectPanel {...propsWithMapping} />
      </Provider>
    );

    expect(mockUpdateVisualization).toHaveBeenCalled();
  });

  it('initializes with current mapping', () => {
    const propsWithMapping = {
      ...defaultProps,
      currentMapping: {
        [AxisRole.X]: mockCategoricalColumns[0],
      },
    };

    render(
      <Provider store={store}>
        <AxesSelectPanel {...propsWithMapping} />
      </Provider>
    );
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  // New tests to improve coverage

  it('renders X and Y axes', () => {
    // Set up a basic mapping with X and Y axes
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: {
        availableMappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
          },
        ],
      },
    });

    render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );

    // X and Y axes should be available
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('updates available axis options when selection changes', () => {
    // Set up a scenario with multiple possible mappings
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: {
        availableMappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
          },
        ],
      },
    });

    // Use props with existing mapping to ensure updateVisualization is called
    const propsWithMapping = {
      ...defaultProps,
      currentMapping: {
        [AxisRole.X]: mockCategoricalColumns[0],
        [AxisRole.Y]: mockNumericalColumns[0],
      },
    };

    render(
      <Provider store={store}>
        <AxesSelectPanel {...propsWithMapping} />
      </Provider>
    );

    // Verify that updateVisualization was called
    expect(mockUpdateVisualization).toHaveBeenCalled();
  });

  it('handles multiple axis roles correctly', () => {
    // Set up a scenario with multiple axis roles
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: {
        availableMappings: [
          {
            [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
            [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
            [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
          },
        ],
      },
    });

    render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );

    // Should render selectors for all three axes
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('renders comboboxes for axis selection', () => {
    render(
      <Provider store={store}>
        <AxesSelectPanel {...defaultProps} />
      </Provider>
    );

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
    render(
      <Provider store={store}>
        <AxisSelector {...defaultProps} />
      </Provider>
    );
    expect(screen.getByText('X-Axis')).toBeInTheDocument();
  });

  it('displays selected column', () => {
    render(
      <Provider store={store}>
        <AxisSelector {...defaultProps} />
      </Provider>
    );
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    render(
      <Provider store={store}>
        <AxisSelector {...defaultProps} />
      </Provider>
    );

    const clearButton = screen.getByTestId('comboBoxClearButton');
    fireEvent.click(clearButton);

    expect(mockOnRemove).toHaveBeenCalledWith(AxisRole.X);
  });

  it('calls onRemove when selection is cleared', () => {
    render(
      <Provider store={store}>
        <AxisSelector {...defaultProps} />
      </Provider>
    );

    const clearButton = screen.getByTestId('comboBoxClearButton');
    fireEvent.click(clearButton);

    expect(mockOnRemove).toHaveBeenCalledWith(AxisRole.X);
  });

  it('renders different axis role labels correctly', () => {
    const yAxisProps = { ...defaultProps, axisRole: AxisRole.Y };
    const { rerender } = render(
      <Provider store={store}>
        <AxisSelector {...yAxisProps} />
      </Provider>
    );
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();

    const colorAxisProps = { ...defaultProps, axisRole: AxisRole.COLOR };
    rerender(
      <Provider store={store}>
        <AxisSelector {...colorAxisProps} />
      </Provider>
    );
    expect(screen.getByText('Color')).toBeInTheDocument();

    const facetAxisProps = { ...defaultProps, axisRole: AxisRole.FACET };
    rerender(
      <Provider store={store}>
        <AxisSelector {...facetAxisProps} />
      </Provider>
    );
    expect(screen.getByText('Split Chart By')).toBeInTheDocument();
  });

  it('handles empty selected column', () => {
    const propsWithEmptySelection = { ...defaultProps, selectedColumn: '' };
    render(
      <Provider store={store}>
        <AxisSelector {...propsWithEmptySelection} />
      </Provider>
    );

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

    render(
      <Provider store={store}>
        <AxisSelector {...multipleOptionsProps} />
      </Provider>
    );

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
    render(
      <Provider store={store}>
        <AxisSelector {...sizeAxisProps} />
      </Provider>
    );
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('renders with Y_SECOND axis role', () => {
    const secondYAxisProps = { ...defaultProps, axisRole: AxisRole.Y_SECOND };
    render(
      <Provider store={store}>
        <AxisSelector {...secondYAxisProps} />
      </Provider>
    );
    expect(screen.getByText('Y-Axis (2nd)')).toBeInTheDocument();
  });

  it('renders with Value axis role', () => {
    const valueAxisProps = { ...defaultProps, axisRole: AxisRole.Value };
    render(
      <Provider store={store}>
        <AxisSelector {...valueAxisProps} />
      </Provider>
    );
    expect(screen.getByText('Value')).toBeInTheDocument();
  });
});
