/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPieConfig, PieChartStyleControls, defaultPieChartStyles } from './pie_vis_config';
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
    expect(defaults.exclusive.showValues).toBe(false);
    expect(defaults.exclusive.showLabels).toBe(false);
    expect(defaults.exclusive.truncate).toBe(100);

    // Verify title
    expect(defaults.titleOptions.show).toBe(false);
    expect(defaults.titleOptions.titleName).toBe('');
  });

  it('should render the PieVisStyleControls component with the provided props', () => {
    const config = createPieConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: {
        addTooltip: false,
        tooltipOptions: { mode: 'all' as const },
        addLegend: false,
        legendPosition: Positions.RIGHT,
        exclusive: {
          donut: true,
          showValues: true,
          showLabels: false,
          truncate: 100,
        },
        titleOptions: {
          show: true,
          titleName: '',
        },
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
    expect(React.createElement).toHaveBeenCalledWith(PieVisStyleControls, mockProps);
  });

  it('should handle missing styleOptions in render function', () => {
    const config = createPieConfig();
    const renderFunction = config.ui.style.render;
    const mockProps = {
      styleOptions: {} as PieChartStyleControls,
      onStyleChange: jest.fn(),
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      axisColumnMappings: {},
      updateVisualization: jest.fn(),
    };
    expect(() => renderFunction(mockProps)).not.toThrow();
  });

  it('should handle missing axisColumnMappings in render function', () => {
    const config = createPieConfig();
    const renderFunction = config.ui.style.render;
    const mockProps = {
      styleOptions: config.ui.style.defaults,
      onStyleChange: jest.fn(),
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      axisColumnMappings: {},
      updateVisualization: jest.fn(),
    };
    expect(() => renderFunction(mockProps)).not.toThrow();
  });

  it('should have correct defaultPieChartStyles edge values', () => {
    const defaults = defaultPieChartStyles;
    expect(typeof defaults.addTooltip).toBe('boolean');
    expect(typeof defaults.addLegend).toBe('boolean');
    expect(['right', 'left', 'top', 'bottom']).toContain(defaults.legendPosition);
    expect(defaults.tooltipOptions).toHaveProperty('mode');
    expect(typeof defaults.exclusive.donut).toBe('boolean');
    expect(typeof defaults.exclusive.showValues).toBe('boolean');
    expect(typeof defaults.exclusive.showLabels).toBe('boolean');
    expect(typeof defaults.exclusive.truncate).toBe('number');
  });
});
