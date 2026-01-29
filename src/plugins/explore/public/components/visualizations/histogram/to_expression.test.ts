/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createNumericalHistogramChart, createSingleHistogramChart } from './to_expression';

import { defaultHistogramChartStyles } from './histogram_vis_config';
import { VisColumn, VisFieldType, VEGASCHEMA, AxisRole, AggregationType } from '../types';

jest.mock('../utils/utils', () => {
  const actual = jest.requireActual('../utils/utils');
  return {
    ...actual,
    getChartRender: jest.fn().mockReturnValue('vega'),
  };
});

const mockNumericalColumn: VisColumn = {
  id: 1,
  name: 'Count',
  column: 'count',
  schema: VisFieldType.Numerical,
  validValuesCount: 100,
  uniqueValuesCount: 50,
};

// Sample data for testing
const mockData = [
  { count: 10, category: 'A', category2: 'X', date: '2023-01-01' },
  { count: 20, category: 'B', category2: 'Y', date: '2023-01-02' },
  { count: 30, category: 'C', category2: 'Z', date: '2023-01-03' },
];

describe('createSingleHistogramChart', () => {
  const mockAxisColumnMappings = {
    [AxisRole.X]: mockNumericalColumn,
  };

  test('creates a single histogram bar chart spec', () => {
    const spec = createSingleHistogramChart(
      mockData,
      [mockNumericalColumn],
      defaultHistogramChartStyles,
      mockAxisColumnMappings
    );

    expect(spec.$schema).toBe(VEGASCHEMA);
    expect(spec.data.values).toBe(mockData);
    expect(spec.layer).toHaveLength(1);

    // Check encoding
    const mainLayer = spec.layer[0];
    expect(mainLayer.mark.type).toBe('bar');
    expect(mainLayer.mark.tooltip).toBe(true);
    expect(mainLayer.encoding.x.field).toBe('count');
    expect(mainLayer.encoding.y.field).toBe(undefined);
  });

  test('handles different title display options', () => {
    // Case 1: No title (show = false)
    const noTitleStyles = {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: false,
        titleName: '',
      },
    };

    const spec = createSingleHistogramChart(
      mockData,
      [mockNumericalColumn],
      noTitleStyles,
      mockAxisColumnMappings
    );

    expect(spec.title).toBeUndefined();

    // Case 2: Default title (show = true, titleName = '')
    const defaultTitleStyles = {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    };

    const defaultTitleResult = createSingleHistogramChart(
      mockData,
      [mockNumericalColumn],
      defaultTitleStyles,
      mockAxisColumnMappings
    );

    expect(defaultTitleResult.title).toBe('Record counts of Count');

    // Case 3: Custom title (show = true, titleName = 'Custom Title')
    const customTitleStyles = {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: true,
        titleName: 'Custom Bar Chart Title',
      },
    };

    const customTitleResult = createSingleHistogramChart(
      mockData,
      [mockNumericalColumn],
      customTitleStyles,
      mockAxisColumnMappings
    );

    expect(customTitleResult.title).toBe('Custom Bar Chart Title');
  });

  test('creates a numerical histogram bar chart spec', () => {
    const spec = createSingleHistogramChart(
      mockData,
      [mockNumericalColumn],
      defaultHistogramChartStyles,
      mockAxisColumnMappings
    );

    expect(spec.$schema).toBe(VEGASCHEMA);
    expect(spec.data.values).toBe(mockData);
    expect(spec.layer).toHaveLength(1);

    const mainLayer = spec.layer[0];
    expect(mainLayer.mark.type).toBe('bar');
    expect(mainLayer.mark.tooltip).toBe(true);
    expect(mainLayer.encoding.x.field).toBe('count');
    expect(mainLayer.encoding.x.type).toBe('quantitative');
    expect(spec.layer[0].encoding.y.aggregate).toBe('count');

    // select time range params
    expect(spec.params).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
    );
    expect(mainLayer.params).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
    );
  });

  test('applies bucket options correctly, single bar aggregation should only be count', () => {
    const stylesWithBucket = {
      ...defaultHistogramChartStyles,
      bucket: {
        bucketSize: 50,
        aggregationType: AggregationType.SUM,
      },
    };

    const spec = createSingleHistogramChart(
      mockData,
      [mockNumericalColumn],
      stylesWithBucket,
      mockAxisColumnMappings
    );

    expect(spec.layer[0].encoding.x.bin.step).toBe(50);
    expect(spec.layer[0].encoding.y.aggregate).toBe('count');
  });
});

describe('createNumericalHistogramChart', () => {
  const mockNumericalColumn2 = {
    id: 2,
    name: 'sum',
    column: 'sum',
    schema: VisFieldType.Numerical,
    validValuesCount: 100,
    uniqueValuesCount: 50,
  };

  const mockAxisColumnMappings = {
    [AxisRole.X]: mockNumericalColumn,
    [AxisRole.Y]: mockNumericalColumn2,
  };
  test('creates a numerical histogram bar chart spec', () => {
    const spec = createNumericalHistogramChart(
      mockData,
      [mockNumericalColumn, mockNumericalColumn2],
      defaultHistogramChartStyles,
      mockAxisColumnMappings
    );

    expect(spec.$schema).toBe(VEGASCHEMA);
    expect(spec.data.values).toBe(mockData);
    expect(spec.layer).toHaveLength(1);

    const mainLayer = spec.layer[0];
    expect(mainLayer.mark.type).toBe('bar');
    expect(mainLayer.mark.tooltip).toBe(true);
    expect(mainLayer.encoding.x.field).toBe('count');
    expect(mainLayer.encoding.x.type).toBe('quantitative');
    expect(mainLayer.encoding.y.field).toBe('sum');
    expect(mainLayer.encoding.y.aggregate).toBe('sum');
    expect(mainLayer.encoding.y.type).toBe('quantitative');

    // select time range params
    expect(spec.params).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'applyTimeFilter' })])
    );
    expect(mainLayer.params).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'timeRangeBrush' })])
    );
  });

  test('handles different title display options', () => {
    // Case 1: No title (show = false)
    const noTitleStyles = {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: false,
        titleName: '',
      },
    };

    const spec = createNumericalHistogramChart(
      mockData,
      [mockNumericalColumn, mockNumericalColumn2],
      noTitleStyles,
      mockAxisColumnMappings
    );

    expect(spec.title).toBeUndefined();

    // Case 2: Default title (show = true, titleName = '')
    const defaultTitleStyles = {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: true,
        titleName: '',
      },
    };

    const defaultTitleResult = createNumericalHistogramChart(
      mockData,
      [mockNumericalColumn, mockNumericalColumn2],
      defaultTitleStyles,
      mockAxisColumnMappings
    );

    expect(defaultTitleResult.title).toBe('Count with sum');

    // Case 3: Custom title (show = true, titleName = 'Custom Title')
    const customTitleStyles = {
      ...defaultHistogramChartStyles,
      titleOptions: {
        show: true,
        titleName: 'Custom Bar Chart Title',
      },
    };

    const customTitleResult = createNumericalHistogramChart(
      mockData,
      [mockNumericalColumn, mockNumericalColumn2],
      customTitleStyles,
      mockAxisColumnMappings
    );

    expect(customTitleResult.title).toBe('Custom Bar Chart Title');
  });

  test('applies bucket options correctly', () => {
    const stylesWithBucket = {
      ...defaultHistogramChartStyles,
      bucket: {
        bucketSize: 50,
        aggregationType: AggregationType.SUM,
      },
    };

    const spec = createNumericalHistogramChart(
      mockData,
      [mockNumericalColumn, mockNumericalColumn2],
      stylesWithBucket,
      mockAxisColumnMappings
    );

    expect(spec.layer[0].encoding.x.bin.step).toBe(50);
    expect(spec.layer[0].encoding.y.aggregate).toBe('sum');
  });
});
