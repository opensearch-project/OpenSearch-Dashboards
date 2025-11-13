/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Positions, VisFieldType, VisColumn, AxisRole, AxisColumnMappings } from '../types';
import {
  StateTimeLineVisStyleControlsProps,
  StateTimeLineVisStyleControls,
} from './state_timeline_vis_options';
import { defaultStateTimeLineChartStyles } from './state_timeline_config';

const mockNumericalColumns: VisColumn[] = [
  {
    id: 1,
    name: 'value 1',
    schema: VisFieldType.Numerical,
    column: 'v1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockCateColumns: VisColumn[] = [
  {
    id: 1,
    name: 'cate 1',
    schema: VisFieldType.Categorical,
    column: 'c1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
  {
    id: 2,
    name: 'cate 2',
    schema: VisFieldType.Categorical,
    column: 'c2',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockTimeColumns: VisColumn[] = [
  {
    id: 1,
    name: 'date 1',
    schema: VisFieldType.Date,
    column: 'd1',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: mockTimeColumns[0],
  [AxisRole.Y]: mockCateColumns[0],
  [AxisRole.COLOR]: mockCateColumns[1],
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

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

jest.mock('../style_panel/legend/legend_options_wrapper', () => {
  const { Positions: PositionsEnum } = jest.requireActual('../types');
  return {
    LegendOptionsWrapper: jest.fn(
      ({ styleOptions, updateStyleOption, hasSizeLegend, shouldShow }) => {
        if (!shouldShow) {
          return null;
        }

        return (
          <div data-test-subj="mockLegendOptionsWrapper">
            <button
              data-test-subj="mockLegendShow"
              onClick={() => updateStyleOption('addLegend', !styleOptions.addLegend)}
            >
              Toggle Legend
            </button>
            <button
              data-test-subj="mockLegendPosition"
              onClick={() => updateStyleOption('legendPosition', PositionsEnum.BOTTOM)}
            >
              Change Position
            </button>
            <input
              data-test-subj="legend-title-input"
              placeholder="Legend Title"
              onChange={(e) => updateStyleOption('legendTitle', e.target.value)}
            />
            {hasSizeLegend && (
              <input
                data-test-subj="legend-title-for-size-input"
                placeholder="Legend Title for Size"
                onChange={(e) => updateStyleOption('legendTitleForSize', e.target.value)}
              />
            )}
          </div>
        );
      }
    ),
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

jest.mock('./state_timeline_exclusive_vis_options', () => ({
  StateTimeLineExclusiveVisOptions: jest.fn(({ onChange }) => (
    <>
      <div data-test-subj="mockStateTimelineExclusiveOptions">
        <button
          data-test-subj="showValue"
          onClick={() =>
            onChange({
              showValues: true,
            })
          }
        >
          Show value
        </button>
      </div>
    </>
  )),
}));

jest.mock('../style_panel/value_mapping/value_mapping_panel', () => ({
  ValueMappingPanel: jest.fn(({ valueMappingOption, onChange }) => (
    <>
      <div data-test-subj="mockValueMappingOption">
        <button
          data-test-subj="addValueMapping"
          onClick={() =>
            onChange({
              valueMappings: [],
            })
          }
        >
          Show value
        </button>
      </div>
    </>
  )),
}));

describe('StateTimeLineVisStyleControls', () => {
  const mockProps: StateTimeLineVisStyleControlsProps = {
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
    styleOptions: defaultStateTimeLineChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: [],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);

    expect(screen.getByTestId('allAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockStateTimelineExclusiveOptions')).toBeInTheDocument();
    expect(screen.queryByTestId('mockLegendOptionsWrapper')).toBeInTheDocument();
    expect(screen.getByTestId('mockTitleOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockValueMappingOption')).toBeInTheDocument();
  });

  it('calls onStyleChange with correct parameters for legend options', () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);

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
    render(<StateTimeLineVisStyleControls {...mockProps} />);

    // Test tooltip update
    fireEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  it('calls onStyleChange with correct parameters for axes options', () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);

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
  it('calls onStyleChange with correct parameters for stateTimelne exclusive options', () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);
    fireEvent.click(screen.getByTestId('showValue'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        showValues: true,
      },
    });
  });

  it('updates title show option correctly', async () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);

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

  it('updates title name when text is entered', async () => {
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

    render(<StateTimeLineVisStyleControls {...props} />);

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

  it('updates value mapping ', async () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);
    fireEvent.click(screen.getByTestId('addValueMapping'));
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({
      valueMappingOptions: {
        valueMappings: [],
      },
    });
  });

  it('updates legend title correctly', async () => {
    render(<StateTimeLineVisStyleControls {...mockProps} />);

    const legendTitleInput = screen.getByTestId('legend-title-input');
    await userEvent.type(legendTitleInput, 'New Legend Title');

    await waitFor(() => {
      expect(mockProps.onStyleChange).toHaveBeenCalledWith({ legendTitle: 'New Legend Title' });
    });
  });
});
