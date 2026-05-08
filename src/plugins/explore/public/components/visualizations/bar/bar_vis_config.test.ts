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
        addLegend: true,
        legendPosition: Positions.BOTTOM,
        tooltipOptions: {
          mode: 'all',
        },
        barWidth: 0.7,
        barPadding: 0.1,
        showBarBorder: false,
        barBorderWidth: 1,
        barBorderColor: '#000000',
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

      expect(defaultBarChartStyles.standardAxes).toHaveLength(1);
      expect(defaultBarChartStyles.standardAxes[0]).toEqual(
        expect.objectContaining({
          grid: {
            showLines: false,
          },
          axisRole: AxisRole.X,
        })
      );
    });
  });

  describe('createBarConfig', () => {
    test('should return the correct visualization type configuration', () => {
      const config = createBarConfig();

      expect(config).toMatchObject({
        name: 'Bar',
        type: 'bar',
        ui: {
          style: {
            defaults: defaultBarChartStyles,
            render: expect.any(Function),
          },
        },
      });

      expect(typeof config.getRules).toBe('function');
      expect(Array.isArray(config.getRules())).toBe(true);
    });

    test('render function should create a BarVisStyleControls component', () => {
      const config = createBarConfig();
      const mockCreateElement = jest.spyOn(React, 'createElement');

      const props = {
        styleOptions: defaultBarChartStyles,
        onStyleChange: jest.fn(),
        axisColumnMappings: {},
        updateVisualization: jest.fn(),
      };
      config.ui.style.render(props);

      expect(mockCreateElement).toHaveBeenCalledWith(BarVisStyleControls, props);

      mockCreateElement.mockRestore();
    });
  });
});
