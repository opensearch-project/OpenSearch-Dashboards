/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { BarVisStyleControls, BarVisStyleControlsProps } from './bar_vis_options';
import { defaultBarChartStyles } from './bar_vis_config';
import { Positions, VisColumn, VisFieldType } from '../types';
import { EuiTabbedContent } from '@elastic/eui';
import { GeneralVisOptions } from '../style_panel/general_vis_options';
import { BarExclusiveVisOptions } from './bar_exclusive_vis_options';
import { ThresholdOptions } from '../style_panel/threshold_options';
import { GridOptionsPanel } from '../style_panel/grid_options';
import { AxesOptions } from '../style_panel/axes_options';

// Mock the child components
jest.mock('../style_panel/general_vis_options', () => ({
  GeneralVisOptions: jest.fn(() => <div data-test-subj="mockGeneralVisOptions" />),
}));

jest.mock('./bar_exclusive_vis_options', () => ({
  BarExclusiveVisOptions: jest.fn(() => <div data-test-subj="mockBarExclusiveVisOptions" />),
}));

jest.mock('../style_panel/threshold_options', () => ({
  ThresholdOptions: jest.fn(() => <div data-test-subj="mockThresholdOptions" />),
}));

jest.mock('../style_panel/grid_options', () => ({
  GridOptionsPanel: jest.fn(() => <div data-test-subj="mockGridOptionsPanel" />),
}));

jest.mock('../style_panel/axes_options', () => ({
  AxesOptions: jest.fn(() => <div data-test-subj="mockAxesOptions" />),
}));

describe('BarVisStyleControls', () => {
  // Create mock VisColumn objects that satisfy the TypeScript requirements
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockCategoricalColumn: VisColumn = {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
    validValuesCount: 100,
    uniqueValuesCount: 10,
  };

  const defaultProps: BarVisStyleControlsProps = {
    styleOptions: { ...defaultBarChartStyles },
    onStyleChange: jest.fn(),
    numericalColumns: [mockNumericalColumn],
    categoricalColumns: [mockCategoricalColumn],
    dateColumns: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    const wrapper = mount(<BarVisStyleControls {...defaultProps} />);

    // Check if the component renders
    expect(wrapper.exists()).toBe(true);

    // Check if EuiTabbedContent is rendered
    expect(wrapper.find(EuiTabbedContent).exists()).toBe(true);

    // Check if all tabs are rendered
    const tabs = wrapper.find(EuiTabbedContent).prop('tabs');
    expect(tabs).toHaveLength(5);

    // Check tab names
    expect(tabs[0].name).toContain('Basic');
    expect(tabs[1].name).toContain('Bar');
    expect(tabs[2].name).toContain('Threshold');
    expect(tabs[3].name).toContain('Grid');
    expect(tabs[4].name).toContain('Axes');
  });

  test('renders all child components', () => {
    const wrapper = mount(<BarVisStyleControls {...defaultProps} />);

    // Check if all child components are rendered in the tabs
    const tabContent = wrapper
      .find(EuiTabbedContent)
      .prop('tabs')
      .map((tab) => tab.content);

    // Render each tab content
    const contentWrapper = mount(<div>{tabContent}</div>);

    // Check if all child components are rendered
    expect(contentWrapper.find('[data-test-subj="mockGeneralVisOptions"]').exists()).toBe(true);
    expect(contentWrapper.find('[data-test-subj="mockBarExclusiveVisOptions"]').exists()).toBe(
      true
    );
    expect(contentWrapper.find('[data-test-subj="mockThresholdOptions"]').exists()).toBe(true);
    expect(contentWrapper.find('[data-test-subj="mockGridOptionsPanel"]').exists()).toBe(true);
    expect(contentWrapper.find('[data-test-subj="mockAxesOptions"]').exists()).toBe(true);
  });

  test('hides legend when there is 1 metric and 1 category', () => {
    // Reset all mocks before the test
    jest.clearAllMocks();

    mount(<BarVisStyleControls {...defaultProps} />);

    // Check props passed to GeneralVisOptions
    expect(GeneralVisOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldShowLegend: false, // Should be false with 1 metric and 1 category
      }),
      expect.anything()
    );
  });

  test('shows legend when there are multiple metrics or categories', () => {
    // Reset all mocks before the test
    jest.clearAllMocks();

    // Create a second numerical column
    const mockNumericalColumn2: VisColumn = {
      id: 3,
      name: 'Sum',
      column: 'sum',
      schema: VisFieldType.Numerical,
      validValuesCount: 100,
      uniqueValuesCount: 50,
    };

    // Test with multiple metrics
    mount(
      <BarVisStyleControls
        {...defaultProps}
        numericalColumns={[mockNumericalColumn, mockNumericalColumn2]}
      />
    );

    // Check props passed to GeneralVisOptions
    expect(GeneralVisOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldShowLegend: true, // Should be true with multiple metrics
      }),
      expect.anything()
    );

    // Reset all mocks before the next test
    jest.clearAllMocks();

    // Create a second categorical column
    const mockCategoricalColumn2: VisColumn = {
      id: 4,
      name: 'Category2',
      column: 'category2',
      schema: VisFieldType.Categorical,
      validValuesCount: 100,
      uniqueValuesCount: 10,
    };

    // Test with multiple categories
    mount(
      <BarVisStyleControls
        {...defaultProps}
        categoricalColumns={[mockCategoricalColumn, mockCategoricalColumn2]}
      />
    );

    // Check props passed to GeneralVisOptions
    expect(GeneralVisOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldShowLegend: true, // Should be true with multiple categories
      }),
      expect.anything()
    );
  });

  test('calls onStyleChange with correct parameters', () => {
    // Reset all mocks before the test
    jest.clearAllMocks();

    const onStyleChange = jest.fn();
    mount(<BarVisStyleControls {...defaultProps} onStyleChange={onStyleChange} />);

    // Get the updateStyleOption function from the component
    // We can extract this from the props passed to any of the child components
    const callArgs = (GeneralVisOptions as jest.Mock).mock.calls[0][0];
    const onAddTooltipChange = callArgs.onAddTooltipChange;
    const onAddLegendChange = callArgs.onAddLegendChange;
    const onLegendPositionChange = callArgs.onLegendPositionChange;

    // Test onAddTooltipChange
    onAddTooltipChange(false);
    expect(onStyleChange).toHaveBeenCalledWith({ addTooltip: false });

    // Test onAddLegendChange
    onAddLegendChange(false);
    expect(onStyleChange).toHaveBeenCalledWith({ addLegend: false });

    // Test onLegendPositionChange
    onLegendPositionChange(Positions.BOTTOM);
    expect(onStyleChange).toHaveBeenCalledWith({ legendPosition: Positions.BOTTOM });
  });
});
