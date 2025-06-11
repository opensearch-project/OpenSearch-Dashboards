/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { LineVisStyleControls, LineVisStyleControlsProps } from './line_vis_options';
import { EuiTabbedContent } from '@elastic/eui';
import { Positions } from '../utils/collections';
import {
  CategoryAxis,
  GridOptions,
  ThresholdLine,
  ThresholdLineStyle,
  ValueAxis,
  VisFieldType,
} from '../types';
import { BasicVisOptions } from '../style_panel/basic_vis_options';
import { ThresholdOptions } from '../style_panel/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';

// Mock the i18n module
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn().mockImplementation((id, { defaultMessage }) => defaultMessage),
  },
}));

describe('LineVisStyleControls', () => {
  const defaultThresholdLine: ThresholdLine = {
    color: '#E7664C',
    show: false,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 1,
  };

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
      addTooltip: true,
      addLegend: true,
      legendPosition: Positions.RIGHT,
      addTimeMarker: false,
      showLine: true,
      lineMode: 'smooth',
      lineWidth: 2,
      showDots: true,
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
      },
    ],
    categoricalColumns: [
      {
        id: 2,
        name: 'category',
        schema: VisFieldType.Categorical,
        column: 'field-2',
      },
    ],
    dateColumns: [
      {
        id: 0,
        name: 'date',
        schema: VisFieldType.Date,
        column: 'field-0',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('renders a tabbed content component with the correct tabs', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const tabbedContent = wrapper.find(EuiTabbedContent);

    expect(tabbedContent.exists()).toBe(true);
    expect(tabbedContent.prop('tabs')).toHaveLength(4);

    const tabIds = tabbedContent.prop('tabs').map((tab) => tab.id);
    expect(tabIds).toEqual(['basic', 'threshold', 'grid', 'axes']);

    const tabNames = tabbedContent.prop('tabs').map((tab) => tab.name);
    expect(tabNames).toEqual(['Basic', 'Threshold', 'Grid', 'Axes']);
  });

  it('renders the BasicVisOptions component in the first tab', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const basicTab = wrapper.find(EuiTabbedContent).prop('tabs')[0];
    const basicTabContent = shallow(<div>{basicTab.content}</div>);

    expect(basicTabContent.find(BasicVisOptions).exists()).toBe(true);
    expect(basicTabContent.find(BasicVisOptions).props()).toMatchObject({
      addTooltip: mockProps.styleOptions.addTooltip,
      addLegend: mockProps.styleOptions.addLegend,
      legendPosition: mockProps.styleOptions.legendPosition,
      addTimeMarker: mockProps.styleOptions.addTimeMarker,
      showLine: mockProps.styleOptions.showLine,
      lineMode: mockProps.styleOptions.lineMode,
      lineWidth: mockProps.styleOptions.lineWidth,
      showDots: mockProps.styleOptions.showDots,
    });
  });

  it('renders the ThresholdOptions component in the second tab', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const thresholdTab = wrapper.find(EuiTabbedContent).prop('tabs')[1];
    const thresholdTabContent = shallow(<div>{thresholdTab.content}</div>);

    expect(thresholdTabContent.find(ThresholdOptions).exists()).toBe(true);
    expect(thresholdTabContent.find(ThresholdOptions).props()).toMatchObject({
      thresholdLine: mockProps.styleOptions.thresholdLine,
    });
  });

  it('renders the GridOptionsPanel component in the third tab', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const gridTab = wrapper.find(EuiTabbedContent).prop('tabs')[2];
    const gridTabContent = shallow(<div>{gridTab.content}</div>);

    expect(gridTabContent.find(GridOptionsPanel).exists()).toBe(true);
    expect(gridTabContent.find(GridOptionsPanel).props()).toMatchObject({
      grid: mockProps.styleOptions.grid,
    });
  });

  it('renders the AxesOptions component in the fourth tab', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const axesTab = wrapper.find(EuiTabbedContent).prop('tabs')[3];
    const axesTabContent = shallow(<div>{axesTab.content}</div>);

    expect(axesTabContent.find(AxesOptions).exists()).toBe(true);
    expect(axesTabContent.find(AxesOptions).props()).toMatchObject({
      categoryAxes: mockProps.styleOptions.categoryAxes,
      valueAxes: mockProps.styleOptions.valueAxes,
      numericalColumns: mockProps.numericalColumns,
      categoricalColumns: mockProps.categoricalColumns,
      dateColumns: mockProps.dateColumns,
    });
  });

  it('calls onStyleChange with the correct parameters when a style option changes', () => {
    const wrapper = shallow(<LineVisStyleControls {...mockProps} />);
    const basicTab = wrapper.find(EuiTabbedContent).prop('tabs')[0];
    const basicTabContent = shallow(<div>{basicTab.content}</div>);

    // Simulate changing the addTooltip option
    basicTabContent.find(BasicVisOptions).prop('onAddTooltipChange')(false);
    expect(mockProps.onStyleChange).toHaveBeenCalledWith({ addTooltip: false });

    // Simulate changing the lineWidth option
    basicTabContent.find(BasicVisOptions).prop('onLineWidthChange')(3);
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

    // Check that the AxesOptions component still renders with empty arrays
    const axesTab = wrapper.find(EuiTabbedContent).prop('tabs')[3];
    const axesTabContent = shallow(<div>{axesTab.content}</div>);

    expect(axesTabContent.find(AxesOptions).props()).toMatchObject({
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
    });
  });
});
