/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createMetricConfig } from './metric_vis_config';
import { MetricVisStyleControls } from './metric_vis_options';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createMetrictmapeConfig', () => {
  it('should create a metric visualization type configuration', () => {
    const config = createMetricConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'metric');
    expect(config).toHaveProperty('type', 'metric');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createMetricConfig();
    const defaults = config.ui.style.defaults;
    // Verify basic controls
    expect(defaults.showTitle).toBe(true);
    expect(defaults.title).toBe('');
    expect(defaults.fontSize).toBe(undefined);
    expect(defaults.thresholdOptions).toMatchObject({
      baseColor: '#00BD6B',
      thresholds: [],
    });
  });

  it('should render the MetricVisStyleControls component with the provided props', () => {
    const config = createMetricConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: {
        ...config.ui.style.defaults,
        showTitle: true,
        title: '',
        fontSize: 60,
        useThresholdColor: false,
        thresholdOptions: { thresholds: [], baseColor: '#00BD6B' },
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
    expect(React.createElement).toHaveBeenCalledWith(MetricVisStyleControls, mockProps);
  });
});
