/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  createHeatmapConfig,
  HeatmapChartStyleControls,
  HeatmapLabels,
} from './heatmap_vis_config';
import { HeatmapVisStyleControls } from './heatmap_vis_options';
import {
  AggregationType,
  Positions,
  ColorSchemas,
  ScaleType,
  AxisRole,
  StandardAxes,
} from '../types';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createHeatmapeConfig', () => {
  it('should create a heatmap visualization type configuration', () => {
    const config = createHeatmapConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'heatmap');
    expect(config).toHaveProperty('type', 'heatmap');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createHeatmapConfig();
    const defaults = config.ui.style.defaults as HeatmapChartStyleControls;
    // Verify basic controls
    expect(defaults.tooltipOptions.mode).toBe('all');
    expect(defaults.addLegend).toBe(true);
    expect(defaults.legendPosition).toBe(Positions.RIGHT);
    // Verify exclusive style
    expect(defaults.exclusive.colorSchema).toBe(ColorSchemas.BLUES);
    expect(defaults.exclusive.reverseSchema).toBe(false);
    expect(defaults.exclusive.colorScaleType).toBe(ScaleType.LINEAR);
    expect(defaults.exclusive.scaleToDataBounds).toBe(false);
    expect(defaults.exclusive.maxNumberOfColors).toBe(4);
    expect(defaults.exclusive.useCustomRanges).toBe(false);
    expect(defaults.exclusive.customRanges).toBeUndefined();

    // Verify label settings
    expect(defaults.exclusive.label).toEqual({
      show: false,
      rotate: false,
      overwriteColor: false,
      color: 'black',
      type: AggregationType.SUM,
    });

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
  it('should have available mappings configured', () => {
    const config = createHeatmapConfig();

    expect(config.ui.availableMappings).toBeDefined();
    expect(config.ui.availableMappings).toHaveLength(1);

    expect(config.ui.availableMappings[0]).toHaveProperty(AxisRole.X);
    expect(config.ui.availableMappings[0]).toHaveProperty(AxisRole.Y);
    expect(config.ui.availableMappings[0]).toHaveProperty(AxisRole.COLOR);
  });

  it('should render the HeatmapVisStyleControls component with the provided props', () => {
    const config = createHeatmapConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: {
        switchAxes: false,
        tooltipOptions: { mode: 'hidden' as const },
        addLegend: false,
        legendPosition: Positions.RIGHT,
        exclusive: {
          colorSchema: ColorSchemas.BLUES,
          reverseSchema: false,
          colorScaleType: ScaleType.LINEAR,
          scaleToDataBounds: false,
          percentageMode: false,
          maxNumberOfColors: 4,
          useCustomRanges: false,
          label: {} as HeatmapLabels,
        },
        standardAxes: [] as StandardAxes[],
      } as HeatmapChartStyleControls,
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
    expect(React.createElement).toHaveBeenCalledWith(HeatmapVisStyleControls, mockProps);
  });
});
