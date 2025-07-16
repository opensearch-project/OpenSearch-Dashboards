/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';
import { defaultBarChartStyles } from './bar_vis_config';
import { Positions, VisColumn, VisFieldType, AxisRole } from '../types';

// Mock the child components
jest.mock('../style_panel/legend/legend', () => {
  // Import Positions inside the mock to avoid reference error
  const { Positions: PositionsEnum } = jest.requireActual('../types');

  return {
    LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange, shouldShowLegend }) => (
      <div data-test-subj="mockLegendOptionsPanel">
        <button
          data-test-subj="mockLegendShow"
          onClick={() => onLegendOptionsChange({ show: !legendOptions.show })}
        >
          Toggle Legend
        </button>
        <button
          data-test-subj="mockLegendPosition"
          onClick={() => onLegendOptionsChange({ position: PositionsEnum.BOTTOM })}
        >
          Change Position
        </button>
        <div data-test-subj="shouldShowLegend">{shouldShowLegend.toString()}</div>
      </div>
    )),
  };
});

jest.mock('../style_panel/threshold/threshold', () => ({
  ThresholdOptions: jest.fn(({ thresholdLines, onThresholdLinesChange }) => (
    <div data-test-subj="mockThresholdOptions">
      <button
        data-test-subj="mockUpdateThreshold"
        onClick={() => onThresholdLinesChange([...thresholdLines, { id: '2', show: true }])}
      >
        Update Threshold
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ tooltipOptions, onTooltipOptionsChange }) => (
    <div data-test-subj="mockTooltipOptionsPanel">
      <button
        data-test-subj="mockUpdateTooltip"
        onClick={() => onTooltipOptionsChange({ mode: 'hidden' })}
      >
        Update Tooltip
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/axes/axes_selector', () => ({
  AxesSelectPanel: jest.fn(
    ({
      numericalColumns,
      categoricalColumns,
      dateColumns,
      currentMapping,
      updateVisualization,
    }) => (
      <div data-test-subj="mockAxesSelectPanel">
        <button
          data-test-subj="mockUpdateVisualization"
          onClick={() => updateVisualization({ type: 'test' })}
        >
          Update Visualization
        </button>
      </div>
    )
  ),
}));

jest.mock('../style_panel/axes/axes', () => ({
  AxesOptions: jest.fn(
    ({
      categoryAxes,
      valueAxes,
      onCategoryAxesChange,
      onValueAxesChange,
      numericalColumns,
      categoricalColumns,
      dateColumns,
    }) => (
      <div data-test-subj="mockAxesOptions">
        <button
          data-test-subj="mockUpdateCategoryAxes"
          onClick={() => onCategoryAxesChange([...categoryAxes, { id: 'new-axis' }])}
        >
          Update Category Axes
        </button>
        <button
          data-test-subj="mockUpdateValueAxes"
          onClick={() => onValueAxesChange([...valueAxes, { id: 'new-axis' }])}
        >
          Update Value Axes
        </button>
      </div>
    )
  ),
}));

jest.mock('../style_panel/grid/grid', () => ({
  GridOptionsPanel: jest.fn(({ grid, onGridChange }) => (
    <div data-test-subj="mockGridOptionsPanel">
      <button
        data-test-subj="mockUpdateGrid"
        onClick={() => onGridChange({ ...grid, xLines: !grid.xLines })}
      >
        Update Grid
      </button>
    </div>
  )),
}));

jest.mock('./bar_exclusive_vis_options', () => ({
  BarExclusiveVisOptions: jest.fn(
    ({
      barWidth,
      barPadding,
      showBarBorder,
      barBorderWidth,
      barBorderColor,
      onBarWidthChange,
      onBarPaddingChange,
      onShowBarBorderChange,
      onBarBorderWidthChange,
      onBarBorderColorChange,
    }) => (
      <div data-test-subj="mockBarExclusiveVisOptions">
        <button data-test-subj="mockUpdateBarWidth" onClick={() => onBarWidthChange(0.8)}>
          Update Bar Width
        </button>
        <button data-test-subj="mockUpdateBarPadding" onClick={() => onBarPaddingChange(0.2)}>
          Update Bar Padding
        </button>
        <button
          data-test-subj="mockUpdateShowBarBorder"
          onClick={() => onShowBarBorderChange(true)}
        >
          Update Show Bar Border
        </button>
        <button data-test-subj="mockUpdateBarBorderWidth" onClick={() => onBarBorderWidthChange(2)}>
          Update Bar Border Width
        </button>
        <button
          data-test-subj="mockUpdateBarBorderColor"
          onClick={() => onBarBorderColorChange('#FF0000')}
        >
          Update Bar Border Color
        </button>
      </div>
    )
  ),
}));

describe('BarVisStyleControls', () => {
  // Create mock VisColumn objects
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  };

  const mockDateColumn: VisColumn = {
    id: 3,
    name: 'Date',
    column: 'date',
    schema: VisFieldType.Date,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const defaultProps: BarVisStyleControlsProps = {
    styleOptions: { ...defaultBarChartStyles },
    onStyleChange: jest.fn(),
    numericalColumns: [mockNumericalColumn],
    categoricalColumns: [mockCategoricalColumn],
    dateColumns: [],
    axisColumnMappings: {
      [AxisRole.X]: mockCategoricalColumn,
      [AxisRole.Y]: mockNumericalColumn,
    },
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<BarVisStyleControls {...defaultProps} />);

    // Check if all components are rendered
    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockThresholdOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockAxesSelectPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockGridOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockBarExclusiveVisOptions')).toBeInTheDocument();
  });

  test('hides legend when there is 1 metric and 1 category', () => {
    render(<BarVisStyleControls {...defaultProps} />);

    // Check if legend should not be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('false');
  });

  test('shows legend when there are multiple metrics', () => {
    const propsWithMultipleMetrics = {
      ...defaultProps,
      numericalColumns: [mockNumericalColumn, { ...mockNumericalColumn, id: 4 }],
    };

    render(<BarVisStyleControls {...propsWithMultipleMetrics} />);

    // Check if legend should be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('true');
  });

  test('shows legend when there are multiple categories', () => {
    const propsWithMultipleCategories = {
      ...defaultProps,
      categoricalColumns: [mockCategoricalColumn, { ...mockCategoricalColumn, id: 5 }],
    };

    render(<BarVisStyleControls {...propsWithMultipleCategories} />);

    // Check if legend should be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('true');
  });

  test('hides legend when there is 1 metric and 1 date', () => {
    const propsWithDateColumn = {
      ...defaultProps,
      categoricalColumns: [],
      dateColumns: [mockDateColumn],
    };

    render(<BarVisStyleControls {...propsWithDateColumn} />);

    // Check if legend should not be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('false');
  });

  test('calls onStyleChange with correct parameters for legend options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));
    expect(onStyleChange).toHaveBeenCalledWith({ addLegend: !defaultProps.styleOptions.addLegend });

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.BOTTOM });
  });

  test('calls onStyleChange with correct parameters for threshold options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test threshold update
    fireEvent.click(screen.getByTestId('mockUpdateThreshold'));
    expect(onStyleChange).toHaveBeenCalledWith({
      thresholdLines: [...defaultProps.styleOptions.thresholdLines, { id: '2', show: true }],
    });
  });

  test('calls onStyleChange with correct parameters for tooltip options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test tooltip update
    fireEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...defaultProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  test('calls updateVisualization when triggered from AxesSelectPanel', () => {
    const updateVisualization = jest.fn();
    render(<BarVisStyleControls {...defaultProps} updateVisualization={updateVisualization} />);

    // Test visualization update
    fireEvent.click(screen.getByTestId('mockUpdateVisualization'));
    expect(updateVisualization).toHaveBeenCalledWith({ type: 'test' });
  });

  test('calls onStyleChange with correct parameters for axes options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test category axes update
    fireEvent.click(screen.getByTestId('mockUpdateCategoryAxes'));
    expect(onStyleChange).toHaveBeenCalledWith({
      categoryAxes: [...defaultProps.styleOptions.categoryAxes, { id: 'new-axis' }],
    });

    // Test value axes update
    fireEvent.click(screen.getByTestId('mockUpdateValueAxes'));
    expect(onStyleChange).toHaveBeenCalledWith({
      valueAxes: [...defaultProps.styleOptions.valueAxes, { id: 'new-axis' }],
    });
  });

  test('calls onStyleChange with correct parameters for grid options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test grid update
    fireEvent.click(screen.getByTestId('mockUpdateGrid'));
    expect(onStyleChange).toHaveBeenCalledWith({
      grid: {
        ...defaultProps.styleOptions.grid,
        xLines: !defaultProps.styleOptions.grid.xLines,
      },
    });
  });

  test('calls onStyleChange with correct parameters for bar exclusive options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test bar width update
    fireEvent.click(screen.getByTestId('mockUpdateBarWidth'));
    expect(onStyleChange).toHaveBeenCalledWith({ barWidth: 0.8 });

    // Test bar padding update
    fireEvent.click(screen.getByTestId('mockUpdateBarPadding'));
    expect(onStyleChange).toHaveBeenCalledWith({ barPadding: 0.2 });

    // Test show bar border update
    fireEvent.click(screen.getByTestId('mockUpdateShowBarBorder'));
    expect(onStyleChange).toHaveBeenCalledWith({ showBarBorder: true });

    // Test bar border width update
    fireEvent.click(screen.getByTestId('mockUpdateBarBorderWidth'));
    expect(onStyleChange).toHaveBeenCalledWith({ barBorderWidth: 2 });

    // Test bar border color update
    fireEvent.click(screen.getByTestId('mockUpdateBarBorderColor'));
    expect(onStyleChange).toHaveBeenCalledWith({ barBorderColor: '#FF0000' });
  });
});
