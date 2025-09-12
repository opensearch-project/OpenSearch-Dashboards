/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createGaugeConfig, GaugeChartStyleControls } from './gauge_vis_config';
import { GaugeVisStyleControls } from './gauge_vis_options';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createGaugeConfig', () => {
  it('should create a gauge visualization type configuration', () => {
    const config = createGaugeConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'gauge');
    expect(config).toHaveProperty('type', 'gauge');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createGaugeConfig();
    const defaults = config.ui.style.defaults as GaugeChartStyleControls;
    // Verify basic controls
    expect(defaults.showTitle).toBe(true);
    expect(defaults.title).toBe('');
    expect(defaults.thresholds).toStrictEqual([]);
    expect(defaults.valueCalculation).toBe('last');
  });

  it('should render the GaugeVisStyleControls component with the provided props', () => {
    const config = createGaugeConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: {
        showTitle: true,
        title: '',
        thresholds: [],
        baseColor: '#9EE9FA',
        valueCalculation: 'last',
      },
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
    expect(React.createElement).toHaveBeenCalledWith(GaugeVisStyleControls, mockProps);
  });
});
