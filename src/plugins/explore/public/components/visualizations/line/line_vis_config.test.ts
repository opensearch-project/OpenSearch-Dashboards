/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createLineConfig, LineChartStyleControls } from './line_vis_config';
import { LineVisStyleControls } from './line_vis_options';
import { Positions } from '../utils/collections';
import { CategoryAxis, GridOptions, ThresholdLineStyle, ValueAxis } from '../types';

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
      const defaults = config.ui.style.defaults as LineChartStyleControls;

      // Verify basic controls
      expect(defaults.addTooltip).toBe(true);
      expect(defaults.addLegend).toBe(true);
      expect(defaults.legendPosition).toBe(Positions.RIGHT);
      expect(defaults.addTimeMarker).toBe(false);

      // Verify line style
      expect(defaults.showLine).toBe(true);
      expect(defaults.lineMode).toBe('smooth');
      expect(defaults.lineWidth).toBe(2);
      expect(defaults.showDots).toBe(true);

      // Verify threshold settings
      expect(defaults.thresholdLine).toEqual({
        color: '#E7664C',
        show: false,
        style: ThresholdLineStyle.Full,
        value: 10,
        width: 1,
      });

      // Verify grid settings
      expect(defaults.grid).toEqual({
        categoryLines: true,
        valueLines: true,
      });

      // Verify axes
      expect(defaults.categoryAxes).toHaveLength(1);
      expect(defaults.categoryAxes[0]).toHaveProperty('position', Positions.BOTTOM);
      expect(defaults.valueAxes).toHaveLength(1);
      expect(defaults.valueAxes[0]).toHaveProperty('position', Positions.LEFT);
    });

    it('should render the LineVisStyleControls component with the provided props', () => {
      const config = createLineConfig();
      const renderFunction = config.ui.style.render;

      // Mock props
      const mockProps = {
        styleOptions: {
          addTooltip: true,
          addLegend: true,
          legendPosition: Positions.RIGHT,
          thresholdLine: {
            show: false,
            value: 100,
            color: 'red',
            width: 1,
            style: ThresholdLineStyle.Dashed,
          },
          addTimeMarker: false,
          showLine: true,
          lineMode: '',
          lineWidth: 1,
          showDots: true,
          grid: {} as GridOptions,
          categoryAxes: [] as CategoryAxis[],
          valueAxes: [] as ValueAxis[],
        },
        onStyleChange: jest.fn(),
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
      };

      // Call the render function
      renderFunction(mockProps);

      // Verify that React.createElement was called with the correct arguments
      expect(React.createElement).toHaveBeenCalledWith(LineVisStyleControls, mockProps);
    });
  });
});
