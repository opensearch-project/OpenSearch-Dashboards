/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateVegaSpec } from './vega_spec_builder';

describe('generateVegaSpec', () => {
  it('should generate a basic Vega specification', () => {
    const data = {
      xAxisFormat: { id: 'date' },
      xAxisLabel: 'Date',
      yAxisFormat: { id: 'number' },
      yAxisLabel: 'Value',
      series: [{ x: '2023-01-01', y: 10, series: 'A' }],
    };
    const visConfig = {
      dimensions: { x: [{}], y: [{}] },
      addLegend: true,
      legendPosition: 'right',
    };
    const style = { type: 'line' };

    const result = generateVegaSpec(data, visConfig, style);

    expect(result.$schema).toBe('https://vega.github.io/schema/vega/v5.json');
    expect(result.data).toBeDefined();
    expect(result.scales).toBeDefined();
    expect(result.marks).toBeDefined();
    expect(result.legends).toBeDefined();
  });

  it('should handle area charts', () => {
    const data = {
      xAxisFormat: { id: 'date' },
      xAxisLabel: 'Date',
      yAxisFormat: { id: 'number' },
      yAxisLabel: 'Value',
      series: [{ x: '2023-01-01', y: 10, series: 'A' }],
    };
    const visConfig = {
      dimensions: { x: [{}], y: [{}] },
      addLegend: true,
      legendPosition: 'right',
    };
    const style = { type: 'area' };

    const result = generateVegaSpec(data, visConfig, style);

    expect(result.data).toContainEqual(expect.objectContaining({ name: 'stacked' }));
    expect(result.marks[0].type).toBe('group');
  });

  it('should add legend when specified', () => {
    const data = {
      xAxisFormat: { id: 'date' },
      xAxisLabel: 'Date',
      yAxisFormat: { id: 'number' },
      yAxisLabel: 'Value',
      series: [{ x: '2023-01-01', y: 10, series: 'A' }],
    };
    const visConfig = {
      dimensions: { x: [{}], y: [{}] },
      addLegend: true,
      legendPosition: 'right',
    };
    const style = { type: 'line' };

    const result = generateVegaSpec(data, visConfig, style);

    expect(result.legends).toBeDefined();
    expect(result.legends![0].orient).toBe('right');
  });

  it('should not add legend when not specified', () => {
    const data = {
      xAxisFormat: { id: 'date' },
      xAxisLabel: 'Date',
      yAxisFormat: { id: 'number' },
      yAxisLabel: 'Value',
      series: [{ x: '2023-01-01', y: 10, series: 'A' }],
    };
    const visConfig = {
      dimensions: { x: [{}], y: [{}] },
      addLegend: false,
      legendPosition: 'right',
    };
    const style = { type: 'line' };

    const result = generateVegaSpec(data, visConfig, style);

    expect(result.legends).toBeUndefined();
  });
});
