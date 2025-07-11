/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AxesSelectPanel, AxisSelector } from './axes_selector';
import { AxisRole, VisColumn, VisFieldType } from '../../types';
import { ChartType } from '../../utils/use_visualization_types';

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
  ],
}));

jest.mock('../../visualization_container_utils', () => ({
  getColumnMatchFromMapping: jest.fn(() => [1, 1, 0]),
}));

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
  ];

  const mockCategoricalColumns: VisColumn[] = [
    {
      id: 2,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 100,
      uniqueValuesCount: 10,
    },
  ];

  const mockDateColumns: VisColumn[] = [
    {
      id: 3,
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
            mapping: [
              {
                [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
                [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              },
            ],
          },
        ],
      },
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<AxesSelectPanel {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('returns null when no available mappings', () => {
    mockVisualizationRegistry.getVisualizationConfig.mockReturnValue({
      ui: { availableMappings: [] },
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
        label: 'Categorical Fields',
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
    expect(screen.getByText('Split Chart By')).toBeInTheDocument();
  });

  it('handles empty selected column', () => {
    const propsWithEmptySelection = { ...defaultProps, selectedColumn: '' };
    render(<AxisSelector {...propsWithEmptySelection} />);

    const input = screen.getByTestId('comboBoxSearchInput');
    expect(input).toHaveValue('');
  });
});
