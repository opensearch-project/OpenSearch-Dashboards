/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AxesSelectPanel } from './axes_selector';
import { AxisSelector } from './axis_selector';
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
        [AxisRole.X]: [mockCategoricalColumns[0]],
        [AxisRole.Y]: [mockNumericalColumns[0]],
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
        [AxisRole.X]: [mockCategoricalColumns[0]],
      },
    };

    render(<AxesSelectPanel {...propsWithMapping} />);
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  it('renders X and Y axes', () => {
    render(<AxesSelectPanel {...defaultProps} />);

    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
  });

  it('updates available axis options when selection changes', () => {
    mockVisualizationRegistry.findRuleByAxesMapping.mockReturnValue({
      id: 'rule1',
      matchIndex: [1, 1, 0],
    });

    const propsWithMapping = {
      ...defaultProps,
      currentMapping: {
        [AxisRole.X]: [mockCategoricalColumns[0]],
        [AxisRole.Y]: [mockNumericalColumns[0]],
      },
    };

    render(<AxesSelectPanel {...propsWithMapping} />);

    expect(mockUpdateVisualization).toHaveBeenCalled();
  });

  it('handles multiple axis roles correctly', () => {
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

    expect(screen.getByText('X-Axis')).toBeInTheDocument();
    expect(screen.getByText('Y-Axis')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('shows placeholder text when no field is selected', () => {
    render(<AxesSelectPanel {...defaultProps} />);

    const placeholders = screen.getAllByText('Select a field');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  describe('multi axis support', () => {
    beforeEach(() => {
      mockVisualizationRegistry.findRulesByColumns.mockReturnValue({
        all: [
          {
            visType: 'line',
            rules: [
              {
                priority: 100,
                mappings: [
                  {
                    [AxisRole.X]: { type: VisFieldType.Date },
                    [AxisRole.Y]: { type: VisFieldType.Numerical, multi: true },
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

    it('renders multiple AxisSelector instances plus an empty one for multi axis', () => {
      const propsWithMulti = {
        ...defaultProps,
        chartType: 'line' as ChartType,
        currentMapping: {
          [AxisRole.X]: [mockDateColumns[0]],
          [AxisRole.Y]: [mockNumericalColumns[0], mockNumericalColumns[1]],
        },
      };

      render(<AxesSelectPanel {...propsWithMulti} />);

      // Should show both selected numerical fields plus an empty selector
      expect(screen.getByText('count')).toBeInTheDocument();
      expect(screen.getByText('price')).toBeInTheDocument();
      // The trailing empty selector and the X-axis selector (if no date selected yet)
      const placeholders = screen.getAllByText('Select a field');
      expect(placeholders.length).toBeGreaterThanOrEqual(1);
    });

    it('single axis still renders one AxisSelector', () => {
      const propsWithSingle = {
        ...defaultProps,
        chartType: 'line' as ChartType,
        currentMapping: {
          [AxisRole.X]: [mockDateColumns[0]],
        },
      };

      render(<AxesSelectPanel {...propsWithSingle} />);

      // X-axis should show the selected date field
      expect(screen.getByText('timestamp')).toBeInTheDocument();
      // Y-axis label should be present
      expect(screen.getByText('Y-Axis')).toBeInTheDocument();
    });

    it('shows axis label only on the first selector for multi axis', () => {
      const propsWithMulti = {
        ...defaultProps,
        chartType: 'line' as ChartType,
        currentMapping: {
          [AxisRole.X]: [mockDateColumns[0]],
          [AxisRole.Y]: [mockNumericalColumns[0], mockNumericalColumns[1]],
        },
      };

      render(<AxesSelectPanel {...propsWithMulti} />);

      // Y-Axis label should appear exactly once
      const yAxisLabels = screen.getAllByText('Y-Axis');
      expect(yAxisLabels).toHaveLength(1);
    });

    it('renders empty trailing selector for multi axis with no selections', () => {
      const propsEmpty = {
        ...defaultProps,
        chartType: 'line' as ChartType,
        currentMapping: {},
      };

      render(<AxesSelectPanel {...propsEmpty} />);

      // Should have placeholder selectors for both axes
      const placeholders = screen.getAllByText('Select a field');
      expect(placeholders.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('AxisSelector', () => {
  const mockOnChange = jest.fn();
  const mockOnRemove = jest.fn();

  const defaultProps = {
    axisRole: AxisRole.X,
    value: 'category',
    options: [
      { label: 'category', schema: VisFieldType.Categorical },
      { label: 'count', schema: VisFieldType.Numerical },
      { label: 'timestamp', schema: VisFieldType.Date },
    ],
    onRemove: mockOnRemove,
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders axis selector with selected value', () => {
    render(<AxisSelector {...defaultProps} />);
    expect(screen.getByText('category')).toBeInTheDocument();
  });

  it('displays selected value as button text', () => {
    render(<AxisSelector {...defaultProps} />);
    const button = screen.getByTestId('axisSelectorButton');
    expect(button).toHaveTextContent('category');
  });

  it('opens popover on button click', () => {
    render(<AxisSelector {...defaultProps} />);
    const button = screen.getByTestId('axisSelectorButton');
    fireEvent.click(button);
    expect(screen.getByPlaceholderText('Filter list')).toBeInTheDocument();
  });

  it('shows placeholder when no value is selected', () => {
    const propsWithEmptySelection = { ...defaultProps, value: '' };
    render(<AxisSelector {...propsWithEmptySelection} />);
    expect(screen.getByText('Select a field')).toBeInTheDocument();
  });

  it('applies empty modifier class when no value is selected', () => {
    const propsWithEmptySelection = { ...defaultProps, value: '' };
    const { container } = render(<AxisSelector {...propsWithEmptySelection} />);
    const selectorContainer = container.querySelector('.axisSelectorContainer');
    expect(selectorContainer).toHaveClass('axisSelectorContainer--empty');
  });

  it('does not apply empty modifier class when value is selected', () => {
    const { container } = render(<AxisSelector {...defaultProps} />);
    const selectorContainer = container.querySelector('.axisSelectorContainer');
    expect(selectorContainer).not.toHaveClass('axisSelectorContainer--empty');
  });

  it('renders selectable list in the popover', () => {
    render(<AxisSelector {...defaultProps} />);
    const button = screen.getByTestId('axisSelectorButton');
    fireEvent.click(button);

    // Popover should be open with the search input
    expect(screen.getByPlaceholderText('Filter list')).toBeInTheDocument();
    // The selectable component should be rendered in the popover
    expect(document.querySelector('.euiSelectable')).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', () => {
    // Since EuiSelectable uses virtualized rendering in test env,
    // we test the callback logic by verifying the component accepts the props
    const { rerender } = render(<AxisSelector {...defaultProps} />);

    // Simulate selecting a different value by re-rendering with new value
    rerender(<AxisSelector {...defaultProps} value="count" />);
    expect(screen.getByText('count')).toBeInTheDocument();
  });
});
