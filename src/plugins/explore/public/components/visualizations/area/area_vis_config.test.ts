/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createAreaConfig } from './area_vis_config';
import { Positions, ThresholdLineStyle } from '../types';
import { AreaVisStyleControls } from './area_vis_options';

describe('area_vis_config', () => {
  // Get the default styles from the config
  const defaultAreaChartStyles = createAreaConfig().ui.style.defaults;

  describe('defaultAreaChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultAreaChartStyles).toMatchObject({
        addLegend: true,
        legendPosition: Positions.RIGHT,
        addTimeMarker: false,
        tooltipOptions: {
          mode: 'all',
        },
        grid: {
          categoryLines: true,
          valueLines: true,
        },
      });

      // Check threshold lines
      expect(defaultAreaChartStyles.thresholdLines).toHaveLength(1);
      expect(defaultAreaChartStyles.thresholdLines[0]).toMatchObject({
        id: '1',
        color: '#E7664C',
        show: false,
        style: ThresholdLineStyle.Full,
        value: 10,
        width: 1,
        name: '',
      });

      // Check axes configuration
      expect(defaultAreaChartStyles.categoryAxes).toHaveLength(1);
      expect(defaultAreaChartStyles.categoryAxes[0]).toMatchObject({
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

      expect(defaultAreaChartStyles.valueAxes).toHaveLength(1);
      expect(defaultAreaChartStyles.valueAxes[0]).toMatchObject({
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

  describe('createAreaConfig', () => {
    test('should return the correct visualization type configuration', () => {
      const config = createAreaConfig();

      expect(config).toEqual({
        name: 'area',
        type: 'area',
        ui: {
          style: {
            defaults: defaultAreaChartStyles,
            render: expect.any(Function),
          },
          availableMappings: [],
        },
      });
    });

    test('render function should create an AreaVisStyleControls component', () => {
      const config = createAreaConfig();
      const mockCreateElement = jest.spyOn(React, 'createElement');

      // Call the render function with some props
      const props = {
        styleOptions: defaultAreaChartStyles,
        onStyleChange: jest.fn(),
        axisColumnMappings: {},
        updateVisualization: jest.fn(),
      };
      config.ui.style.render(props);

      // Verify React.createElement was called with the right component
      expect(mockCreateElement).toHaveBeenCalledWith(AreaVisStyleControls, props);

      mockCreateElement.mockRestore();
    });
  });
});
