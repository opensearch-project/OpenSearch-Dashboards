/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { ScatterVisStyleControls, ScatterVisStyleControlsProps } from './scatter_vis_options';
import { VisFieldType, VisColumn, AxisRole, AxisColumnMappings, Positions } from '../types';
import { defaultScatterChartStyles } from './scatter_vis_config';
import userEvent from '@testing-library/user-event';

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
    name: 'X Value',
    schema: VisFieldType.Numerical,
    column: 'x',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
  {
    id: 2,
    name: 'Y Value',
    schema: VisFieldType.Numerical,
    column: 'y',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  },
];

const mockCategoricalColumns: VisColumn[] = [
  {
    id: 4,
    name: 'Category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 6,
    uniqueValuesCount: 2,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: mockNumericalColumns[0],
  [AxisRole.Y]: mockNumericalColumns[1],
};

// Mocks
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

jest.mock('./scatter_exclusive_vis_options', () => ({
  ScatterExclusiveVisOptions: jest.fn(({ onChange }) => (
    <div data-test-subj="scatterExclusiveOptions">
      <button
        data-test-subj="changeScatterStyle"
        onClick={() =>
          onChange({
            pointShape: 'circle',
          })
        }
      >
        Update Scatter Style
      </button>

      <button
        data-test-subj="changeScatterFilled"
        onClick={() =>
          onChange({
            filled: 'true',
          })
        }
      >
        Update Scatter Filled
      </button>

      <button
        data-test-subj="changeScatterAngled"
        onClick={() =>
          onChange({
            angle: 180,
          })
        }
      >
        Update Scatter Angle
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

describe('ScatterVisStyleControls (updated structure)', () => {
  const mockProps: ScatterVisStyleControlsProps = {
    styleOptions: defaultScatterChartStyles,
    onStyleChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: [],
    dateColumns: [],
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
  };

  const propsWithCategoryColor: ScatterVisStyleControlsProps = {
    ...mockProps,
    categoricalColumns: mockCategoricalColumns,
    axisColumnMappings: {
      ...mockProps.axisColumnMappings,
      [AxisRole.COLOR]: {
        id: 4,
        name: 'Category',
        schema: VisFieldType.Categorical,
        column: 'category',
        validValuesCount: 6,
        uniqueValuesCount: 2,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props for 2 metrics scatter and should not show legend panel', () => {
    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...mockProps} />
      </Provider>
    );

    expect(screen.getByTestId('allAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('scatterExclusiveOptions')).toBeInTheDocument();
    expect(screen.queryByTestId('mockLegendOptionsPanel')).not.toBeInTheDocument();
  });

  it('renders and shows legend panel when categorical color column is present', () => {
    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...propsWithCategoryColor} />
      </Provider>
    );

    expect(screen.getByTestId('allAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('scatterExclusiveOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  it('calls onStyleChange with correct parameters for legend options', () => {
    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...propsWithCategoryColor} />
      </Provider>
    );

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));
    expect(propsWithCategoryColor.onStyleChange).toHaveBeenCalledWith({
      addLegend: !mockProps.styleOptions.addLegend,
    });

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(propsWithCategoryColor.onStyleChange).toHaveBeenCalledWith({
      legendPosition: Positions.BOTTOM,
    });
  });

  it('calls onStyleChange with correct parameters for tooltip options', () => {
    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...propsWithCategoryColor} />
      </Provider>
    );

    // Test tooltip update
    fireEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(propsWithCategoryColor.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...mockProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  it('calls onStyleChange with correct parameters for axes options', () => {
    const onStyleChange = jest.fn();
    const updatedProps = {
      ...propsWithCategoryColor,
      onStyleChange,
    };

    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...updatedProps} />
      </Provider>
    );

    fireEvent.click(screen.getByTestId('changeAxis'));

    expect(onStyleChange).toHaveBeenCalledWith({
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

  it('calls onStyleChange with correct parameters for scatter exclusive options', () => {
    const onStyleChange = jest.fn();
    const updatedProps = {
      ...propsWithCategoryColor,
      onStyleChange,
    };

    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...updatedProps} />
      </Provider>
    );

    // Test point shape mode change
    fireEvent.click(screen.getByTestId('changeScatterStyle'));
    expect(onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        pointShape: 'circle',
      },
    });

    fireEvent.click(screen.getByTestId('changeScatterFilled'));
    expect(onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        filled: 'true',
      },
    });

    fireEvent.click(screen.getByTestId('changeScatterAngled'));
    expect(onStyleChange).toHaveBeenCalledWith({
      exclusive: {
        angle: 180,
      },
    });
  });

  it('updates title show option correctly', async () => {
    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...mockProps} />
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

    render(
      <Provider store={store}>
        <ScatterVisStyleControls {...props} />
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
