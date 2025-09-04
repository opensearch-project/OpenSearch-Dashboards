/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineVisStyleControls, LineVisStyleControlsProps } from './line_vis_options';
import {
  CategoryAxis,
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

jest.mock('../style_panel/legend/legend', () => ({
  LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange }) => (
    <div data-test-subj="mockLegendOptionsPanel">
      <button
        data-test-subj="mockLegendShow"
        onClick={() => onLegendOptionsChange({ show: !legendOptions.show })}
      >
        Toggle Legend
      </button>
      <button
        data-test-subj="mockLegendPosition"
        onClick={() => onLegendOptionsChange({ position: 'bottom' })}
      >
        Change Position
      </button>
      <button
        data-test-subj="mockLegendBoth"
        onClick={() => onLegendOptionsChange({ show: !legendOptions.show, position: 'top' })}
      >
        Change Both
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/threshold_lines/threshold', () => ({
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

jest.mock('../style_panel/title/title', () => ({
  TitleOptionsPanel: jest.fn(({ titleOptions, onShowTitleChange }) => (
    <div data-test-subj="mockTitleOptionsPanel">
      <button
        data-test-subj="mockTitleModeSwitch"
        onClick={() => onShowTitleChange({ show: !titleOptions.show })}
      >
        Toggle Title
      </button>
      <input
        data-test-subj="mockTitleInput"
        placeholder="Default title"
        onChange={(e) => onShowTitleChange({ titleName: e.target.value })}
      />
    </div>
  )),
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
    grid: { showLines: true },
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
    grid: { showLines: true },
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
    [AxisRole.COLOR]: mockCategoricalColumn,
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
      categoryAxes: [defaultCategoryAxis],
      valueAxes: [defaultValueAxis],
      titleOptions: {
        show: true,
        titleName: '',
      },
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

    expect(screen.getByTestId('mockAxesSelectPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockThresholdOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockLineExclusiveVisOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTitleOptionsPanel')).toBeInTheDocument();
  });

  test('hides legend when no COLOR, FACET, or Y_SECOND mappings are present', () => {
    const propsWithNoLegend = {
      ...mockProps,
      axisColumnMappings: {
        [AxisRole.X]: mockDateColumn,
        [AxisRole.Y]: mockNumericalColumn,
      },
    };

    render(<LineVisStyleControls {...propsWithNoLegend} />);

    expect(screen.queryByTestId('mockLegendOptionsPanel')).not.toBeInTheDocument();
  });

  test('renders legend panel when COLOR mapping is present', () => {
    const propsWithColorMapping = {
      ...mockProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.COLOR]: mockCategoricalColumn,
      },
    };

    render(<LineVisStyleControls {...propsWithColorMapping} />);

    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  test('renders legend panel when FACET mapping is present', () => {
    const propsWithFacetMapping = {
      ...mockProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.FACET]: mockCategoricalColumn,
      },
    };

    render(<LineVisStyleControls {...propsWithFacetMapping} />);

    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  test('renders legend panel when Y_SECOND mapping is present', () => {
    const propsWithYSecondMapping = {
      ...mockProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.Y_SECOND]: mockNumericalColumn,
      },
    };

    render(<LineVisStyleControls {...propsWithYSecondMapping} />);

    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  test('calls onStyleChange with correct parameters for legend options', async () => {
    const propsWithColorMapping = {
      ...mockProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.COLOR]: mockCategoricalColumn,
      },
    };

    render(<LineVisStyleControls {...propsWithColorMapping} />);

    await userEvent.click(screen.getByTestId('mockLegendShow'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });

    await userEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: 'bottom' });

    await userEvent.click(screen.getByTestId('mockLegendBoth'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: 'top' });
  });

  test('calls onStyleChange with correct parameters for threshold options', async () => {
    render(<LineVisStyleControls {...mockProps} />);

    await userEvent.click(screen.getByTestId('mockUpdateThreshold'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      thresholdLines: [...mockProps.styleOptions.thresholdLines, { id: '2', show: true }],
    });
  });

  test('calls onStyleChange with correct parameters for tooltip options', async () => {
    render(<LineVisStyleControls {...mockProps} />);

    await userEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  test('calls onStyleChange with correct parameters for axes options', async () => {
    render(<LineVisStyleControls {...mockProps} />);

    await userEvent.click(screen.getByTestId('mockUpdateCategoryAxes'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      categoryAxes: [...mockProps.styleOptions.categoryAxes, { id: 'new-axis' }],
    });

    await userEvent.click(screen.getByTestId('mockUpdateValueAxes'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      valueAxes: [...mockProps.styleOptions.valueAxes, { id: 'new-axis' }],
    });
  });

  test('calls onStyleChange with correct parameters for line exclusive options', async () => {
    render(<LineVisStyleControls {...mockProps} />);

    await userEvent.click(screen.getByTestId('mockUpdateAddTimeMarker'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      addTimeMarker: !mockProps.styleOptions.addTimeMarker,
    });

    await userEvent.click(screen.getByTestId('mockUpdateLineMode'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ lineMode: 'straight' });

    await userEvent.click(screen.getByTestId('mockUpdateLineWidth'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      lineWidth: mockProps.styleOptions.lineWidth + 1,
    });

    await userEvent.click(screen.getByTestId('mockUpdateLineStyle'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ lineStyle: 'line' });
  });

  test('handles empty column arrays gracefully', () => {
    const propsWithEmptyColumns = {
      ...mockProps,
      numericalColumns: undefined,
      categoricalColumns: undefined,
      dateColumns: undefined,
    };

    render(<LineVisStyleControls {...propsWithEmptyColumns} />);

    expect(screen.getByTestId('numericalColumnsLength')).toHaveTextContent('0');
    expect(screen.getByTestId('categoricalColumnsLength')).toHaveTextContent('0');
    expect(screen.getByTestId('dateColumnsLength')).toHaveTextContent('0');
  });

  test('updates title show option correctly', async () => {
    render(<LineVisStyleControls {...mockProps} />);

    await userEvent.click(screen.getByTestId('mockTitleModeSwitch'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      titleOptions: {
        ...mockProps.styleOptions.titleOptions,
        show: false,
      },
    });
  });

  test('updates title name when text is entered', async () => {
    const props = {
      ...mockProps,
      styleOptions: {
        ...mockProps.styleOptions,
        titleOptions: {
          show: true,
          titleName: '',
        },
      },
    };

    render(<LineVisStyleControls {...props} />);

    const titleInput = screen.getByTestId('mockTitleInput');
    await userEvent.type(titleInput, 'New Chart Title');

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });
});
