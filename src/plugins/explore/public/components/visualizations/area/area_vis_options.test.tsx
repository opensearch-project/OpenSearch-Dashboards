/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaVisStyleControls } from './area_vis_options';
import { Positions, ThresholdLineStyle, VisFieldType, TooltipOptions } from '../types';

// Mock child components
jest.mock('../style_panel/legend/legend', () => ({
  LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange, shouldShowLegend }) => (
    <div data-test-subj="legend-panel" data-show-legend={shouldShowLegend}>
      <button
        data-test-subj="toggle-legend"
        onClick={() => onLegendOptionsChange({ show: !legendOptions.show })}
      >
        Toggle Legend
      </button>
      <button
        data-test-subj="change-position"
        onClick={() => onLegendOptionsChange({ position: 'bottom' })}
      >
        Change Position
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/threshold/threshold', () => ({
  ThresholdOptions: jest.fn(({ thresholdLines, onThresholdLinesChange }) => (
    <div data-test-subj="threshold-panel">
      <button
        data-test-subj="update-threshold"
        onClick={() =>
          onThresholdLinesChange([
            ...thresholdLines,
            {
              id: '2',
              color: '#000000',
              show: true,
              style: 'full',
              value: 20,
              width: 1,
            },
          ])
        }
      >
        Update Threshold
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/tooltip/tooltip', () => ({
  TooltipOptionsPanel: jest.fn(({ tooltipOptions, onTooltipOptionsChange }) => (
    <div data-test-subj="tooltip-panel">
      <button
        data-test-subj="update-tooltip"
        onClick={() => onTooltipOptionsChange({ mode: 'hidden' as TooltipOptions['mode'] })}
      >
        Update Tooltip
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/axes/axes', () => ({
  AxesOptions: jest.fn(({ categoryAxes, valueAxes, onCategoryAxesChange, onValueAxesChange }) => (
    <div data-test-subj="axes-panel">
      <button
        data-test-subj="update-category-axes"
        onClick={() =>
          onCategoryAxesChange([
            ...categoryAxes,
            {
              id: 'new-category',
              type: 'category' as const,
              position: 'bottom',
              show: true,
              labels: {
                show: true,
                filter: true,
                rotate: 0,
                truncate: 100,
              },
              title: {
                text: 'New Category',
              },
            },
          ])
        }
      >
        Update Category Axes
      </button>
      <button
        data-test-subj="update-value-axes"
        onClick={() =>
          onValueAxesChange([
            ...valueAxes,
            {
              id: 'new-value',
              name: 'NewAxis',
              type: 'value' as const,
              position: 'left',
              show: true,
              labels: {
                show: true,
                rotate: 0,
                filter: false,
                truncate: 100,
              },
              title: {
                text: 'New Value',
              },
            },
          ])
        }
      >
        Update Value Axes
      </button>
    </div>
  )),
}));

jest.mock('../style_panel/grid/grid', () => ({
  GridOptionsPanel: jest.fn(({ grid, onGridChange }) => (
    <div data-test-subj="grid-panel">
      <button
        data-test-subj="update-grid"
        onClick={() => onGridChange({ ...grid, xLines: !grid.xLines })}
      >
        Update Grid
      </button>
    </div>
  )),
}));

describe('AreaVisStyleControls', () => {
  const defaultProps = {
    styleOptions: {
      addLegend: true,
      legendPosition: Positions.RIGHT,
      addTimeMarker: false,
      thresholdLines: [
        {
          id: '1',
          color: '#E7664C',
          show: false,
          style: ThresholdLineStyle.Full,
          value: 10,
          width: 1,
          name: '',
        },
      ],
      tooltipOptions: { mode: 'all' as TooltipOptions['mode'] },
      categoryAxes: [
        {
          id: 'CategoryAxis-1',
          type: 'category' as const,
          position: Positions.BOTTOM as Positions.TOP | Positions.BOTTOM,
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
        },
      ],
      valueAxes: [
        {
          id: 'ValueAxis-1',
          name: 'LeftAxis-1',
          type: 'value' as const,
          position: Positions.LEFT as Positions.LEFT | Positions.RIGHT,
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
        },
      ],
      grid: { xLines: true, yLines: true },
    },
    onStyleChange: jest.fn(),
    axisColumnMappings: {},
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all panels correctly', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    expect(screen.getByTestId('legend-panel')).toBeInTheDocument();
    expect(screen.getByTestId('threshold-panel')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-panel')).toBeInTheDocument();
    expect(screen.getByTestId('axes-panel')).toBeInTheDocument();
    expect(screen.getByTestId('grid-panel')).toBeInTheDocument();
  });

  test('shows legend when notShowLegend is false', () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    const legendPanel = screen.getByTestId('legend-panel');
    expect(legendPanel).toHaveAttribute('data-show-legend', 'true');
  });

  test('hides legend when specific column combinations exist (numerical=1, categorical=0, date=1)', () => {
    const props = {
      ...defaultProps,
      numericalColumns: [
        {
          id: 1,
          name: 'num1',
          schema: VisFieldType.Numerical,
          column: 'col1',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      ],
      dateColumns: [
        {
          id: 2,
          name: 'date1',
          schema: VisFieldType.Date,
          column: 'col2',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      ],
      categoricalColumns: [],
    };

    render(<AreaVisStyleControls {...props} />);

    const legendPanel = screen.getByTestId('legend-panel');
    expect(legendPanel).toHaveAttribute('data-show-legend', 'false');
  });

  test('hides legend when specific column combinations exist (numerical=1, categorical=1, date=0)', () => {
    const props = {
      ...defaultProps,
      numericalColumns: [
        {
          id: 1,
          name: 'num1',
          schema: VisFieldType.Numerical,
          column: 'col1',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      ],
      categoricalColumns: [
        {
          id: 2,
          name: 'cat1',
          schema: VisFieldType.Categorical,
          column: 'col2',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      ],
      dateColumns: [],
    };

    render(<AreaVisStyleControls {...props} />);

    const legendPanel = screen.getByTestId('legend-panel');
    expect(legendPanel).toHaveAttribute('data-show-legend', 'false');
  });

  test('shows legend for other column combinations', () => {
    const props = {
      ...defaultProps,
      numericalColumns: [
        {
          id: 1,
          name: 'num1',
          schema: VisFieldType.Numerical,
          column: 'col1',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
        {
          id: 2,
          name: 'num2',
          schema: VisFieldType.Numerical,
          column: 'col2',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      ],
      categoricalColumns: [
        {
          id: 3,
          name: 'cat1',
          schema: VisFieldType.Categorical,
          column: 'col3',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      ],
      dateColumns: [],
    };

    render(<AreaVisStyleControls {...props} />);

    const legendPanel = screen.getByTestId('legend-panel');
    expect(legendPanel).toHaveAttribute('data-show-legend', 'true');
  });

  test('updates legend show option correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('toggle-legend'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
  });

  test('updates legend position correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('change-position'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.BOTTOM });
  });

  test('updates threshold lines correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-threshold'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      thresholdLines: [
        ...defaultProps.styleOptions.thresholdLines,
        {
          id: '2',
          color: '#000000',
          show: true,
          style: ThresholdLineStyle.Full,
          value: 20,
          width: 1,
        },
      ],
    });
  });

  test('updates tooltip options correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-tooltip'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...defaultProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  test('updates category axes correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-category-axes'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      categoryAxes: [
        ...defaultProps.styleOptions.categoryAxes,
        {
          id: 'new-category',
          type: 'category' as const,
          position: Positions.BOTTOM as Positions.TOP | Positions.BOTTOM,
          show: true,
          labels: {
            show: true,
            filter: true,
            rotate: 0,
            truncate: 100,
          },
          title: {
            text: 'New Category',
          },
        },
      ],
    });
  });

  test('updates value axes correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-value-axes'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      valueAxes: [
        ...defaultProps.styleOptions.valueAxes,
        {
          id: 'new-value',
          name: 'NewAxis',
          type: 'value' as const,
          position: Positions.LEFT as Positions.LEFT | Positions.RIGHT,
          show: true,
          labels: {
            show: true,
            rotate: 0,
            filter: false,
            truncate: 100,
          },
          title: {
            text: 'New Value',
          },
        },
      ],
    });
  });

  test('updates grid options correctly', async () => {
    render(<AreaVisStyleControls {...defaultProps} />);

    await userEvent.click(screen.getByTestId('update-grid'));

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      grid: { ...defaultProps.styleOptions.grid, xLines: false },
    });
  });

  test('handles empty arrays for columns', () => {
    const props = {
      ...defaultProps,
      numericalColumns: undefined,
      categoricalColumns: undefined,
      dateColumns: undefined,
    };

    expect(() => render(<AreaVisStyleControls {...props} />)).not.toThrow();
  });

  test('handles missing optional props', () => {
    // Create a new props object without the optional props
    const props = {
      ...defaultProps,
      availableChartTypes: undefined,
      selectedChartType: undefined,
      onChartTypeChange: undefined,
    };

    expect(() => render(<AreaVisStyleControls {...props} />)).not.toThrow();
  });
});
