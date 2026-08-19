/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createAreaConfig } from './area_vis_config';
import { Positions, ThresholdMode, DisableMode } from '../types';
import { AreaVisStyleControls } from './area_vis_options';
import { DEFAULT_POINT_SIZE } from '../style_panel/share';

describe('area_vis_config', () => {
  const defaultAreaChartStyles = createAreaConfig().ui.style.defaults;

  describe('defaultAreaChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultAreaChartStyles).toMatchObject({
        addLegend: true,
        legendPosition: Positions.BOTTOM,
        addTimeMarker: false,
        areaOpacity: 30,
        gradientMode: 'none',
        stackMode: 'none',
        pointSize: DEFAULT_POINT_SIZE,
        showValues: false,
        tooltipOptions: {
          mode: 'all',
        },
        connectNullValues: {
          connectMode: DisableMode.Always,
          threshold: '1h',
        },
        disconnectValues: {
          disableMode: DisableMode.Never,
          threshold: '1h',
        },
      });

      expect(defaultAreaChartStyles.thresholdOptions).toMatchObject({
        baseColor: '#00BD6B',
        thresholds: [],
        thresholdStyle: ThresholdMode.Off,
      });
    });
  });

  describe('createAreaConfig', () => {
    test('should return the correct visualization type configuration', () => {
      const config = createAreaConfig();

      expect(config).toMatchObject({
        name: 'Area',
        icon: 'visArea',
        type: 'area',
        ui: {
          style: {
            defaults: defaultAreaChartStyles,
            render: expect.any(Function),
          },
        },
      });

      expect(typeof config.getRules).toBe('function');
      expect(Array.isArray(config.getRules())).toBe(true);
    });

    test('render function should create an AreaVisStyleControls component', () => {
      const config = createAreaConfig();
      const mockCreateElement = jest.spyOn(React, 'createElement');

      const props = {
        styleOptions: defaultAreaChartStyles,
        onStyleChange: jest.fn(),
        axisColumnMappings: {},
        updateVisualization: jest.fn(),
      };
      config.ui.style.render(props);

      expect(mockCreateElement).toHaveBeenCalledWith(AreaVisStyleControls, props);

      mockCreateElement.mockRestore();
    });
  });
});
