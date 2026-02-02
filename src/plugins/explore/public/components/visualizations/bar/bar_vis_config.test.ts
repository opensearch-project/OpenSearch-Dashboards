/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createBarConfig, defaultBarChartStyles } from './bar_vis_config';
import { Positions, ThresholdMode, AxisRole, AggregationType, TimeUnit } from '../types';
import { BarVisStyleControls } from './bar_vis_options';

describe('bar_vis_config', () => {
  describe('defaultBarChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultBarChartStyles).toMatchObject({
        // Basic controls
        addLegend: true,
        legendPosition: Positions.BOTTOM,
        tooltipOptions: {
          mode: 'all',
        },

        // Bar specific controls
        barWidth: 0.7,
        barPadding: 0.1,
        showBarBorder: false,
        barBorderWidth: 1,
        barBorderColor: '#000000',

        // Threshold and grid
        thresholdOptions: {
          baseColor: '#00BD6B',
          thresholds: [],
          thresholdStyle: ThresholdMode.Off,
        },

        titleOptions: {
          show: false,
          titleName: '',
        },
        bucket: {
          aggregationType: AggregationType.SUM,
          bucketTimeUnit: TimeUnit.AUTO,
        },
        useThresholdColor: false,
      });

      // Check axes configuration
      expect(defaultBarChartStyles.standardAxes).toHaveLength(1);
      expect(defaultBarChartStyles.standardAxes[0]).toEqual(
        expect.objectContaining({
          grid: {
            showLines: false,
          },
          axisRole: AxisRole.X,
        })
      );

      expect(defaultBarChartStyles.titleOptions).toMatchObject({
        show: false,
        titleName: '',
      });
    });
  });

  describe('createBarConfig', () => {
    test('should return the correct visualization type configuration', () => {
      const config = createBarConfig();

      expect(config).toMatchObject({
        name: 'bar',
        type: 'bar',
        ui: {
          style: {
            defaults: defaultBarChartStyles,
            render: expect.any(Function),
          },
        },
      });

      // Verify availableMappings exists
      expect(config.ui.availableMappings).toBeDefined();
      expect(Array.isArray(config.ui.availableMappings)).toBe(true);
    });

    test('render function should create a BarVisStyleControls component', () => {
      const config = createBarConfig();
      const mockCreateElement = jest.spyOn(React, 'createElement');

      // Call the render function with some props
      const props = {
        styleOptions: defaultBarChartStyles,
        onStyleChange: jest.fn(),
        axisColumnMappings: {},
        updateVisualization: jest.fn(),
      };
      config.ui.style.render(props);

      // Verify React.createElement was called with the right component
      expect(mockCreateElement).toHaveBeenCalledWith(
        BarVisStyleControls, // This is the BarVisStyleControls component
        props
      );

      mockCreateElement.mockRestore();
    });
  });
});
