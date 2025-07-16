/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';
import { defaultBarChartStyles } from './bar_vis_config';
import { Positions, VisColumn, VisFieldType, AxisRole, AxisColumnMappings } from '../types';
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

jest.mock('../style_panel/grid/grid', () => ({
  GridOptionsPanel: jest.fn(({ grid, onGridChange }) => (
    <div data-test-subj="mockGridOptionsPanel">
      <button data-test-subj="mockUpdateGrid" onClick={() => onGridChange({ ...grid })}>
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
    const onStyleChange = jest.fn();
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
        <BarVisStyleControls {...propsWithMultipleMetrics} onStyleChange={onStyleChange} />
      </Provider>
    );

    // Test legend show toggle
    fireEvent.click(screen.getByTestId('mockLegendShow'));
    expect(onStyleChange).toHaveBeenCalledWith({ addLegend: !defaultProps.styleOptions.addLegend });

    // Test legend position change
    fireEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.BOTTOM });
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

    // Test value axes update
    fireEvent.click(screen.getByTestId('mockUpdateValueAxes'));
    expect(onStyleChange).toHaveBeenCalledWith({
      standardAxes: [...defaultProps.styleOptions.standardAxes, { id: 'new-axis' }],
    });
  });

  test('calls onStyleChange with correct parameters for grid options', () => {
    const onStyleChange = jest.fn();
    render(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Test grid update
    fireEvent.click(screen.getByTestId('mockUpdateGrid'));
    expect(onStyleChange).toHaveBeenCalledWith({
      switchAxes: !defaultProps.styleOptions.switchAxes,
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
});
