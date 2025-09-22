/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { createLabelLayer, getDataBound, addTransform, enhanceStyle } from './heatmap_chart_utils';
import { AggregationType, VisFieldType, ColorSchemas, ScaleType, VisColumn } from '../types';
import { DEFAULTGREY } from '../theme/default_colors';
import { defaultHeatmapChartStyles, HeatmapLabels } from './heatmap_vis_config';

describe('createLabelLayer', () => {
  const xAxis: VisColumn = {
    id: 2,
    name: 'category',
    schema: VisFieldType.Categorical,
    column: 'category',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };
  const yAxis: VisColumn = {
    id: 3,
    name: 'product',
    schema: VisFieldType.Categorical,
    column: 'product',
    validValuesCount: 1,
    uniqueValuesCount: 1,
  };

  const colorField = 'value';

  it('should return null if label.show is false', () => {
    const styles = {
      ...defaultHeatmapChartStyles,
      exclusive: {
        ...defaultHeatmapChartStyles.exclusive,
        label: {
          show: false,
          overwriteColor: true,
          color: 'black',
          rotate: false,
          type: AggregationType.SUM,
        },
      },
    };
    const result = createLabelLayer(styles, true, colorField, xAxis, yAxis);
    expect(result).toBeNull();
  });

  it('should create label layer for regular heatmap (isRegular=true)', () => {
    const baseStyles = {
      ...defaultHeatmapChartStyles,
      exclusive: {
        ...defaultHeatmapChartStyles.exclusive,
        label: {
          show: true,
          overwriteColor: true,
          color: 'black',
          rotate: false,
          type: AggregationType.SUM,
        },
      },
    };

    const result = createLabelLayer(baseStyles, true, colorField, xAxis, yAxis);

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

  it('should set aggregate if label.type is defined', () => {
    const styles = {
      ...defaultHeatmapChartStyles,
      label: {
        show: true,
        type: AggregationType.SUM,
      },
      exclusive: {
        ...defaultHeatmapChartStyles.exclusive,
        label: {
          show: true,
          overwriteColor: true,
          color: 'green',
          rotate: false,
          type: AggregationType.SUM,
        },
      },
    };

    const result = createLabelLayer(styles, false, colorField, xAxis, yAxis);
    expect(result?.encoding.text).toHaveProperty('aggregate', AggregationType.SUM);
  });

  it('should not add aggregation if label.type is NONE', () => {
    const baseStyles = {
      ...defaultHeatmapChartStyles,
      exclusive: {
        ...defaultHeatmapChartStyles.exclusive,
        label: {
          show: true,
          overwriteColor: true,
          color: 'blue',
          rotate: false,
          type: AggregationType.NONE,
        },
      },
    };

    const result = createLabelLayer(baseStyles, false, colorField, xAxis, yAxis);

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
      customRanges: [],
      label: {} as HeatmapLabels,
    },
  };
  it('should return transformation steps when percentageMode is enabled', () => {
    const result = addTransform(styles, 'sales');
    expect(result).toEqual([
      {
        joinaggregate: [{ op: 'max', field: 'sales', as: 'max_value' }],
      },
      {
        calculate: `(datum.max_value === 0 ? datum["sales"] : datum["sales"] / datum.max_value)`,
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

describe('enhanceStyle', () => {
  const baseMarkLayer = {
    encoding: {
      color: {
        scale: {},
        legend: {},
      },
    },
  };

  const transformedData = [{ sales: 5 }, { sales: 10 }, { sales: 15 }];

  const colorField = 'sales';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies percentageMode settings if enabled and addLegend is true', () => {
    const styles = {
      exclusive: {
        customRanges: [],
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: false,
        maxNumberOfColors: 4,
        label: {} as HeatmapLabels,
      },
      useThresholdColor: false,
      addLegend: true,
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.domain).toEqual([0, 1]);
    expect(markLayer.encoding.color.legend.format).toBe('.0%');
  });

  it('applies scaleToDataBounds if enabled', () => {
    const styles = {
      exclusive: {
        customRanges: [],
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: true,
        maxNumberOfColors: 4,
        label: {} as HeatmapLabels,
      },
      useThresholdColor: false,
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.domain).toEqual([5, 15]);
  });

  it('applies thresholds if enabled useThresholdColor', () => {
    const styles = {
      exclusive: {
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: true,
        maxNumberOfColors: 4,
        label: {} as HeatmapLabels,
      },
      useThresholdColor: true,
      thresholdOptions: {
        baseColor: '#00BD6B',
        thresholds: [
          { value: 2, color: '#00FF00' },
          { value: 8, color: '#0000FF' },
        ],
      },
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.type).toBe('threshold');
    expect(markLayer.encoding.color.scale.domain).toEqual([0, 2, 8]);
    expect(markLayer.encoding.color.scale.range).toEqual([
      DEFAULTGREY,
      '#00BD6B',
      '#00FF00',
      '#0000FF',
    ]);
  });

  it('prefers thresholds over scaleToDataBounds when both are enabled', () => {
    const styles = {
      exclusive: {
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        maxNumberOfColors: 4,
        scaleToDataBounds: true,
        label: {} as HeatmapLabels,
      },
      useThresholdColor: true,
      thresholdOptions: {
        baseColor: '#00BD6B',
        thresholds: [
          { value: 2, color: '#00FF00' },
          { value: 8, color: '#0000FF' },
        ],
      },
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.domain).toEqual([0, 2, 8]);
    expect(markLayer.encoding.color.scale.range).toEqual([
      DEFAULTGREY,
      '#00BD6B',
      '#00FF00',
      '#0000FF',
    ]);
  });

  it('does nothing if no matching flags are set', () => {
    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, {}, transformedData, colorField);

    expect(markLayer).toEqual(baseMarkLayer);
  });
});
