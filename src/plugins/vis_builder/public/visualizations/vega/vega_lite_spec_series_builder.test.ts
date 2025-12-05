/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateVegaLiteSpecForSeries } from './vega_lite_spec_series_builder';

describe('generateVegaLiteSpecForSeries', () => {
  it('should generate a basic Vega-Lite specification', () => {
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
      addTooltip: true,
    };
    const style = { type: 'line' };

    const result = generateVegaLiteSpecForSeries(data, visConfig, style);

    expect(result.$schema).toBe('https://vega.github.io/schema/vega-lite/v5.json');
    expect(result.data).toBeDefined();
    expect(result.mark).toBeDefined();
    expect(result.encoding).toBeDefined();
  });

  it('should handle different chart types', () => {
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
      addTooltip: true,
    };

    const lineResult = generateVegaLiteSpecForSeries(data, visConfig, { type: 'line' });
    expect(lineResult.mark).toEqual({ type: 'line', point: true, tooltip: true });

    const areaResult = generateVegaLiteSpecForSeries(data, visConfig, { type: 'area' });
    expect(areaResult.mark).toEqual({
      type: 'area',
      line: true,
      opacity: 1,
      tooltip: true,
      fillOpacity: 1,
      baseline: 0,
    });

    const barResult = generateVegaLiteSpecForSeries(data, visConfig, { type: 'bar' });
    expect(barResult.mark).toEqual({ type: 'bar', tooltip: true });
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
      addTooltip: true,
    };
    const style = { type: 'line' };

    const result = generateVegaLiteSpecForSeries(data, visConfig, style);

    expect(result.config).toBeDefined();
    expect(result.config!.legend).toBeDefined();
    expect(result.config!.legend!.orient).toBe('right');
  });

  it('should add tooltip when specified', () => {
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
      addTooltip: true,
    };
    const style = { type: 'line' };

    const result = generateVegaLiteSpecForSeries(data, visConfig, style);

    expect(result.encoding!.tooltip).toBeDefined();
    expect(result.mark).toHaveProperty('tooltip', true);
  });
});
