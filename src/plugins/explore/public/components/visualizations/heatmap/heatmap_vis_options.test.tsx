/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import { HeatmapVisStyleControls, HeatmapVisStyleControlsProps } from './heatmap_vis_options';
import { VisColumn, VisFieldType, AxisColumnMappings, AxisRole, Positions } from '../types';
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
    <>
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
      <div data-test-subj="heatmapLabelOptions">
        <button
          data-test-subj="toggleShowLabels"
          onClick={() =>
            onChange({
              label: {
                show: true,
              },
            })
          }
        >
          Show Labels
        </button>

        <button
          data-test-subj="toggleRotateLabels"
          onClick={() =>
            onChange({
              label: {
                rotate: true,
              },
            })
          }
        >
          Rotate Labels
        </button>

        <button
          data-test-subj="overwriteLabelColor"
          onClick={() =>
            onChange({
              label: {
                overwriteColor: true,
                color: '#FF0000',
              },
            })
          }
        >
          Overwrite Label Color
        </button>
      </div>
    </>
  )),
}));

jest.mock('../style_panel/legend/legend', () => {
  const { Positions: PositionsEnum } = jest.requireActual('../types');
  return {
    LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange }) => (
      <div data-test-subj="mockLegendOptionsPanel">
        <button
          data-test-subj="mockLegendShow"
          onClick={() => onLegendOptionsChange(0, { show: !legendOptions[0].show })}
        >
          Toggle Legend
        </button>
        <button
          data-test-subj="mockLegendPosition"
          onClick={() => onLegendOptionsChange(0, { position: PositionsEnum.BOTTOM })}
        >
          Change Position
        </button>
      </div>
    )),
  };
});

jest.mock('../style_panel/title/title', () => ({
  TitleOptionsPanel: jest.fn(({ titleOptions, onShowTitleChange }) => (
    <div data-test-subj="mockTitleOptionsPanel">
      <button
        data-test-subj="titleModeSwitch"
        onClick={() => onShowTitleChange({ show: !titleOptions.show })}
      >
        Toggle Title
      </button>
      <input
        data-test-subj="titleInput"
        placeholder="Default title"
        onChange={(e) => onShowTitleChange({ titleName: e.target.value })}
      />
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
    expect(screen.getByTestId('mockTitleOptionsPanel')).toBeInTheDocument();
  });

  it('calls onStyleChange with correct parameters for legend options', () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      legends: [
        {
          role: 'color',
          show: true,
          position: Positions.BOTTOM,
          title: '',
        },
      ],
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
      standardAxes: [
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
      exclusive: {
        label: {
          show: true,
        },
      },
    });

    // Rotate Labels
    fireEvent.click(screen.getByTestId('toggleRotateLabels'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        label: {
          rotate: true,
        },
      },
    });

    // Overwrite Label Color
    fireEvent.click(screen.getByTestId('overwriteLabelColor'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        label: {
          overwriteColor: true,
          color: '#FF0000',
        },
      },
    });
  });

  test('updates title show option correctly', async () => {
    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...mockProps} />
      </Provider>
    );

    // Find the title switch and toggle it
    const titleSwitch = screen.getByTestId('titleModeSwitch');
    await userEvent.click(titleSwitch);

    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      titleOptions: {
        ...mockProps.styleOptions.titleOptions,
        show: true,
      },
    });
  });

  test('updates title name when text is entered', async () => {
    // Set show to true to ensure the title field is visible
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

    render(
      <Provider store={store}>
        <HeatmapVisStyleControls {...props} />
      </Provider>
    );

    const titleInput = screen.getByPlaceholderText('Default title');
    await userEvent.type(titleInput, 'New Chart Title');

    waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });
});
