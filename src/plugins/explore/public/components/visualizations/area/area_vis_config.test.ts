/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createAreaConfig } from './area_vis_config';
import { AxisRole, Positions, ThresholdMode, VisFieldType } from '../types';
import { AreaVisStyleControls } from './area_vis_options';
import { DEFAULT_POINT_SIZE } from '../style_panel/share';

jest.mock('./to_expression', () => ({
  createSimpleAreaChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createMultiAreaChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createCategoryAreaChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createStackedAreaChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
}));

describe('area_vis_config', () => {
  const defaultAreaChartStyles = createAreaConfig().ui.style.defaults;

  describe('defaultAreaChartStyles', () => {
    test('should have the expected default values', () => {
      expect(defaultAreaChartStyles).toMatchObject({
        addLegend: true,
        legendPosition: Positions.BOTTOM,
        addTimeMarker: false,
        gradientMode: 'none',
        stackMode: 'total',
        showValues: false,
        tooltipOptions: {
          mode: 'all',
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

    test('should only pass the shared crosshair group to rules with a date x-axis', () => {
      const config = createAreaConfig();
      const crosshairGroup = 'dashboard';

      config.getRules().forEach((rule) => {
        const rendered = rule.render({
          data: [],
          allData: [],
          styleOptions: config.ui.style.defaults,
          axisColumnMappings: {
            x: [{}],
            y: [{}],
            color: [{}],
          },
          timeRange: { from: 'now-1h', to: 'now' },
          renderContext: { crosshairGroup },
        } as any) as React.ReactElement<{ group?: string }>;
        const hasDateXAxis = rule.mappings.some(
          (mapping) => mapping[AxisRole.X]?.type === VisFieldType.Date
        );

        expect(rendered.props.group).toBe(hasDateXAxis ? crosshairGroup : undefined);
      });
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
