/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGauge } from './to_expression';
import { VisColumn, VisFieldType, AxisRole } from '../types';
import { defaultGaugeChartStyles } from './gauge_vis_config';
import * as utils from '../utils/utils';

jest.mock('./gauge_chart_utils', () => ({
  ...jest.requireActual('./gauge_chart_utils'),
  mergeThresholdsWithBase: jest.fn(() => [{ value: 0, color: '#00BD6B' }]),
  locateThreshold: jest.fn(() => ({ value: 0, color: '#00BD6B' })),
  generateRanges: jest.fn(() => [{ min: 0, max: 100, color: '#00BD6B' }]),
  generateArcExpression: jest.fn(() => ({ mark: { type: 'arc' } })),
  getMaxAndMinBase: jest.fn(() => ({ minBase: 10, maxBase: 200 })),
}));

jest.mock('../utils/calculation', () => ({
  calculateValue: jest.fn(() => 50),
}));

jest.mock('../utils/utils', () => {
  const actual = jest.requireActual('../utils/utils');
  return {
    ...actual,
    getChartRender: jest.fn().mockReturnValue('vega'),
  };
});

describe('createGauge', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'value',
    column: 'value',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockData = [{ value: 10 }, { value: 20 }, { value: 30 }];

  const mockAxisColumnMappings = {
    [AxisRole.Value]: mockNumericalColumn,
  };

  it('creates basic gauge spec', () => {
    const spec = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      defaultGaugeChartStyles,
      mockAxisColumnMappings
    );

    expect(spec.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json');
    expect(spec.autosize).toEqual({ type: 'fit', contains: 'padding' });
    expect(spec.params).toBeDefined();
    expect(spec.layer).toBeDefined();
  });

  it('uses custom min and max values', () => {
    const customStyles = {
      ...defaultGaugeChartStyles,
      min: 10,
      max: 200,
    };

    const spec = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      customStyles,
      mockAxisColumnMappings
    );

    expect(spec.params.find((p) => p.name === 'minValue')?.value).toBe(10);
    expect(spec.params.find((p) => p.name === 'maxValue')?.value).toBe(200);
  });

  it('includes title when showTitle is true', () => {
    const customStyles = {
      ...defaultGaugeChartStyles,
      showTitle: true,
      title: 'Custom Gauge Title',
    };

    const spec = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      customStyles,
      mockAxisColumnMappings
    );

    const titleLayer = spec.layer.find(
      (l: any) => l.encoding?.text?.value === 'Custom Gauge Title'
    );
    expect(titleLayer).toBeDefined();
  });

  it('excludes title when showTitle is false', () => {
    const customStyles = {
      ...defaultGaugeChartStyles,
      showTitle: false,
      title: 'myTitle',
    };

    const spec = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      customStyles,
      mockAxisColumnMappings
    );

    const titleLayer = spec.layer.find(
      (l: any) =>
        l.encoding?.text &&
        typeof l.encoding.text.value === 'string' &&
        l.encoding.text.value === 'myTitle'
    );
    expect(titleLayer).toBeUndefined();
  });

  it('uses fallback values when no axis mappings provided', () => {
    const spec = createGauge(mockData, [mockNumericalColumn], [], [], defaultGaugeChartStyles);

    expect(spec.params.find((p) => p.name === 'mainValue')?.value).toBe(50);
  });
});

// TODO rename after cleaning
describe('createGauge in echarts', () => {
  beforeEach(() => {
    jest.spyOn(utils, 'getChartRender').mockReturnValue('echarts');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'value',
    column: 'value',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockData = [{ value: 10 }, { value: 20 }, { value: 30 }];

  const mockAxisColumnMappings = {
    [AxisRole.Value]: mockNumericalColumn,
  };

  it('should create ECharts gauge specification with valid mappings', () => {
    const result = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      defaultGaugeChartStyles,
      mockAxisColumnMappings
    );

    expect(result).toHaveProperty('series');
    expect(result?.series[0].type).toBe('gauge');
    expect(result).toHaveProperty('dataset');
  });

  it('uses custom min and max values', () => {
    const customStyles = {
      ...defaultGaugeChartStyles,
      min: 10,
      max: 200,
    };

    const result = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      customStyles,
      mockAxisColumnMappings
    );

    // value arc
    expect(result?.series[0].min).toBe(10);
    expect(result?.series[0].max).toBe(200);

    // threshold arc
    expect(result?.series[0].min).toBe(10);
    expect(result?.series[0].max).toBe(200);
  });

  it('includes title when showTitle is true', () => {
    const customStyles = {
      ...defaultGaugeChartStyles,
      showTitle: true,
      title: 'Custom Gauge Title',
    };

    const result = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      customStyles,
      mockAxisColumnMappings
    );

    const textCustomSeries = result.series?.[2];
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

    expect(renderResult.children[1]).toEqual(
      expect.objectContaining({
        type: 'text',
        style: expect.objectContaining({
          text: 'Custom Gauge Title',
        }),
      })
    );
  });
});
