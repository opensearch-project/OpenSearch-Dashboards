/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { HeatmapVisStyleControls, HeatmapVisStyleControlsProps } from './heatmap_vis_options';
import { VisFieldType, AxisRole, VisColumn, AxisColumnMappings, Positions } from '../types';
import { defaultHeatmapChartStyles } from './heatmap_vis_config';

// Mock store setup
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

// Shared column mocks
const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'value 1',
    schema: VisFieldType.Numerical,
    column: 'x1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
  {
    id: 2,
    name: 'value 2',
    schema: VisFieldType.Numerical,
    column: 'x2',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
  {
    id: 3,
    name: 'value 3',
    schema: VisFieldType.Numerical,
    column: 'x3',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: mockNumericalColumns[0],
  [AxisRole.Y]: mockNumericalColumns[1],
  [AxisRole.COLOR]: mockNumericalColumns[2],
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('./heatmap_exclusive_vis_options', () => ({
  HeatmapExclusiveVisOptions: jest.fn(({ onChange }) => (
    <div data-test-subj="heatmapExclusiveOptions">
      <button
        data-test-subj="changeHeatmapColorScale"
        onClick={() =>
          onChange({
            colorScaleType: 'log',
          })
        }
      >
        Update Heatmap Color Scale
      </button>

      <button
        data-test-subj="changeHeatmapReverseSchema"
        onClick={() =>
          onChange({
            reverseSchema: true,
          })
        }
      >
        Toggle Reverse Schema
      </button>

      <button
        data-test-subj="changeHeatmapUseCustomRanges"
        onClick={() =>
          onChange({
            useCustomRanges: true,
          })
        }
      >
        Enable Custom Ranges
      </button>
    </div>
  )),
  HeatmapLabelVisOptions: jest.fn(({ onChange }) => (
    <div data-test-subj="heatmapLabelOptions">
      <button
        data-test-subj="toggleShowLabels"
        onClick={() =>
          onChange({
            show: true,
          })
        }
      >
        Show Labels
      </button>

      <button
        data-test-subj="toggleRotateLabels"
        onClick={() =>
          onChange({
            rotate: true,
          })
        }
      >
        Rotate Labels
      </button>

      <button
        data-test-subj="overwriteLabelColor"
        onClick={() =>
          onChange({
            overwriteColor: true,
            color: '#FF0000',
          })
        }
      >
        Overwrite Label Color
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

jest.mock('../style_panel/axes/standard_axes_options', () => ({
  AllAxesOptions: jest.fn(({ onStandardAxesChange }) => (
    <div data-test-subj="allAxesOptions">
      <button
        data-test-subj="changeAxis"
        onClick={() =>
          onStandardAxesChange([
            {
              id: 'axis-id',
              axisRole: 'y',
              show: false,
              title: { text: 'Mock Y Axis' },
              position: 'left',
              labels: { show: true, rotate: 0 },
              grid: { showLines: true },
            },
          ])
        }
      >
        Mock Axis Change
      </button>
    </div>
  )),
}));

describe('HeatmapVisStyleControls', () => {
  const mockProps: HeatmapVisStyleControlsProps = {
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
    styleOptions: defaultHeatmapChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: [],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    expect(screen.getByTestId('allAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('heatmapLabelOptions')).toBeInTheDocument();
    expect(screen.getByTestId('heatmapExclusiveOptions')).toBeInTheDocument();
    expect(screen.queryByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  it('calls onStyleChange with correct parameters for legend options', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      addLegend: !mockProps.styleOptions.addLegend,
    });

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      legendPosition: Positions.BOTTOM,
    });
  });

  it('calls onStyleChange with correct parameters for tooltip options', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    // Test tooltip update
    fireEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  it('calls onStyleChange with correct parameters for axes options', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    fireEvent.click(screen.getByTestId('changeAxis'));

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      StandardAxes: [
        {
          id: 'axis-id',
          axisRole: 'y',
          show: false,
          title: { text: 'Mock Y Axis' },
          position: 'left',
          labels: { show: true, rotate: 0 },
          grid: { showLines: true },
        },
      ],
    });
  });
  it('calls onStyleChange with correct parameters for heatmap exclusive options', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    // Test heatmap color scale type change
    fireEvent.click(screen.getByTestId('changeHeatmapColorScale'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        colorScaleType: 'log',
      },
    });

    // Test reverse schema toggle
    fireEvent.click(screen.getByTestId('changeHeatmapReverseSchema'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        reverseSchema: true,
      },
    });

    // Test enabling custom ranges
    fireEvent.click(screen.getByTestId('changeHeatmapUseCustomRanges'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        useCustomRanges: true,
      },
    });
  });
  it('calls onStyleChange with correct parameters for heatmap label options', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    // Show Labels
    fireEvent.click(screen.getByTestId('toggleShowLabels'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      label: {
        show: true,
      },
    });

    // Rotate Labels
    fireEvent.click(screen.getByTestId('toggleRotateLabels'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      label: {
        rotate: true,
      },
    });

    // Overwrite Label Color
    fireEvent.click(screen.getByTestId('overwriteLabelColor'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      label: {
        overwriteColor: true,
        color: '#FF0000',
      },
    });
  });
});
