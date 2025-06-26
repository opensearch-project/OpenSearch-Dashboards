/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { LineVisStyleControls, LineVisStyleControlsProps } from './line_vis_options';
import { EuiSplitPanel, EuiButtonEmpty } from '@elastic/eui';
import {
  CategoryAxis,
  GridOptions,
  ThresholdLine,
  ThresholdLineStyle,
  ValueAxis,
  Positions,
  VisFieldType,
  TooltipOptions,
} from '../types';
import { LineExclusiveVisOptions } from './line_exclusive_vis_options';
import { ThresholdOptions } from '../style_panel/threshold/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { ChartTypeSwitcher } from '../style_panel/chart_type_switcher';
import { TooltipOptionsPanel } from '../style_panel/tooltip_options';
import { LineStyle } from './line_vis_config';

// Mock the i18n module
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('LineVisStyleControls', () => {
  const defaultTooltipOptions: TooltipOptions = {
    mode: 'all',
  };

  const defaultThresholdLines: ThresholdLines = [
    {
      id: '1',
      color: '#E7664C',
      show: false,
      style: ThresholdLineStyle.Full,
      value: 10,
      width: 1,
      name: '',
    },
  ];

  const defaultGrid: GridOptions = {
    categoryLines: true,
    valueLines: true,
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

  const mockProps: LineVisStyleControlsProps = {
    styleOptions: {
      addLegend: true,
      legendPosition: Positions.RIGHT,
      addTimeMarker: false,
      lineStyle: 'both' as LineStyle,
      lineMode: 'smooth',
      lineWidth: 2,
      tooltipOptions: defaultTooltipOptions,
      thresholdLine: defaultThresholdLine,
      grid: defaultGrid,
      categoryAxes: [defaultCategoryAxis],
      valueAxes: [defaultValueAxis],
    },
    onStyleChange: jest.fn(),
    numericalColumns: [
      {
        id: 1,
        name: 'value',
        schema: VisFieldType.Numerical,
        column: 'field-1',
        validValuesCount: 10,
        uniqueValuesCount: 5,
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'field-2',
        validValuesCount: 10,
        uniqueValuesCount: 3,
      },
    ],
    dateColumns: [
      {
        id: 0,
        name: 'date',
        schema: VisFieldType.Date,
        column: 'field-0',
        validValuesCount: 10,
        uniqueValuesCount: 10,
      },
    ],
    availableChartTypes: [
      { type: 'line', priority: 100, name: 'Line Chart' },
      { type: 'bar', priority: 80, name: 'Bar Chart' },
    ],
    selectedChartType: 'line',
    onChartTypeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders EuiSplitPanel with the correct panels', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const splitPanelOuter = wrapper.find(EuiSplitPanel.Outer);
    const splitPanelInners = wrapper.find(EuiSplitPanel.Inner);

    expect(splitPanelOuter.exists()).toBe(true);
    expect(splitPanelInners).toHaveLength(7); // 7 panels: general, basic, exclusive, tooltip, threshold, grid, axes
  });

  it('renders buttons for each panel', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const buttons = wrapper.find(EuiButtonEmpty);

    expect(buttons).toHaveLength(7); // 7 buttons for each panel

    // Check button labels
    const buttonLabels = buttons.map((button) => button.prop('children'));
    expect(buttonLabels).toContain('General');
    expect(buttonLabels).toContain('Basic');
    expect(buttonLabels).toContain('Graph style');
    expect(buttonLabels).toContain('Tooltip');
    expect(buttonLabels).toContain('Threshold');
    expect(buttonLabels).toContain('Grid');
    expect(buttonLabels).toContain('Axis');
  });

  it('toggles panel visibility when button is clicked', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);

    // Initially all panels should be collapsed
    expect(wrapper.find(ChartTypeSwitcher).exists()).toBe(false);

    // Click the general panel button
    wrapper.find('[data-test-subj="lineVisGeneralButton"]').simulate('click');

    // Now the ChartTypeSwitcher should be visible
    expect(wrapper.find(ChartTypeSwitcher).exists()).toBe(true);
  });

  it('renders ChartTypeSwitcher with correct props when general panel is expanded', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);

    // Expand the general panel
    wrapper.find('[data-test-subj="lineVisGeneralButton"]').simulate('click');

    const chartTypeSwitcher = wrapper.find(ChartTypeSwitcher);
    expect(chartTypeSwitcher.exists()).toBe(true);
    expect(chartTypeSwitcher.props()).toMatchObject({
      availableChartTypes: mockProps.availableChartTypes,
      selectedChartType: mockProps.selectedChartType,
      onChartTypeChange: mockProps.onChartTypeChange,
    });
  });

  it('renders LineExclusiveVisOptions with correct props when exclusive panel is expanded', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);

    // Expand the exclusive panel
    wrapper.find('[data-test-subj="lineVisExclusiveButton"]').simulate('click');

    const lineExclusiveVisOptions = wrapper.find(LineExclusiveVisOptions);
    expect(lineExclusiveVisOptions.exists()).toBe(true);
    expect(lineExclusiveVisOptions.props()).toMatchObject({
      addTimeMarker: mockProps.styleOptions.addTimeMarker,
      lineStyle: mockProps.styleOptions.lineStyle,
      lineMode: mockProps.styleOptions.lineMode,
      lineWidth: mockProps.styleOptions.lineWidth,
    });
  });

  it('calls onStyleChange with the correct parameters when a style option changes', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);

    // Expand the exclusive panel
    wrapper.find('[data-test-subj="lineVisExclusiveButton"]').simulate('click');

    // Simulate changing the lineWidth option
    wrapper.find(LineExclusiveVisOptions).prop('onLineWidthChange')(3);
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ lineWidth: 3 });
  });

  it('handles empty column arrays gracefully', () => {
    const propsWithEmptyColumns = {
      ...mockProps,
      numericalColumns: undefined,
      categoricalColumns: undefined,
      dateColumns: undefined,
    };

    const wrapper = shallow(<LineVisStyleControls {...propsWithEmptyColumns} />);
    expect(wrapper).toMatchSnapshot();

    // Expand the axes panel
    wrapper.find('[data-test-subj="lineVisAxesButton"]').simulate('click');

    // Check that the AxesOptions component renders with empty arrays
    const axesOptions = wrapper.find(AxesOptions);
    expect(axesOptions.props()).toMatchObject({
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
    });
  });
});
