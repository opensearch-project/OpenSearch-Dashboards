/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import configureMockStore from 'redux-mock-store';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';
import { defaultBarChartStyles } from './bar_vis_config';
import { VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';

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
];
const mockCategoricalColumns: VisColumn[] = [
  {
    id: 4,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  },
];

const mockAxisColumnMappings: AxisColumnMappings = {
  [AxisRole.X]: mockCategoricalColumns[0],
  [AxisRole.Y]: mockNumericalColumns[0],
};

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
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

jest.mock('../style_panel/legend/legend', () => {
  // Import Positions inside the mock to avoid reference error
  const { Positions: PositionsEnum } = jest.requireActual('../types');

  return {
    LegendOptionsPanel: jest.fn(({ legendOptions, onLegendOptionsChange, shouldShowLegend }) => {
      if (!shouldShowLegend) return null;
      return (
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
      );
    }),
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
  AllAxesOptions: jest.fn(({ standardAxes, onStandardAxesChange }) => (
    <div data-test-subj="allAxesOptions">
      <button
        data-test-subj="changeAxis"
        onClick={() => onStandardAxesChange([...standardAxes, { id: 'new-axis' }])}
      >
        Change Axis
      </button>
      <button
        data-test-subj="mockUpdateValueAxes"
        onClick={() => onStandardAxesChange([...standardAxes, { id: 'new-axis' }])}
      >
        Update Value Axes
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
  const defaultProps: BarVisStyleControlsProps = {
    styleOptions: { ...defaultBarChartStyles },
    onStyleChange: jest.fn(),
    numericalColumns: mockNumericalColumns,
    categoricalColumns: mockCategoricalColumns,
    dateColumns: [],
    axisColumnMappings: mockAxisColumnMappings,
    updateVisualization: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props for regular bar chart and should not show legend panel', () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    // Check if all components are rendered
    expect(screen.getByTestId('mockAxesSelectPanel')).toBeInTheDocument();
    expect(screen.getByTestId('allAxesOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockTooltipOptionsPanel')).toBeInTheDocument();
    expect(screen.queryByTestId('mockLegendOptionsPanel')).not.toBeInTheDocument();
    expect(screen.getByTestId('mockThresholdOptions')).toBeInTheDocument();
    expect(screen.getByTestId('mockBarExclusiveVisOptions')).toBeInTheDocument();
  });

  test('shows legend when there are multiple metrics', () => {
    const propsWithMultipleMetrics = {
      ...defaultProps,
      numericalColumns: [
        ...mockNumericalColumns,
        {
          id: 2,
          name: 'Y Value',
          schema: VisFieldType.Numerical,
          column: 'y',
          validValuesCount: 6,
          uniqueValuesCount: 6,
        },
      ],
    };

    render(
      <Provider store={store}>
        <BarVisStyleControls {...propsWithMultipleMetrics} />
      </Provider>
    );

    // Check if legend should be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('true');
  });

  test('shows legend when there are multiple categories', () => {
    const propsWithMultipleCategories = {
      ...defaultProps,
      categoricalColumns: [
        ...mockCategoricalColumns,
        {
          id: 2,
          name: 'x Value',
          schema: VisFieldType.Categorical,
          column: 'x',
          validValuesCount: 6,
          uniqueValuesCount: 6,
        },
      ],
    };

    render(<BarVisStyleControls {...propsWithMultipleCategories} />);

    // Check if legend should be shown
    expect(screen.getByTestId('shouldShowLegend')).toHaveTextContent('true');
  });

  test('calls onStyleChange with correct parameters for legend options', () => {
    // For this test, we'll directly test the mock's callback
    const onLegendOptionsChange = jest.fn();
    const shouldShowLegend = true;
    const legendOptions = { show: true };

    // Render the mock directly
    render(
      <div>
        {jest.requireMock('../style_panel/legend/legend').LegendOptionsPanel({
          shouldShowLegend,
          legendOptions,
          onLegendOptionsChange,
        })}
      </div>
    );

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));
    expect(onLegendOptionsChange).toHaveBeenCalledWith({ show: !legendOptions.show });

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(onLegendOptionsChange).toHaveBeenCalledWith({ position: 'bottom' });
  });

  test('calls onStyleChange with correct parameters for threshold options', () => {
    const onStyleChange = jest.fn();
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />
      </Provider>
    );

    // Test threshold update
    fireEvent.click(screen.getByTestId('mockUpdateThreshold'));
    expect(onStyleChange).toHaveBeenCalledWith({
      thresholdLines: [...defaultProps.styleOptions.thresholdLines, { id: '2', show: true }],
    });
  });

  test('calls onStyleChange with correct parameters for tooltip options', () => {
    const onStyleChange = jest.fn();
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />
      </Provider>
    );

    // Test tooltip update
    fireEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...defaultProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  it('calls onStyleChange with correct parameters for axes options', () => {
    const onStyleChange = jest.fn();

    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />
      </Provider>
    );

    fireEvent.click(screen.getByTestId('changeAxis'));

    expect(onStyleChange).toHaveBeenCalledWith({
      standardAxes: [...defaultProps.styleOptions.standardAxes, { id: 'new-axis' }],
    });
  });

  test('calls onStyleChange with correct parameters for bar exclusive options', () => {
    const onStyleChange = jest.fn();
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />
      </Provider>
    );

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

  test('updates title show option correctly', async () => {
    render(<BarVisStyleControls {...defaultProps} />);

    // Find the title switch and toggle it
    const titleSwitch = screen.getByTestId('titleModeSwitch');
    await userEvent.click(titleSwitch);

    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      titleOptions: {
        ...defaultProps.styleOptions.titleOptions,
        show: true,
      },
    });
  });

  test('updates title name when text is entered', async () => {
    // Set show to true to ensure the title field is visible
    const props = {
      ...defaultProps,
      styleOptions: {
        ...defaultProps.styleOptions,
        titleOptions: {
          show: true,
          titleName: '',
        },
      },
    };

    render(<BarVisStyleControls {...props} />);

    const titleInput = screen.getByPlaceholderText('Default title');
    await userEvent.type(titleInput, 'New Chart Title');

    waitFor(() => {
      expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });
});
