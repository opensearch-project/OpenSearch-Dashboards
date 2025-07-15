/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createBarConfig, defaultBarChartStyles } from './bar_vis_config';
import { Positions, ThresholdLineStyle } from '../types';
import { BarVisStyleControls } from './bar_vis_options';

describe('bar_vis_config', () => {
  describe('defaultBarChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultBarChartStyles).toMatchObject({
        // Basic controls
        addLegend: true,
        legendPosition: Positions.RIGHT,
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
        thresholdLines: [
          {
            id: '1',
            color: '#E7664C',
            show: false,
            style: ThresholdLineStyle.Full,
            value: 10,
            width: 1,
            name: '',
          },
        ],
        grid: {
          xLines: true,
          yLines: true,
        },
      });

      // Check axes configuration
      expect(defaultBarChartStyles.categoryAxes).toHaveLength(1);
      expect(defaultBarChartStyles.categoryAxes[0]).toMatchObject({
        id: 'CategoryAxis-1',
        type: 'category',
        position: Positions.BOTTOM,
        show: true,
        labels: {
          show: true,
          filter: true,
          rotate: 0,
          truncate: 100,
        },
        title: {
          text: '',
        },
      });

      expect(defaultBarChartStyles.valueAxes).toHaveLength(1);
      expect(defaultBarChartStyles.valueAxes[0]).toMatchObject({
        id: 'ValueAxis-1',
        name: 'LeftAxis-1',
        type: 'value',
        position: Positions.LEFT,
        show: true,
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: {
          text: '',
        },
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
