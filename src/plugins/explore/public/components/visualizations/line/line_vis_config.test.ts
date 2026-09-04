/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createLineConfig, defaultLineChartStyles } from './line_vis_config';
import { LineVisStyleControls } from './line_vis_options';
import {
  GridOptions,
  ThresholdMode,
  Positions,
  TooltipOptions,
  LineStyle,
  VisFieldType,
  AxisRole,
} from '../types';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

jest.mock('./to_expression', () => ({
  createSimpleLineChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createLineBarChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createMultiLineChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createCategoryLineChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
  createCategoryMultiLineChart: jest.fn(() => ({ spec: {}, legendItems: [] })),
}));

describe('line_vis_config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (React.createElement as jest.Mock).mockImplementation((type, props) => ({ type, props }));
  });

  describe('createLineConfig', () => {
    it('should create a line visualization type configuration', () => {
      const config = createLineConfig();

      expect(config).toHaveProperty('name', 'Line');
      expect(config).toHaveProperty('type', 'line');
      expect(config).toHaveProperty('ui.style.defaults');
      expect(config).toHaveProperty('ui.style.render');
    });

    it('should have the correct default style settings', () => {
      const config = createLineConfig();
      const defaults = config.ui.style.defaults;

      expect(defaults.addLegend).toBe(true);
      expect(defaults.legendPosition).toBe(Positions.BOTTOM);
      expect(defaults.addTimeMarker).toBe(false);

      expect(defaults.lineStyle).toBe('line');
      expect(defaults.lineMode).toBe('straight');
      expect(defaults.lineWidth).toBe(2);

      expect(defaults.tooltipOptions).toEqual({
        mode: 'all',
      });

      expect(defaults.thresholdOptions).toMatchObject({
        baseColor: '#00BD6B',
        thresholds: [],
        thresholdStyle: ThresholdMode.Off,
      });
    });

    it('should have getRules configured', () => {
      const config = createLineConfig();

      expect(typeof config.getRules).toBe('function');
      const rules = config.getRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    });

    it('should only pass the shared crosshair group to rules with a date x-axis', () => {
      const config = createLineConfig();
      const crosshairGroup = 'dashboard';

      config.getRules().forEach((rule) => {
        const rendered = rule.render({
          data: [],
          allData: [],
          styleOptions: config.ui.style.defaults,
          axisColumnMappings: {
            x: [{}],
            y: [{}],
            y2: [{}],
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

    it('should render the LineVisStyleControls component with the provided props', () => {
      const config = createLineConfig();
      const renderFunction = config.ui.style.render;

      const mockProps = {
        styleOptions: {
          ...defaultLineChartStyles,
          addLegend: true,
          legendPosition: Positions.RIGHT,
          thresholdOptions: {
            baseColor: '#00BD6B',
            thresholds: [],
            thresholdStyle: ThresholdMode.Solid,
          },
          addTimeMarker: false,
          lineStyle: 'both' as LineStyle,
          lineMode: 'smooth' as const,
          lineWidth: 1,
          tooltipOptions: { mode: 'all' } as TooltipOptions,
          grid: {} as GridOptions,
          standardAxes: [],
          showFullTimeRange: true,
        },
        onStyleChange: jest.fn(),
        numericalColumns: [],
        categoricalColumns: [],
        dateColumns: [],
        axisColumnMappings: {},
        updateVisualization: jest.fn(),
      };

      renderFunction(mockProps);

      expect(React.createElement).toHaveBeenCalledWith(LineVisStyleControls, mockProps);
    });
  });
});
