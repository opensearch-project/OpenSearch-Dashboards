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
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockData = [{ value: 10 }, { value: 20 }, { value: 30 }];

  const mockAxisColumnMappings = {
    [AxisRole.Value]: mockNumericalColumn,
  };

  it('creates an ECharts gauge spec with series and dataset', () => {
    const spec = createGauge(mockData, defaultGaugeChartStyles, mockAxisColumnMappings);

    expect(spec).toHaveProperty('dataset');
    expect(spec).toHaveProperty('series');
    expect(spec).toHaveProperty('polar');
    expect(Array.isArray(spec.series)).toBe(true);
  });

  it('produces gauge-type series', () => {
    const spec = createGauge(mockData, defaultGaugeChartStyles, mockAxisColumnMappings);

    const gaugeSeries = spec.series.filter((s: any) => s.type === 'gauge');
    expect(gaugeSeries.length).toBeGreaterThanOrEqual(1);
  });

  it('throws when no value column is provided', () => {
    expect(() => createGauge(mockData, defaultGaugeChartStyles, {})).toThrow(
      'Missing value for metric chart'
    );
  });
});
