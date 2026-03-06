/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPieSeries } from './pie_chart_utils';
import { PieChartStyle } from './pie_vis_config';
import { EChartsSpecState } from '../utils/echarts_spec';

describe('createPieSeries', () => {
  const mockState: EChartsSpecState = {
    data: [],
    styles: {} as PieChartStyle,
    axisColumnMappings: {},
  };

  it('creates pie series with donut style', () => {
    const styles: PieChartStyle = {
      exclusive: { donut: true, showValues: false, showLabels: false, truncate: 100 },
    } as PieChartStyle;

    const result = createPieSeries({
      styles,
      cateField: 'category',
      valueField: 'value',
    })(mockState);

    expect(result.series).toHaveLength(1);
    expect(result.series![0]).toMatchObject({
      type: 'pie',
      radius: ['50%', '70%'],
      encode: {
        itemName: 'category',
        value: 'value',
      },
    });
  });

  it('creates pie series with regular pie style', () => {
    const styles: PieChartStyle = {
      exclusive: { donut: false, showValues: false, showLabels: false, truncate: 100 },
    } as PieChartStyle;

    const result = createPieSeries({
      styles,
      cateField: 'category',
      valueField: 'value',
    })(mockState);

    expect(result.series![0]).toMatchObject({
      type: 'pie',
      radius: '70%',
    });
  });

  it('shows labels when showLabels is true', () => {
    const styles: PieChartStyle = {
      exclusive: { donut: false, showValues: false, showLabels: true, truncate: 100 },
    } as PieChartStyle;

    const result = createPieSeries({
      styles,
      cateField: 'category',
      valueField: 'value',
    })(mockState);

    expect(result.series![0].label.show).toBe(true);
  });

  it('shows values when showValues is true', () => {
    const styles: PieChartStyle = {
      exclusive: { donut: false, showValues: true, showLabels: false, truncate: 100 },
    } as PieChartStyle;

    const result = createPieSeries({
      styles,
      cateField: 'category',
      valueField: 'value',
    })(mockState);

    expect(result.series![0].label?.show).toBe(true);
    expect(typeof result.series![0].label?.formatter).toBe('function');
  });

  it('hides labels when both showValues and showLabels are false', () => {
    const styles: PieChartStyle = {
      exclusive: { donut: false, showValues: false, showLabels: false, truncate: 100 },
    } as PieChartStyle;

    const result = createPieSeries({
      styles,
      cateField: 'category',
      valueField: 'value',
    })(mockState);

    expect(result.series![0].label?.show).toBe(false);
  });

  it('applies truncate setting to labelLayout', () => {
    const styles: PieChartStyle = {
      exclusive: { donut: false, showValues: false, showLabels: true, truncate: 50 },
    } as PieChartStyle;

    const result = createPieSeries({
      styles,
      cateField: 'category',
      valueField: 'value',
    })(mockState);

    expect(result.series![0].labelLayout?.width).toBe(50);
  });
});
