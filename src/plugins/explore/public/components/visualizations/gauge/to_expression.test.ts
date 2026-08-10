/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGauge } from './to_expression';
import { VisColumn, VisFieldType, AxisRole } from '../types';
import { defaultGaugeChartStyles } from './gauge_vis_config';

describe('createGauge', () => {
  const mockNumericalColumn: VisColumn = {
    id: 1,
    name: 'value',
    column: 'value',
    schema: VisFieldType.Numerical,
  };

  const mockData = [{ value: 10 }, { value: 20 }, { value: 30 }];

  const mockAxisColumnMappings = {
    [AxisRole.Value]: mockNumericalColumn,
  };

  it('creates an ECharts gauge spec with series and dataset', () => {
    const gauge = createGauge(mockData, defaultGaugeChartStyles, mockAxisColumnMappings);

    expect(gauge.spec).toHaveProperty('dataset');
    expect(gauge.spec).toHaveProperty('series');
    expect(gauge.text).toMatchObject({
      value: '30',
      title: {
        valueFieldName: 'value',
      },
    });
    expect(Array.isArray(gauge.spec.series)).toBe(true);
  });

  it('produces arc-only gauge-type series', () => {
    const gauge = createGauge(mockData, defaultGaugeChartStyles, mockAxisColumnMappings);

    const gaugeSeries = (gauge.spec.series as any[]).filter((s: any) => s.type === 'gauge');
    const customSeries = (gauge.spec.series as any[]).filter((s: any) => s.type === 'custom');
    expect(gaugeSeries).toHaveLength(2);
    expect(customSeries).toHaveLength(0);
  });

  it('adds internal padding around gauge arcs', () => {
    const gauge = createGauge(mockData, defaultGaugeChartStyles, mockAxisColumnMappings);

    const gaugeSeries = (gauge.spec.series as any[]).filter((s: any) => s.type === 'gauge');
    expect(gaugeSeries.every((series: any) => series.radius === '92%')).toBe(true);
  });

  it('renders zero as a valid value', () => {
    const gauge = createGauge([{ value: 0 }], defaultGaugeChartStyles, mockAxisColumnMappings);

    expect(gauge.text).toMatchObject({
      value: '0',
    });
  });

  it('splits formatted units from value text when unit formatter provides segments', () => {
    const gauge = createGauge(
      mockData,
      { ...defaultGaugeChartStyles, unitId: 'millisecond' },
      mockAxisColumnMappings
    );

    expect(gauge.text).toMatchObject({
      value: '30',
      unit: 'milliseconds',
      unitFirst: false,
    });
  });

  it('supports prefix units', () => {
    const gauge = createGauge(
      mockData,
      { ...defaultGaugeChartStyles, unitId: 'dollars' },
      mockAxisColumnMappings
    );

    expect(gauge.text).toMatchObject({
      value: '30',
      unit: '$',
      unitFirst: true,
    });
  });

  it('keeps custom title separate from auto title for renderer-level title composition', () => {
    const gauge = createGauge(
      mockData,
      { ...defaultGaugeChartStyles, title: 'Custom title' },
      mockAxisColumnMappings
    );

    expect(gauge.text).toMatchObject({
      title: {
        valueFieldName: 'value',
        customTitle: 'Custom title',
      },
    });
  });

  it('omits title render data when show title is disabled', () => {
    const gauge = createGauge(
      mockData,
      { ...defaultGaugeChartStyles, showTitle: false },
      mockAxisColumnMappings
    );

    expect(gauge.text).not.toHaveProperty('title');
  });

  it('throws when no value column is provided', () => {
    expect(() => createGauge(mockData, defaultGaugeChartStyles, {} as any)).toThrow();
  });
});
