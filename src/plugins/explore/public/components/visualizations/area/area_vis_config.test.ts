/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createAreaConfig } from './area_vis_config';
import { Positions, ThresholdMode, AxisRole, VisFieldType } from '../types';
import { AreaVisStyleControls } from './area_vis_options';

describe('area_vis_config', () => {
  // Get the default styles from the config
  const defaultAreaChartStyles = createAreaConfig().ui.style.defaults;

  describe('defaultAreaChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultAreaChartStyles).toMatchObject({
        addLegend: true,
        legendPosition: Positions.BOTTOM,
        addTimeMarker: false,
        tooltipOptions: {
          mode: 'all',
        },
      });

      // Check threshold lines
      expect(defaultAreaChartStyles.thresholdOptions).toMatchObject({
        baseColor: '#00BD6B',
        thresholds: [],
        thresholdStyle: ThresholdMode.Off,
      });

      expect(defaultAreaChartStyles.titleOptions).toMatchObject({
        show: false,
        titleName: '',
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
          availableMappings: [
            {
              [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 1 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
              [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Date, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 1 },
              [AxisRole.FACET]: { type: VisFieldType.Categorical, index: 1 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 1 },
            },
            {
              [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
              [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
              [AxisRole.COLOR]: { type: VisFieldType.Numerical, index: 1 },
            },
          ],
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
