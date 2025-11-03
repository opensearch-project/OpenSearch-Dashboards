/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { createHistogramConfig, defaultHistogramChartStyles } from './histogram_vis_config';
import { Positions, ThresholdMode, AxisRole, AggregationType } from '../types';
import { HistogramVisStyleControls } from './histogram_vis_options';

describe('bar_vis_config', () => {
  describe('defaultHistogramChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultHistogramChartStyles).toMatchObject({
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
        },
        useThresholdColor: false,
      });

      // Check axes configuration
      expect(defaultHistogramChartStyles.standardAxes).toHaveLength(2);
      expect(defaultHistogramChartStyles.standardAxes[1]).toMatchObject({
        id: 'Axis-2',
        position: Positions.LEFT,
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: '',
        },
        grid: {
          showLines: true,
        },
        axisRole: AxisRole.Y,
      });

      expect(defaultHistogramChartStyles.standardAxes[0]).toMatchObject({
        id: 'Axis-1',
        position: Positions.BOTTOM,
        show: true,
        style: {},
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: '',
        },
        grid: {
          showLines: false,
        },
        axisRole: AxisRole.X,
      });

      expect(defaultHistogramChartStyles.titleOptions).toMatchObject({
        show: false,
        titleName: '',
      });
    });
  });

  describe('createHistogramConfig', () => {
    test('should return the correct visualization type configuration', () => {
      const config = createHistogramConfig();

      expect(config).toMatchObject({
        name: 'histogram',
        type: 'histogram',
        ui: {
          style: {
            defaults: defaultHistogramChartStyles,
            render: expect.any(Function),
          },
        },
      });

      // Verify availableMappings exists
      expect(config.ui.availableMappings).toBeDefined();
      expect(Array.isArray(config.ui.availableMappings)).toBe(true);
    });

    test('render function should create a HistogramVisStyleControls component', () => {
      const config = createHistogramConfig();
      const mockCreateElement = jest.spyOn(React, 'createElement');

      // Call the render function with some props
      const props = {
        styleOptions: defaultHistogramChartStyles,
        onStyleChange: jest.fn(),
        axisColumnMappings: {},
        updateVisualization: jest.fn(),
      };
      config.ui.style.render(props);

      // Verify React.createElement was called with the right component
      expect(mockCreateElement).toHaveBeenCalledWith(
        HistogramVisStyleControls, // This is the HistogramVisStyleControls component
        props
      );

      mockCreateElement.mockRestore();
    });
  });
});
