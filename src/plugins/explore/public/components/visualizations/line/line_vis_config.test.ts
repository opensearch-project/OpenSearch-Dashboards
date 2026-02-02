/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createLineConfig } from './line_vis_config';
import { LineVisStyleControls } from './line_vis_options';
import { GridOptions, ThresholdMode, Positions, TooltipOptions } from '../types';
import { LineStyle } from './line_exclusive_vis_options';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('line_vis_config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLineConfig', () => {
    it('should create a line visualization type configuration', () => {
      const config = createLineConfig();

      // Verify the basic structure
      expect(config).toHaveProperty('name', 'line');
      expect(config).toHaveProperty('type', 'line');
      expect(config).toHaveProperty('ui.style.defaults');
      expect(config).toHaveProperty('ui.style.render');
    });

    it('should have the correct default style settings', () => {
      const config = createLineConfig();
      const defaults = config.ui.style.defaults;

      // Verify basic controls
      expect(defaults.addLegend).toBe(true);
      expect(defaults.legendPosition).toBe(Positions.BOTTOM);
      expect(defaults.addTimeMarker).toBe(false);

      // Verify line style
      expect(defaults.lineStyle).toBe('line');
      expect(defaults.lineMode).toBe('straight');
      expect(defaults.lineWidth).toBe(2);

      // Verify tooltip options
      expect(defaults.tooltipOptions).toEqual({
        mode: 'all',
      });

      // Verify threshold settings
      expect(defaults.thresholdOptions).toMatchObject({
        baseColor: '#00BD6B',
        thresholds: [],
        thresholdStyle: ThresholdMode.Off,
      });

      expect(defaults.titleOptions).toMatchObject({
        show: false,
        titleName: '',
      });
    });

    it('should have available mappings configured', () => {
      const config = createLineConfig();

      expect(config.ui.availableMappings).toHaveLength(9);
      expect(config.ui.availableMappings[0]).toHaveProperty('x');
      expect(config.ui.availableMappings[0]).toHaveProperty('y');
    });

    it('should render the LineVisStyleControls component with the provided props', () => {
      const config = createLineConfig();
      const renderFunction = config.ui.style.render;

      // Mock props
      const mockProps = {
        styleOptions: {
          addLegend: true,
          legendPosition: Positions.RIGHT,
          thresholdOptions: {
            baseColor: '#00BD6B',
            thresholds: [],
            thresholdStyle: ThresholdMode.Solid,
          },
          addTimeMarker: false,
          lineStyle: 'both' as LineStyle,
          lineMode: 'smooth' as const,
          lineWidth: 1,
          tooltipOptions: { mode: 'all' } as TooltipOptions,
          grid: {} as GridOptions,
          standardAxes: [],
          titleOptions: {
            show: true,
            titleName: '',
          },
          showFullTimeRange: false,
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
      expect(React.createElement).toHaveBeenCalledWith(LineVisStyleControls, mockProps);
    });
  });
});
