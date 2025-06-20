/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createlabelLayer, getDataBound, addTransform } from './heatmap_chart_utils';
import { LabelAggregationType, VisFieldType, ColorSchemas, ScaleType } from '../types';

import { defaultHeatmapChartStyles } from './heatmap_vis_config';

describe('createlabelLayer', () => {
  const xAxis = { id: 2, name: 'category', schema: VisFieldType.Categorical, column: 'category' };
  const yAxis = { id: 3, name: 'product', schema: VisFieldType.Categorical, column: 'product' };

  const colorField = 'value';

  it('should return null if label.show is false', () => {
    const styles = {
      ...defaultHeatmapChartStyles,
      label: {
        show: false,
        overwriteColor: true,
        color: 'black',
        rotate: false,
        type: LabelAggregationType.SUM,
      },
    };
    const result = createlabelLayer(styles, true, colorField, xAxis, yAxis);
    expect(result).toBeNull();
  });

  it('should create label layer for regular heatmap (isRegular=true)', () => {
    const baseStyles = {
      ...defaultHeatmapChartStyles,
      label: {
        show: true,
        overwriteColor: true,
        color: 'black',
        rotate: false,
        type: LabelAggregationType.SUM,
      },
    };

    const result = createlabelLayer(baseStyles, true, colorField, xAxis, yAxis);

    expect(result).toEqual({
      mark: {
        type: 'text',
        color: 'black',
      },
      encoding: {
        x: {
          field: 'category',
          type: 'nominal',
          bin: false,
        },
        y: {
          field: 'product',
          type: 'nominal',
          bin: false,
        },
        text: {
          field: 'value',
          format: '.1f',
        },
        angle: { value: 0 },
      },
    });
  });

  it('should not add aggregation if label.type is NONE', () => {
    const baseStyles = {
      ...defaultHeatmapChartStyles,
      label: {
        show: true,
        overwriteColor: true,
        color: 'blue',
        rotate: false,
        type: LabelAggregationType.NONE,
      },
    };

    const result = createlabelLayer(baseStyles, false, colorField, xAxis, yAxis);

    expect(result?.encoding.text).not.toHaveProperty('aggregate');
    expect(result?.encoding.text).toEqual({
      field: 'value',
      format: '.1f',
    });
  });
});

describe('getDataBound', () => {
  it('should return min and max of numeric values', () => {
    const data = [
      { field1: 1, field2: 3, field3: 2 },
      { field1: 10, field2: 3, field3: 2 },
    ];
    expect(getDataBound(data, 'field1')).toEqual([1, 10]);
  });
});

describe('addTransform', () => {
  const styles = {
    exclusive: {
      percentageMode: true,
      colorSchema: ColorSchemas.BLUES,
      reverseSchema: false,
      colorScaleType: ScaleType.LINEAR,
      scaleToDataBounds: false,
      maxNumberOfColors: 4,
      useCustomRanges: false,
      customRanges: [],
    },
  };
  it('should return transformation steps when percentageMode is enabled', () => {
    const result = addTransform(styles, 'sales');
    expect(result).toEqual([
      {
        joinaggregate: [{ op: 'max', field: 'sales', as: 'max_value' }],
      },
      {
        calculate: `(datum["sales"] / datum.max_value)`,
        as: 'sales',
      },
    ]);
  });

  it('should return empty array when percentageMode is false', () => {
    const result = addTransform(
      {
        exclusive: {
          ...styles.exclusive,
          percentageMode: false,
        },
      },
      'sales'
    );

    expect(result).toEqual([]);
  });
});
