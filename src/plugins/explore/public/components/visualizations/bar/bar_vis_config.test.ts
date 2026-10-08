/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createBarConfig, defaultBarChartStyles } from './bar_vis_config';
import {
  Positions,
  ThresholdMode,
  AxisRole,
  AggregationType,
  TimeUnit,
  VisFieldType,
} from '../types';
import { BarVisStyleControls } from './bar_vis_options';

jest.mock('./to_expression', () => ({
  createBarSpec: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createDoubleNumericalBarChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createGroupedTimeBarChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createStackedBarSpec: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createTimeBarChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
}));

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

    test('should only pass the shared crosshair group to rules with a date x-axis', () => {
      const config = createBarConfig();
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
