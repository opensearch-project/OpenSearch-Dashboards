/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGaugeSeries } from './gauge_chart_utils';
import { GaugeChartStyle } from './gauge_vis_config';
import { EChartsSpecState } from '../utils/echarts_spec';

jest.mock('../utils/calculation', () => ({
  calculateValue: jest.fn((values: number[], method: string) => {
    if (method === 'last') return values[values.length - 1];
    if (method === 'max') return Math.max(...values);
    if (method === 'min') return Math.min(...values);
    return values[values.length - 1];
  }),
}));

jest.mock('../style_panel/unit/collection', () => ({
  getUnitById: jest.fn(),
  showDisplayValue: jest.fn(() => `unit_test`),
}));

jest.mock('../style_panel/threshold/threshold_utils', () => ({
  getMaxAndMinBase: jest.fn((min: number, max: number, styleMin?: number, styleMax?: number) => ({
    minBase: styleMin !== undefined ? styleMin : min,
    maxBase: styleMax !== undefined ? styleMax : max,
  })),
  mergeThresholdsWithBase: jest.fn(() => ({
    textColor: '#333333',
    mergedThresholds: [
      { value: 0, color: 'blue' },
      { value: 100, color: 'green' },
    ],
  })),
  locateThreshold: jest.fn(() => ({ value: 80, color: 'green' })),
}));

jest.mock('../theme/default_colors', () => ({
  getColors: jest.fn(() => ({
    backgroundShade: '#f0f0f0',
    text: '#333333',
    statusGreen: '#00ff00',
  })),
  DEFAULT_GREY: '#cccccc',
}));

describe('gauge_chart_utils', () => {
  describe('createGaugeSeries', () => {
    const mockStyles: GaugeChartStyle = {
      showTitle: true,
      title: 'Test Gauge',
      thresholdOptions: {
        thresholds: [],
        baseColor: 'red',
      },
      useThresholdColor: false,
      valueCalculation: 'last',
    };

    const mockState = {
      transformedData: [
        ['value1', 'value2'],
        [10, 20],
        [15, 30],
      ],
      axisColumnMappings: { value: { name: 'Value' } },
    } as EChartsSpecState;

    it('creates gauge series with valid data', () => {
      const seriesFields = ['value1'];

      const result = createGaugeSeries({ styles: mockStyles, seriesFields })(mockState);

      expect(result.series?.length).toBe(3);
      expect(result?.series?.[0]).toEqual(
        expect.objectContaining({
          type: 'gauge',
          data: [{ value: 15 }],
        })
      );
    });

    it('creates correct thresholds arc with valid data', () => {
      const seriesFields = ['value1'];

      const result = createGaugeSeries({
        styles: { ...mockStyles, min: 0, max: 100 },
        seriesFields,
      })(mockState);

      expect(result.series?.length).toBe(3);
      expect(result?.series?.[1].axisLine.lineStyle).toEqual(
        expect.objectContaining({
          color: [
            [0, 'blue'],
            [1, 'blue'],
            [1, 'green'],
          ],
          width: 16,
        })
      );
    });

    it('creates series with multiple fields', () => {
      const seriesFields = ['value1', 'value2'];
      const result = createGaugeSeries({ styles: mockStyles, seriesFields })(mockState);

      expect(result?.series?.length).toBe(6);
      expect(result?.series?.[0]).toEqual(
        expect.objectContaining({
          type: 'gauge',
          data: [{ value: 15 }],
        })
      );
      expect(result?.series?.[3]).toEqual(
        expect.objectContaining({
          type: 'gauge',
          data: [{ value: 30 }],
        })
      );
    });

    it('handles custom min and max values', () => {
      const stylesWithMinMax: GaugeChartStyle = {
        ...mockStyles,
        min: 0,
        max: 100,
      };
      const seriesFields = ['value1'];
      const result = createGaugeSeries({ styles: stylesWithMinMax, seriesFields })(mockState);

      expect(result?.series?.[0]).toEqual(
        expect.objectContaining({
          type: 'gauge',
          min: 0,
          max: 100,
        })
      );
    });

    it('tests renderItem function in textCustom series', () => {
      const seriesFields = ['value1'];
      const result = createGaugeSeries({ styles: mockStyles, seriesFields })(mockState);

      const textCustomSeries = result.series?.[2] as any;
      expect(textCustomSeries.type).toBe('custom');
      expect(textCustomSeries.coordinateSystem).toBe('polar');
      expect(typeof textCustomSeries.renderItem).toBe('function');

      const mockApi = {
        getWidth: () => 400,
        getHeight: () => 300,
      };
      const mockParams = {
        dataIndex: 0,
        seriesIndex: 0,
      };

      const renderResult = textCustomSeries.renderItem(mockParams, mockApi);

      expect(renderResult).toEqual(
        expect.objectContaining({
          type: 'group',
          x: 200, // width * 0.5
          y: 180, // height * 0.6
        })
      );

      expect(renderResult.children[0]).toEqual(
        expect.objectContaining({
          type: 'text',
          style: expect.objectContaining({
            textAlign: 'center',
            fontWeight: 'bold',
            text: 'unit_test',
          }),
        })
      );
    });

    it('handles different value calculation methods', () => {
      const stylesWithAverage: GaugeChartStyle = {
        ...mockStyles,
        valueCalculation: 'min',
      };
      const seriesFields = ['value1'];

      const result = createGaugeSeries({ styles: stylesWithAverage, seriesFields })(mockState);

      expect(result?.series?.[0]).toEqual(
        expect.objectContaining({
          type: 'gauge',
          data: [{ value: 10 }],
        })
      );
    });

    it('creates correct gauge series structure', () => {
      const seriesFields = ['value1'];
      const pipelineFn = createGaugeSeries({ styles: mockStyles, seriesFields });
      const result = pipelineFn(mockState);

      const [valueArc, thresholdArc, textCustom] = result.series;

      // Check valueArc structure
      expect(valueArc.type).toBe('gauge');
      expect(valueArc.center).toEqual(['50%', '60%']);
      expect(valueArc.startAngle).toBe(200);
      expect(valueArc.endAngle).toBe(-20);

      // Check thresholdArc structure
      expect(thresholdArc.type).toBe('gauge');
      expect(thresholdArc.center).toEqual(['50%', '60%']);

      // Check textCustom structure
      expect(textCustom.type).toBe('custom');
      expect(textCustom.coordinateSystem).toBe('polar');
    });
  });
});
