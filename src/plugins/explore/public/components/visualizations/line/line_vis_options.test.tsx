/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LineVisStyleControls, LineVisStyleControlsProps } from './line_vis_options';
import {
  CategoryAxis,
  GridOptions,
  ThresholdLineStyle,
  ValueAxis,
  Positions,
  VisFieldType,
  ThresholdLines,
  TooltipOptions,
  AxisRole,
  AxisColumnMappings,
} from '../types';
import { LineStyle } from './line_exclusive_vis_options';

// Mock the child components
jest.mock('../style_panel/axes/axes_selector', () => ({
  AxesSelectPanel: jest.fn(({ updateVisualization, chartType, currentMapping }) => (
    <div data-test-subj="mockAxesSelectPanel">
      <div data-test-subj="chartType">{chartType}</div>
      <button
        data-test-subj="mockUpdateVisualization"
        onClick={() => updateVisualization({ mappings: { x: 'date', y: 'value' } })}
      >
        Update Visualization
      </button>
    </div>
  )),
}));
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
        <div data-test-subj="numericalColumnsLength">{numericalColumns?.length || 0}</div>
        <div data-test-subj="categoricalColumnsLength">{categoricalColumns?.length || 0}</div>
        <div data-test-subj="dateColumnsLength">{dateColumns?.length || 0}</div>
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

jest.mock('./line_exclusive_vis_options', () => ({
  LineExclusiveVisOptions: jest.fn(
    ({
      addTimeMarker,
      lineStyle,
      lineMode,
      lineWidth,
      onAddTimeMarkerChange,
      onLineModeChange,
      onLineWidthChange,
      onLineStyleChange,
    }) => (
      <div data-test-subj="mockLineExclusiveVisOptions">
        <button
          data-test-subj="mockUpdateAddTimeMarker"
          onClick={() => onAddTimeMarkerChange(!addTimeMarker)}
        >
          Toggle Time Marker
        </button>
        <button
          data-test-subj="mockUpdateLineMode"
          onClick={() => onLineModeChange(lineMode === 'smooth' ? 'straight' : 'smooth')}
        >
          Toggle Line Mode
        </button>
        <button
          data-test-subj="mockUpdateLineWidth"
          onClick={() => onLineWidthChange(lineWidth + 1)}
        >
          Increase Line Width
        </button>
        <button
          data-test-subj="mockUpdateLineStyle"
          onClick={() => onLineStyleChange(lineStyle === 'both' ? 'line' : 'both')}
        >
          Toggle Line Style
        </button>
      </div>
    )
  ),
  LineStyle: {
    BOTH: 'both',
    LINE: 'line',
    DOTS: 'dots',
  },
}));

describe('LineVisStyleControls', () => {
  const defaultThresholdLine = {
    id: '1',
    color: '#E7664C',
    show: false,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 1,
    name: '',
  };

  const defaultThresholdLines: ThresholdLines = [defaultThresholdLine];

  const defaultGrid: GridOptions = {
    xLines: true,
    yLines: true,
  };

  const defaultCategoryAxis: CategoryAxis = {
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
      text: '',
    },
  };

  const defaultValueAxis: ValueAxis = {
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
      text: '',
    },
  };

  const defaultTooltipOptions: TooltipOptions = {
    mode: 'all',
  };

  const mockNumericalColumn = {
    id: 1,
    name: 'value',
    schema: VisFieldType.Numerical,
    column: 'field-1',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const mockCategoricalColumn = {
    id: 2,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'field-2',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const mockDateColumn = {
    id: 0,
    name: 'date',
    schema: VisFieldType.Date,
    column: 'field-0',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const mockAxisColumnMappings: AxisColumnMappings = {
    [AxisRole.X]: mockDateColumn,
    [AxisRole.Y]: mockNumericalColumn,
  };

  const mockProps: LineVisStyleControlsProps = {
    styleOptions: {
      addLegend: true,
      legendPosition: Positions.RIGHT,
      addTimeMarker: false,
      lineStyle: 'both' as LineStyle,
      lineMode: 'smooth',
      lineWidth: 2,
      thresholdLines: defaultThresholdLines,
      tooltipOptions: defaultTooltipOptions,
      grid: defaultGrid,
      categoryAxes: [defaultCategoryAxis],
      valueAxes: [defaultValueAxis],
    },
    onStyleChange: jest.fn(),
    numericalColumns: [mockNumericalColumn],
    categoricalColumns: [mockCategoricalColumn],
    dateColumns: [mockDateColumn],
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    render(<LineVisStyleControls {...mockProps} />);

    // Check if all components are rendered
    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockThresholdOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockGridOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockLineExclusiveVisOptions')).toBeInTheDocument();
  });

  test('hides legend when there is 1 metric and 1 date', () => {
    const propsWithOneMetricOneDate = {
      ...mockProps,
      categoricalColumns: [],
    };

    render(<LineVisStyleControls {...propsWithOneMetricOneDate} />);

    // Check if legend should not be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('false');
  });

  test('hides legend when there is 1 metric and 1 category', () => {
    const propsWithOneMetricOneCategory = {
      ...mockProps,
      dateColumns: [],
    };

    render(<LineVisStyleControls {...propsWithOneMetricOneCategory} />);

    // Check if legend should not be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('false');
  });

  test('shows legend for other column combinations', () => {
    const propsWithMultipleMetrics = {
      ...mockProps,
      numericalColumns: [mockNumericalColumn, { ...mockNumericalColumn, id: 3 }],
    };

    render(<LineVisStyleControls {...propsWithMultipleMetrics} />);

    // Check if legend should be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('true');
  });

  test('calls onStyleChange with correct parameters for legend options', () => {
    const onStyleChange = jest.fn();
    render(<LineVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));
    expect(onStyleChange).toHaveBeenCalledWith({ addLegend: !mockProps.styleOptions.addLegend });

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.BOTTOM });
  });

  test('calls onStyleChange with correct parameters for threshold options', () => {
    const onStyleChange = jest.fn();
    render(<LineVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Test threshold update
    fireEvent.click(screen.getByTestId('mockUpdateThreshold'));
    expect(onStyleChange).toHaveBeenCalledWith({
      thresholdLines: [...mockProps.styleOptions.thresholdLines, { id: '2', show: true }],
    });
  });

  test('calls onStyleChange with correct parameters for tooltip options', () => {
    const onStyleChange = jest.fn();
    render(<LineVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Test tooltip update
    fireEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  test('calls onStyleChange with correct parameters for axes options', () => {
    const onStyleChange = jest.fn();
    render(<LineVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Test category axes update
    fireEvent.click(screen.getByTestId('mockUpdateCategoryAxes'));
    expect(onStyleChange).toHaveBeenCalledWith({
      categoryAxes: [...mockProps.styleOptions.categoryAxes, { id: 'new-axis' }],
    });

    // Test value axes update
    fireEvent.click(screen.getByTestId('mockUpdateValueAxes'));
    expect(onStyleChange).toHaveBeenCalledWith({
      valueAxes: [...mockProps.styleOptions.valueAxes, { id: 'new-axis' }],
    });
  });

  test('calls onStyleChange with correct parameters for grid options', () => {
    const onStyleChange = jest.fn();
    render(<LineVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Test grid update
    fireEvent.click(screen.getByTestId('mockUpdateGrid'));
    expect(onStyleChange).toHaveBeenCalledWith({
      grid: {
        ...mockProps.styleOptions.grid,
        xLines: !mockProps.styleOptions.grid.xLines,
      },
    });
  });

  test('calls onStyleChange with correct parameters for line exclusive options', () => {
    const onStyleChange = jest.fn();
    render(<LineVisStyleControls {...mockProps} onStyleChange={onStyleChange} />);

    // Test time marker toggle
    fireEvent.click(screen.getByTestId('mockUpdateAddTimeMarker'));
    expect(onStyleChange).toHaveBeenCalledWith({
      addTimeMarker: !mockProps.styleOptions.addTimeMarker,
    });

    // Test line mode change
    fireEvent.click(screen.getByTestId('mockUpdateLineMode'));
    expect(onStyleChange).toHaveBeenCalledWith({ lineMode: 'straight' });

    // Test line width change
    fireEvent.click(screen.getByTestId('mockUpdateLineWidth'));
    expect(onStyleChange).toHaveBeenCalledWith({ lineWidth: mockProps.styleOptions.lineWidth + 1 });

    // Test line style change
    fireEvent.click(screen.getByTestId('mockUpdateLineStyle'));
    expect(onStyleChange).toHaveBeenCalledWith({ lineStyle: 'line' });
  });

  test('handles empty column arrays gracefully', () => {
    const propsWithEmptyColumns = {
      ...mockProps,
      numericalColumns: undefined,
      categoricalColumns: undefined,
      dateColumns: undefined,
    };

    render(<LineVisStyleControls {...propsWithEmptyColumns} />);

    // Check that the AxesOptions component still renders with empty arrays
    expect(screen.getByTestId('numericalColumnsLength')).toHaveTextContent('0');
    expect(screen.getByTestId('categoricalColumnsLength')).toHaveTextContent('0');
    expect(screen.getByTestId('dateColumnsLength')).toHaveTextContent('0');
  });
});
