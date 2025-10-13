/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createScatterConfig, defaultScatterChartStyles } from './scatter_vis_config';
import { ScatterVisStyleControls } from './scatter_vis_options';
import { Positions, PointShape, AxisRole, ThresholdMode } from '../types';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createScatterConfig', () => {
  it('should create a scatter visualization type configuration', () => {
    const config = createScatterConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'scatter');
    expect(config).toHaveProperty('type', 'scatter');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createScatterConfig();
    const defaults = config.ui.style.defaults;
    // Verify basic controls
    expect(defaults.tooltipOptions.mode).toBe('all');
    expect(defaults.addLegend).toBe(true);
    expect(defaults.legendPosition).toBe(Positions.RIGHT);
    // Verify exclusive style
    expect(defaults.exclusive.pointShape).toBe(PointShape.CIRCLE);
    expect(defaults.exclusive.angle).toBe(0);
    expect(defaults.exclusive.filled).toBe(true);

    // Verify axes
    expect(defaults.standardAxes).toHaveLength(2);
    const xAxis = defaults.standardAxes.find((axis) => axis.axisRole === AxisRole.X);
    expect(xAxis).toHaveProperty('position', Positions.BOTTOM);
    const yAxis = defaults.standardAxes.find((axis) => axis.axisRole === AxisRole.Y);
    expect(yAxis).toHaveProperty('position', Positions.LEFT);

    // Verify title
    expect(defaults.titleOptions.show).toBe(false);
    expect(defaults.titleOptions.titleName).toBe('');
    expect(defaults.thresholdOptions).toMatchObject({
      baseColor: '#00BD6B',
      thresholds: [],
      thresholdStyle: ThresholdMode.Off,
    });
  });
  it('should render the ScatterVisStyleControls component with the provided props', () => {
    const config = createScatterConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: defaultScatterChartStyles,
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
    expect(React.createElement).toHaveBeenCalledWith(ScatterVisStyleControls, mockProps);
  });
});
