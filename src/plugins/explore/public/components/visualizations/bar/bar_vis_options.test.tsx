/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
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
      onSwitchAxes,
    }) => (
      <div data-test-subj="mockAxesSelectPanel">
        <button
          data-test-subj="mockUpdateVisualization"
          onClick={() => updateVisualization({ type: 'test' })}
        >
          Update Visualization
        </button>
        <button data-test-subj="mockSwitchAxes" onClick={() => onSwitchAxes(true)}>
          Switch Axes
        </button>
      </div>
    )
  ),
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

jest.mock('./bucket_options.tsx', () => ({
  BucketOptionsPanel: jest.fn(({ styles, bucketType, onChange }) => (
    <div data-test-subj="mockBucketOptionsPanel">
      <span data-test-subj="bucketType">{bucketType}</span>
      {bucketType === 'time' && (
        <button
          data-test-subj="mockUpdateTimeUnit"
          onClick={() => onChange({ ...styles, bucketTimeUnit: 'year' })}
        >
          Update Time Unit
        </button>
      )}
      {bucketType === 'num' && (
        <>
          <button
            data-test-subj="mockUpdateBucketSize"
            onClick={() => onChange({ ...styles, bucketSize: 100 })}
          >
            Update Bucket Size
          </button>

          <button
            data-test-subj="mockUpdateBucketCount"
            onClick={() => onChange({ ...styles, bucketCount: 20 })}
          >
            Update Bucket Size
          </button>
        </>
      )}
      {bucketType !== 'single' && (
        <button
          data-test-subj="mockUpdateAggregation"
          onClick={() => onChange({ ...styles, aggregationType: 'sum' })}
        >
          Update Aggregation
        </button>
      )}
    </div>
  )),
}));

describe('BarVisStyleControls', () => {
  const defaultProps: BarVisStyleControlsProps = {
    styleOptions: {
      ...defaultBarChartStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    },
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
    expect(screen.getByTestId('mockTitleOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('mockBucketOptionsPanel')).toBeInTheDocument();
  });

  test('renders legend panel when COLOR mapping is present', () => {
    const propsWithColorMapping = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.COLOR]: {
          id: 5,
          name: 'Color Category',
          schema: VisFieldType.Categorical,
          column: 'color',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      },
    };

    render(
      <Provider store={store}>
        <BarVisStyleControls {...propsWithColorMapping} />
      </Provider>
    );

    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  test('renders legend panel when FACET mapping is present', () => {
    const propsWithFacetMapping = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.FACET]: {
          id: 6,
          name: 'Facet Category',
          schema: VisFieldType.Categorical,
          column: 'facet',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      },
    };

    render(
      <Provider store={store}>
        <BarVisStyleControls {...propsWithFacetMapping} />
      </Provider>
    );

    expect(screen.getByTestId('mockLegendOptionsPanel')).toBeInTheDocument();
  });

  test('calls onStyleChange with correct parameters for legend options', async () => {
    const propsWithColorMapping = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        [AxisRole.COLOR]: {
          id: 5,
          name: 'Color Category',
          schema: VisFieldType.Categorical,
          column: 'color',
          validValuesCount: 10,
          uniqueValuesCount: 5,
        },
      },
    };

    render(
      <Provider store={store}>
        <BarVisStyleControls {...propsWithColorMapping} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('mockLegendShow'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });

    await userEvent.click(screen.getByTestId('mockLegendPosition'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: 'bottom' });

    jest.clearAllMocks();
    await userEvent.click(screen.getByTestId('mockLegendBoth'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ addLegend: false });
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ legendPosition: 'top' });
  });

  test('calls onStyleChange with correct parameters for threshold options', async () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('mockUpdateThreshold'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      thresholdLines: [...defaultProps.styleOptions.thresholdLines, { id: '2', show: true }],
    });
  });

  test('calls onStyleChange with correct parameters for tooltip options', async () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('mockUpdateTooltip'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      tooltipOptions: { ...defaultProps.styleOptions.tooltipOptions, mode: 'hidden' },
    });
  });

  test('calls onStyleChange with correct parameters for axes options', async () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('changeAxis'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      standardAxes: [...defaultProps.styleOptions.standardAxes, { id: 'new-axis' }],
    });
  });

  test('calls onStyleChange with correct parameters for bar exclusive options', async () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('mockUpdateBarWidth'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ barWidth: 0.8 });

    await userEvent.click(screen.getByTestId('mockUpdateBarPadding'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ barPadding: 0.2 });

    await userEvent.click(screen.getByTestId('mockUpdateShowBarBorder'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ showBarBorder: true });

    await userEvent.click(screen.getByTestId('mockUpdateBarBorderWidth'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ barBorderWidth: 2 });

    await userEvent.click(screen.getByTestId('mockUpdateBarBorderColor'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ barBorderColor: '#FF0000' });
  });

  test('calls onStyleChange with correct parameters for switch axes', async () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('mockSwitchAxes'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({ switchAxes: true });
  });

  test('updates title show option correctly', async () => {
    render(
      <Provider store={store}>
        <BarVisStyleControls {...defaultProps} />
      </Provider>
    );

    await userEvent.click(screen.getByTestId('mockTitleModeSwitch'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      titleOptions: {
        ...defaultProps.styleOptions.titleOptions,
        show: false,
      },
    });
  });

  test('updates title name when text is entered', async () => {
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

    render(
      <Provider store={store}>
        <BarVisStyleControls {...props} />
      </Provider>
    );

    const titleInput = screen.getByTestId('mockTitleInput');
    await userEvent.type(titleInput, 'New Chart Title');

    await waitFor(() => {
      expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
        titleOptions: {
          ...props.styleOptions.titleOptions,
          titleName: 'New Chart Title',
        },
      });
    });
  });

  test('render bucket panel with num bucket type', async () => {
    const propsWithNumBucket = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        x: {
          id: 1,
          name: 'Numerical X',
          schema: VisFieldType.Numerical,
          column: 'numX',
          validValuesCount: 100,
          uniqueValuesCount: 50,
        },
      },
    };

    render(
      <Provider store={store}>
        <BarVisStyleControls {...propsWithNumBucket} />
      </Provider>
    );

    expect(screen.getByTestId('mockBucketOptionsPanel')).toBeInTheDocument();
    expect(screen.getByTestId('bucketType')).toHaveTextContent('num');
    expect(screen.getByTestId('mockUpdateBucketSize')).toBeInTheDocument();
    expect(screen.getByTestId('mockUpdateBucketCount')).toBeInTheDocument();
    expect(screen.getByTestId('mockUpdateAggregation')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('mockUpdateBucketSize'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { bucketTimeUnit: 'auto', aggregationType: 'sum', bucketSize: 100 },
    });

    await userEvent.click(screen.getByTestId('mockUpdateBucketCount'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { bucketTimeUnit: 'auto', aggregationType: 'sum', bucketCount: 20 },
    });

    await userEvent.click(screen.getByTestId('mockUpdateAggregation'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { bucketTimeUnit: 'auto', aggregationType: 'sum' },
    });
  });

  test('render bucket panel with time bucket type', async () => {
    const propsWithTimeBucket = {
      ...defaultProps,
      axisColumnMappings: {
        ...mockAxisColumnMappings,
        x: {
          id: 1,
          name: 'Date X',
          schema: VisFieldType.Date,
          column: 'column',
          validValuesCount: 100,
          uniqueValuesCount: 50,
        },
      },
    };

    render(
      <Provider store={store}>
        <BarVisStyleControls {...propsWithTimeBucket} />
      </Provider>
    );

    expect(screen.getByTestId('bucketType')).toHaveTextContent('time');
    expect(screen.getByTestId('mockUpdateTimeUnit')).toBeInTheDocument();
    expect(screen.getByTestId('mockUpdateAggregation')).toBeInTheDocument();
    expect(screen.queryByTestId('mockUpdateBucketSize')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('mockUpdateTimeUnit'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { aggregationType: 'sum', bucketTimeUnit: 'year' },
    });

    await userEvent.click(screen.getByTestId('mockUpdateAggregation'));
    expect(defaultProps.onStyleChange).toHaveBeenCalledWith({
      bucket: { bucketTimeUnit: 'auto', aggregationType: 'sum' },
    });
  });
});
