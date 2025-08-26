/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  createLabelLayer,
  getDataBound,
  addTransform,
  setRange,
  enhanceStyle,
} from './heatmap_chart_utils';
import * as utils from './heatmap_chart_utils';
import { AggregationType, VisFieldType, ColorSchemas, ScaleType, VisColumn } from '../types';

import { defaultHeatmapChartStyles, HeatmapLabels } from './heatmap_vis_config';
import * as colorUtil from '../utils/utils';

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
      useCustomRanges: false,
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

describe('setRange', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns correct range of colors based on customRanges and schema', () => {
    const mockColors = ['#111', '#222', '#333'];
    jest.spyOn(colorUtil, 'generateColorBySchema').mockReturnValue(mockColors);

    const styles = {
      exclusive: {
        customRanges: [
          { min: 1, max: 5 },
          { min: 6, max: 10 },
        ],
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: false,
        maxNumberOfColors: 4,
        useCustomRanges: true,
        label: {} as HeatmapLabels,
      },
    };

    const result = setRange(styles);
    expect(colorUtil.generateColorBySchema).toHaveBeenCalledWith(3, ColorSchemas.GREENS);
    expect(result).toEqual(mockColors);
  });

  it('returns one color if no customRanges are defined but user turns on useCustomRanges', () => {
    const styles = {
      exclusive: {
        customRanges: [],
        useCustomRanges: true,
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: false,
        maxNumberOfColors: 4,
        label: {} as HeatmapLabels,
      },
    };

    const result = setRange(styles);
    expect(result).toEqual(['#ccffcc']);
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
        useCustomRanges: true,
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: false,
        maxNumberOfColors: 4,
        label: {} as HeatmapLabels,
      },
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
        useCustomRanges: true,
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: true,
        maxNumberOfColors: 4,
        label: {} as HeatmapLabels,
      },
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.domain).toEqual([5, 15]);
  });

  it('applies customRanges if enabled and sets correct scale and range', () => {
    const mockRange = ['#ccffcc', '#669966', '#003300'];
    jest.spyOn(utils, 'setRange').mockReturnValue(mockRange);

    const styles = {
      exclusive: {
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        scaleToDataBounds: true,
        maxNumberOfColors: 4,
        useCustomRanges: true,
        label: {} as HeatmapLabels,
        customRanges: [
          { min: 0, max: 5 },
          { min: 6, max: 10 },
        ],
      },
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.type).toBe('quantize');
    expect(markLayer.encoding.color.scale.domain).toEqual([0, 10]);
    expect(markLayer.encoding.color.scale.range).toEqual(mockRange);
  });

  it('prefers customRanges over scaleToDataBounds when both are enabled', () => {
    const mockRange = ['#ccffcc', '#003300'];
    jest.spyOn(utils, 'setRange').mockReturnValue(mockRange);

    const styles = {
      exclusive: {
        colorSchema: ColorSchemas.GREENS,
        percentageMode: true,
        reverseSchema: false,
        colorScaleType: ScaleType.LINEAR,
        maxNumberOfColors: 4,
        useCustomRanges: true,
        customRanges: [{ min: 2, max: 8 }],
        scaleToDataBounds: true,
        label: {} as HeatmapLabels,
      },
    };

    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, styles, transformedData, colorField);

    expect(markLayer.encoding.color.scale.domain).toEqual([2, 8]);
    expect(markLayer.encoding.color.scale.range).toEqual(mockRange);
  });

  it('does nothing if no matching flags are set', () => {
    const markLayer = JSON.parse(JSON.stringify(baseMarkLayer));
    enhanceStyle(markLayer, {}, transformedData, colorField);

    expect(markLayer).toEqual(baseMarkLayer);
  });
});
