/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  createStateTimelineConfig,
  StateTimeLineChartStyle,
  defaultStateTimeLineChartStyles,
} from './state_timeline_config';
import { AxisRole, Positions, DisableMode } from '../types';
import { StateTimeLineVisStyleControls } from './state_timeline_vis_options';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createStateTimelineConfig', () => {
  it('should create a state_timeline visualization type configuration', () => {
    const config = createStateTimelineConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'state_timeline');
    expect(config).toHaveProperty('type', 'state_timeline');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createStateTimelineConfig();
    const defaults = config.ui.style.defaults as StateTimeLineChartStyle;
    // Verify basic controls
    expect(defaults.tooltipOptions.mode).toBe('all');
    expect(defaults.legendPosition).toBe(Positions.RIGHT);
    // Verify exclusive style
    expect(defaults.exclusive.showValues).toBe(false);
    expect(defaults.exclusive.rowHeight).toBe(0.8);
    expect(defaults.exclusive.disconnectValues).toEqual({
      disableMode: DisableMode.Never,
      threshold: '1h',
    });

    expect(defaults.exclusive.connectNullValues).toEqual({
      connectMode: DisableMode.Never,
      threshold: '1h',
    });

    expect(defaults.legendTitle).toBe('');

    // Verify axes
    expect(defaults.standardAxes).toHaveLength(2);
    const xAxis = defaults.standardAxes.find((axis) => axis.axisRole === AxisRole.X);
    expect(xAxis).toHaveProperty('position', Positions.BOTTOM);
    const yAxis = defaults.standardAxes.find((axis) => axis.axisRole === AxisRole.Y);
    expect(yAxis).toHaveProperty('position', Positions.LEFT);

    // Verify title
    expect(defaults.titleOptions.show).toBe(false);
    expect(defaults.titleOptions.titleName).toBe('');
  });
  it('should render the ScatterVisStyleControls component with the provided props', () => {
    const config = createStateTimelineConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: defaultStateTimeLineChartStyles,
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
    expect(React.createElement).toHaveBeenCalledWith(StateTimeLineVisStyleControls, mockProps);
  });
});
