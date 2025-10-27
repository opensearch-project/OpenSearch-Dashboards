/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createBarGaugeConfig, defaultBarGaugeChartStyles } from './bar_gauge_vis_config';
import { BarGaugeVisStyleControls } from './bar_gauge_vis_options';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createBarGaugeConfig', () => {
  it('should create a gauge visualization type configuration', () => {
    const config = createBarGaugeConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'bar_gauge');
    expect(config).toHaveProperty('type', 'bar_gauge');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createBarGaugeConfig();
    const defaults = config.ui.style.defaults;
    expect(defaults.thresholdOptions).toMatchObject({
      baseColor: '#00BD6B',
      thresholds: [],
    });
    expect(defaults.valueCalculation).toBe('last');
  });

  it('should render the BarGaugeVisStyleControls component with the provided props', () => {
    const config = createBarGaugeConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: defaultBarGaugeChartStyles,
      onStyleChange: jest.fn(),
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      axisColumnMappings: {},
      updateVisualization: jest.fn(),
    };
    // Call the render function
    renderFunction(mockProps);
    // Verify that React.createElement was called with the correct arguments
    expect(React.createElement).toHaveBeenCalledWith(BarGaugeVisStyleControls, mockProps);
  });
});
