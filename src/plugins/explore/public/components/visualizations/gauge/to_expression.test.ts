/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGauge } from './to_expression';
import { VisColumn, VisFieldType, AxisRole } from '../types';
import { defaultGaugeChartStyles } from './gauge_vis_config';

jest.mock('./gauge_chart_utils', () => ({
  mergeCustomRangesWithBase: jest.fn(() => [{ value: 0, color: '#9EE9FA' }]),
  locateRange: jest.fn(() => 0),
  generateRanges: jest.fn(() => [{ min: 0, max: 100, color: '#9EE9FA' }]),
  generateArcExpression: jest.fn(() => ({ type: 'arc' })),
}));

jest.mock('../utils/utils', () => ({
  calculateValue: jest.fn(() => 50),
}));

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

    expect(spec.$schema).toBe('https://vega.github.io/schema/vega/v5.json');
    expect(spec.autosize).toEqual({ type: 'fit', contains: 'padding' });
    expect(spec.signals).toBeDefined();
    expect(spec.scales).toBeDefined();
    expect(spec.marks).toBeDefined();
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

    expect(spec.signals.find((s) => s.name === 'minValue')?.value).toBe(10);
    expect(spec.signals.find((s) => s.name === 'maxValue')?.value).toBe(200);
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

    const titleMark = spec.marks.find((m: any) => m.name === 'gaugeTitle');
    expect(titleMark).toBeDefined();
    expect((titleMark?.encode.update as any).text.value).toBe('Custom Gauge Title');
  });

  it('excludes title when showTitle is false', () => {
    const customStyles = {
      ...defaultGaugeChartStyles,
      showTitle: false,
    };

    const spec = createGauge(
      mockData,
      [mockNumericalColumn],
      [],
      [],
      customStyles,
      mockAxisColumnMappings
    );

    const titleMark = spec.marks.find((m: any) => m.name === 'gaugeTitle');
    expect(titleMark).toBeUndefined();
  });

  it('uses fallback values when no axis mappings provided', () => {
    const spec = createGauge(mockData, [mockNumericalColumn], [], [], defaultGaugeChartStyles);

    expect(spec.signals.find((s) => s.name === 'mainValue')?.value).toBe(50);
  });
});
