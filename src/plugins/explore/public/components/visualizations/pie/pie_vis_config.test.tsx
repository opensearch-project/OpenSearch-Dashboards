/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPieConfig, PieChartStyleControls } from './pie_vis_config';
import { PieVisStyleControls } from './pie_vis_options';
import { Positions } from '../types';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createPieConfig', () => {
  it('should create a pie visualization type configuration', () => {
    const config = createPieConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'pie');
    expect(config).toHaveProperty('type', 'pie');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createPieConfig();
    const defaults = config.ui.style.defaults as PieChartStyleControls;
    // Verify basic controls
    expect(defaults.addTooltip).toBe(true);
    expect(defaults.addLegend).toBe(true);
    expect(defaults.legendPosition).toBe(Positions.RIGHT);
    // Verify exclusive style
    expect(defaults.exclusive.donut).toBe(true);
    expect(defaults.exclusive.showValues).toBe(true);
    expect(defaults.exclusive.showLabels).toBe(false);
    expect(defaults.exclusive.truncate).toBe(100);
  });

  it('should render the PieVisStyleControls component with the provided props', () => {
    const config = createPieConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: {
        addTooltip: false,
        addLegend: false,
        legendPosition: Positions.RIGHT,
        exclusive: {
          donut: true,
          showValues: true,
          showLabels: false,
          truncate: 100,
        },
      },
      onStyleChange: jest.fn(),
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
    };
    // Call the render function
    renderFunction(mockProps);
    // Verify that React.createElement was called with the correct arguments
    expect(React.createElement).toHaveBeenCalledWith(PieVisStyleControls, mockProps);
  });
});
