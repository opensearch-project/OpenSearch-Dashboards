/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateVegaSpecForSeries } from './vega_spec_series_builder';

describe('generateVegaSpecForSeries', () => {
  const baseData = {
    xAxisFormat: { id: 'date' },
    xAxisLabel: 'Date',
    yAxisFormat: { id: 'number' },
    yAxisLabel: 'Value',
    series: [{ x: '2023-01-01', y: 10, series: 'A' }],
  };

  const baseVisConfig = {
    dimensions: {
      x: { format: { id: 'date' } },
      y: [{ format: { id: 'number' } }],
    },
    addLegend: true,
    legendPosition: 'right',
  };

  it('should generate a basic Vega specification', () => {
    const style = { type: 'line' };

    const result = generateVegaSpecForSeries(baseData, baseVisConfig, style);

    expect(result.$schema).toBe('https://vega.github.io/schema/vega/v5.json');
    expect(result.data).toBeDefined();
    expect(result.scales).toBeDefined();
    expect(result.marks).toBeDefined();
    expect(result.legends).toBeDefined();
  });

  it('should handle area charts', () => {
    const style = { type: 'area' };

    const result = generateVegaSpecForSeries(baseData, baseVisConfig, style);

    expect(result.data).toBeDefined();
    expect(result.data?.some((d) => d.name === 'stacked')).toBe(true);
    expect(result.marks?.[0]?.type).toBe('group');
  });

  it('should add legend when specified', () => {
    const style = { type: 'line' };

    const result = generateVegaSpecForSeries(baseData, baseVisConfig, style);

    expect(result.legends).toBeDefined();
    expect(result.legends?.[0]?.orient).toBe('right');
  });

  it('should not add legend when not specified', () => {
    const visConfigNoLegend = {
      ...baseVisConfig,
      addLegend: false,
    };
    const style = { type: 'line' };

    const result = generateVegaSpecForSeries(baseData, visConfigNoLegend, style);

    expect(result.legends).toBeUndefined();
  });
});
