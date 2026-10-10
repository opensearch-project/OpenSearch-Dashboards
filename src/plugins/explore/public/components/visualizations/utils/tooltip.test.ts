/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createTooltipValueFormatter,
  formatTimeLabel,
  getTooltipAxesMappingEncode,
  heatmapTooltipFormatter,
  pieDisplayNameTooltipFormatter,
  renderTooltipContent,
  resolveDisplayName,
  seriesDisplayNameTooltipFormatter,
  stateTimelineTooltipFormatter,
} from './tooltip';
import { AxisRole, VisColumn, VisFieldType } from '../types';

describe('tooltip utils', () => {
  const xValueColumn: VisColumn = {
    id: 1,
    name: 'Count',
    column: 'count',
    schema: VisFieldType.Numerical,
  };

  const yCategoryColumn: VisColumn = {
    id: 2,
    name: 'Category',
    column: 'category',
    schema: VisFieldType.Categorical,
  };

  const xCategoryColumn: VisColumn = {
    id: 3,
    name: 'Date',
    column: 'date',
    schema: VisFieldType.Date,
  };

  const yValueColumn: VisColumn = {
    id: 4,
    name: 'Average',
    column: 'average',
    schema: VisFieldType.Numerical,
  };

  it('uses y as category and x as value when x is numerical and y is categorical', () => {
    expect(
      getTooltipAxesMappingEncode({
        [AxisRole.X]: xValueColumn,
        [AxisRole.Y]: yCategoryColumn,
      })
    ).toEqual({
      categoryEncode: 'y',
      valueEncode: 'x',
    });
  });

  it('uses x as category and y as value when x is category-like and y is numerical', () => {
    expect(
      getTooltipAxesMappingEncode({
        [AxisRole.X]: xCategoryColumn,
        [AxisRole.Y]: yValueColumn,
      })
    ).toEqual({
      categoryEncode: 'x',
      valueEncode: 'y',
    });
  });

  it('keeps array-axis mappings for horizontal multi-metric charts', () => {
    expect(
      getTooltipAxesMappingEncode({
        [AxisRole.X]: [xValueColumn, yValueColumn],
        [AxisRole.Y]: yCategoryColumn,
      })
    ).toEqual({
      categoryEncode: 'y',
      valueEncode: 'x',
    });
  });

  it('keeps array-axis mappings for vertical multi-metric charts', () => {
    expect(
      getTooltipAxesMappingEncode({
        [AxisRole.X]: xCategoryColumn,
        [AxisRole.Y]: [xValueColumn, yValueColumn],
      })
    ).toEqual({
      categoryEncode: 'x',
      valueEncode: 'y',
    });
  });

  it('escapes tooltip content', () => {
    const html = renderTooltipContent({
      title: '<script>alert(1)</script>',
      rows: [
        {
          label: '<b>label</b>',
          value: '<img src=x onerror=alert(1)>',
        },
      ],
    });

    expect(html).toContain('&lt;b&gt;label&lt;/b&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });

  it('formats percentage values through the shared value formatter', () => {
    const formatValue = createTooltipValueFormatter({
      styles: {
        stackMode: 'percentage',
        decimals: 1,
      } as any,
    });

    expect(formatValue(0.123)).toBe('12.3%');
  });

  it('formats horizontal value-category params with the category as title', () => {
    const formatter = seriesDisplayNameTooltipFormatter({
      styles: {} as any,
      axesMappingEncode: getTooltipAxesMappingEncode({
        [AxisRole.X]: xValueColumn,
        [AxisRole.Y]: yCategoryColumn,
      }),
      formatValue: (value) => String(value),
      getDisplayName: resolveDisplayName(),
      renderTooltipContent,
    });

    const html = formatter({
      encode: {
        x: [0],
        y: [1],
      },
      value: [42, 'A'],
      seriesName: 'Count',
    });

    expect(html).toContain('A');
    expect(html).toContain('42');
  });

  it('formats Date objects as compact local time labels', () => {
    expect(formatTimeLabel(new Date(2026, 7, 10, 7, 0, 0))).toBe('2026-08-10 07:00:00');
    expect(formatTimeLabel('A')).toBe('A');
  });

  it('formats Date category labels before rendering series tooltip title', () => {
    const formatter = seriesDisplayNameTooltipFormatter({
      styles: {} as any,
      axesMappingEncode: {
        categoryEncode: 'x',
        valueEncode: 'y',
      },
      formatValue: (value) => String(value),
      getDisplayName: resolveDisplayName(),
      renderTooltipContent,
    });

    const html = formatter({
      encode: {
        x: [0],
        y: [1],
      },
      value: [new Date(2026, 7, 10, 7, 0, 0), 42],
      seriesName: 'Count',
    });

    expect(html).toContain('2026-08-10 07:00:00');
    expect(html).not.toContain('GMT');
  });

  it('formats pie tooltip with display names and formatted values', () => {
    const formatter = pieDisplayNameTooltipFormatter({
      styles: {} as any,
      formatValue: (value) => `${value} ms`,
      getDisplayName: resolveDisplayName({ A: 'Alpha' }),
      renderTooltipContent,
    });

    const html = formatter({
      marker: '<span></span>',
      name: 'A',
      value: 100,
    });

    expect(html).toContain('Alpha');
    expect(html).toContain('100 ms');
  });

  it('formats heatmap tooltip rows from encoded dimensions', () => {
    const formatter = heatmapTooltipFormatter({
      styles: {} as any,
      formatValue: (value) => String(value),
      getDisplayName: resolveDisplayName(),
      renderTooltipContent,
    });

    const html = formatter({
      marker: '<span></span>',
      dimensionNames: ['origin', 'destination', 'delay'],
      encode: {
        x: [0],
        y: [1],
        value: [2],
      },
      value: ['SFO', 'SEA', 12],
    });

    expect(html).toContain('origin');
    expect(html).toContain('SFO');
    expect(html).toContain('destination');
    expect(html).toContain('SEA');
    expect(html).toContain('delay');
    expect(html).toContain('12');
  });

  it('formats grouped state timeline tooltip rows', () => {
    const formatter = stateTimelineTooltipFormatter({ groupField: 'service' })({
      styles: {} as any,
      formatValue: (value) => String(value),
      getDisplayName: resolveDisplayName({ svc_a: 'Service A' }),
      renderTooltipContent,
    });

    const html = formatter({
      marker: '<span></span>',
      seriesName: 'Running',
      dimensionNames: ['service', 'start', 'end', 'duration', 'mergedCount'],
      value: ['svc_a', '2026-08-10T00:00:00Z', '2026-08-10T01:00:00Z', '1h', 3],
    });

    expect(html).toContain('Service A');
    expect(html).toContain('Running');
    expect(html).toContain('duration');
    expect(html).toContain('1h');
    expect(html).toContain('count');
    expect(html).toContain('3');
  });
});
