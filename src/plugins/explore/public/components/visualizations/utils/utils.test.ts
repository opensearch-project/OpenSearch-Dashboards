/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  applyAxisStyling,
  getAxisByRole,
  generateColorBySchema,
  swapAxes,
  getSwappedAxisRole,
  getSchemaByAxis,
  inferTimeUnitFromTimestamps,
  getTooltipFormat,
  calculateValue,
} from './utils';
import { AxisRole, Positions, ColorSchemas, VisFieldType, StandardAxes } from '../types';

describe('applyAxisStyling', () => {
  const defaultAxis = {
    id: 1,
    name: 'X Value',
    schema: VisFieldType.Numerical,
    column: 'x',
    validValuesCount: 6,
    uniqueValuesCount: 6,
  };

  const defaultAxisStyle = {
    id: 'Axis-1',
    position: Positions.LEFT,
    show: true,
    style: {},
    labels: {
      show: true,
      rotate: 45,
      filter: false,
      truncate: 10,
    },
    title: {
      text: 'Custom Title',
    },
    grid: {
      showLines: true,
    },
    axisRole: AxisRole.X,
  };

  it('returns default config with title and labels when style is provided', () => {
    const config = applyAxisStyling(defaultAxis, defaultAxisStyle);
    expect(config.grid).toBe(true);
    expect(config.orient).toBe(Positions.LEFT);
    expect(config.title).toBe('Custom Title');
    expect(config.labelAngle).toBe(45);
    expect(config.labelLimit).toBe(10);
    expect(config.labelOverlap).toBe('greedy');
  });

  it('disables axis when show is false', () => {
    const config = applyAxisStyling(defaultAxis, { ...defaultAxisStyle, show: false });
    expect(config.title).toBeNull();
    expect(config.labels).toBe(false);
    expect(config.ticks).toBe(false);
    expect(config.domain).toBe(false);
  });
});

describe('getAxisByRole', () => {
  it('returns the axis with specified role', () => {
    const axes = [{ axisRole: AxisRole.X }, { axisRole: AxisRole.Y }];
    expect(getAxisByRole(axes as any, AxisRole.X)?.axisRole).toBe(AxisRole.X);
  });

  it('returns undefined when no axis matches', () => {
    const axes = [{ axisRole: AxisRole.Y }];
    expect(getAxisByRole(axes as any, AxisRole.X)).toBeUndefined();
  });
});

describe('generateColorBySchema', () => {
  it('generates correct number of colors', () => {
    const colors = generateColorBySchema(3, ColorSchemas.BLUES);
    expect(colors).toHaveLength(3);
    expect(colors[0]).toMatch(/^#/);
  });

  it('returns empty array for unknown schema', () => {
    const colors = generateColorBySchema(3, 'UNKNOWN' as any);
    expect(colors).toEqual([]);
  });
});

describe('swapAxes', () => {
  it('correctly swaps X and Y axes and their positions', () => {
    const axes = [
      { axisRole: AxisRole.X, position: Positions.BOTTOM },
      { axisRole: AxisRole.Y, position: Positions.LEFT },
    ];

    const swapped = swapAxes(axes as any);
    expect(swapped[0].axisRole).toBe(AxisRole.Y);
    expect(swapped[0].position).toBe(Positions.LEFT);
    expect(swapped[1].axisRole).toBe(AxisRole.X);
    expect(swapped[1].position).toBe(Positions.BOTTOM);
  });
});

describe('getSwappedAxisRole', () => {
  it('returns undefined when axes are missing', () => {
    const { xAxis, yAxis } = getSwappedAxisRole({}, {});
    expect(xAxis).toBeUndefined();
    expect(yAxis).toBeUndefined();
  });

  it('returns swapped roles if switchAxes is true', () => {
    const { xAxis, yAxis } = getSwappedAxisRole(
      {
        standardAxes: [
          { axisRole: AxisRole.X, position: Positions.BOTTOM } as StandardAxes,
          { axisRole: AxisRole.Y, position: Positions.LEFT } as StandardAxes,
        ],
        switchAxes: true,
      },
      {
        x: {
          id: 1,
          name: 'X Value',
          schema: VisFieldType.Categorical,
          column: 'x',
          validValuesCount: 6,
          uniqueValuesCount: 6,
        },
        y: {
          id: 2,
          name: 'Y Value',
          schema: VisFieldType.Numerical,
          column: 'y',
          validValuesCount: 6,
          uniqueValuesCount: 6,
        },
      }
    );

    expect(xAxis?.schema).toBe(VisFieldType.Numerical);
    expect(yAxis?.schema).toBe(VisFieldType.Categorical);
  });
});

describe('getSchemaByAxis', () => {
  const baseAxis = {
    id: 1,
    name: 'Test Axis',
    column: 'test',
    validValuesCount: 10,
    uniqueValuesCount: 10,
  };

  it('returns quantitative for Numerical schema', () => {
    const axis = { ...baseAxis, schema: VisFieldType.Numerical };
    expect(getSchemaByAxis(axis)).toBe('quantitative');
  });

  it('returns nominal for Categorical schema', () => {
    const axis = { ...baseAxis, schema: VisFieldType.Categorical };
    expect(getSchemaByAxis(axis)).toBe('nominal');
  });

  it('returns temporal for Date schema', () => {
    const axis = { ...baseAxis, schema: VisFieldType.Date };
    expect(getSchemaByAxis(axis)).toBe('temporal');
  });

  it('returns unknown for undefined or invalid schema', () => {
    expect(getSchemaByAxis(undefined)).toBe('unknown');
    const axis = { ...baseAxis, schema: 'invalid' as any };
    expect(getSchemaByAxis(axis)).toBe('unknown');
  });
});

describe('inferTimeUnitFromTimestamps', () => {
  const field = 'timestamp';

  it('returns null for undefined data', () => {
    expect(inferTimeUnitFromTimestamps(undefined as any, field)).toBeNull();
  });

  it('returns null for empty data array', () => {
    expect(inferTimeUnitFromTimestamps([], field)).toBeNull();
  });

  it('returns null for empty field', () => {
    const data = [{ timestamp: '2023-01-01' }];
    expect(inferTimeUnitFromTimestamps(data, '')).toBeNull();
  });

  it('returns null for less than 2 valid timestamps', () => {
    const data = [{ timestamp: '2023-01-01' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBeNull();
  });

  it('returns null for all invalid timestamps', () => {
    const data = [{ timestamp: 'invalid' }, { timestamp: 'invalid' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBeNull();
  });

  it('returns second for differences less than 60 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-01T00:00:30' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('second');
  });

  it('returns minute for differences less than 3600 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-01T00:01:00' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('minute');
  });

  it('returns hour for differences less than 86400 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-01T01:00:00' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('hour');
  });

  it('returns day for differences less than 604800 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-02T00:00:00' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('day');
  });

  it('returns week for differences less than 2678400 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-08T00:00:00' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('week');
  });

  it('returns month for differences less than 31536000 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-02-01T00:00:00' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('month');
  });

  it('returns year for differences greater than or equal to 31536000 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2024-01-01T00:00:00' }];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('year');
  });

  it('handles invalid timestamps with some valid ones', () => {
    const data = [
      { timestamp: 'invalid' },
      { timestamp: '2023-01-01T00:00:00' },
      { timestamp: '2023-01-01T00:00:30' },
    ];
    expect(inferTimeUnitFromTimestamps(data, field)).toBe('second');
  });
});

describe('getTooltipFormat', () => {
  const field = 'timestamp';
  const defaultFallback = '%b %d, %Y %H:%M:%S';

  it('returns fallback format when field is empty', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }];
    expect(getTooltipFormat(data, '', defaultFallback)).toBe(defaultFallback);
  });

  it('returns fallback format when data is undefined', () => {
    expect(getTooltipFormat(undefined as any, field, defaultFallback)).toBe(defaultFallback);
  });

  it('returns fallback format when data is empty', () => {
    expect(getTooltipFormat([], field, defaultFallback)).toBe(defaultFallback);
  });

  it('returns fallback format for less than 2 valid timestamps', () => {
    const data = [{ timestamp: '2023-01-01' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe(defaultFallback);
  });

  it('returns fallback format for all invalid timestamps', () => {
    const data = [{ timestamp: 'invalid' }, { timestamp: 'invalid' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe(defaultFallback);
  });

  it('returns second format for differences less than 60 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-01T00:00:30' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%b %d, %Y %H:%M:%S');
  });

  it('returns minute format for differences less than 3600 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-01T00:01:00' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%b %d, %Y %H:%M');
  });

  it('returns hour format for differences less than 86400 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-01T01:00:00' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%b %d, %Y %H:%M');
  });

  it('returns day format for differences less than 604800 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-02T00:00:00' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%b %d, %Y');
  });

  it('returns week format for differences less than 2678400 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-01-08T00:00:00' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%b %d, %Y');
  });

  it('returns month format for differences less than 31536000 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2023-02-01T00:00:00' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%b %Y');
  });

  it('returns year format for differences greater than or equal to 31536000 seconds', () => {
    const data = [{ timestamp: '2023-01-01T00:00:00' }, { timestamp: '2024-01-01T00:00:00' }];
    expect(getTooltipFormat(data, field, defaultFallback)).toBe('%Y');
  });

  it('uses custom fallback format when provided with invalid timestamps', () => {
    const customFallback = '%Y-%m-%d';
    const data = [{ timestamp: 'invalid' }, { timestamp: 'invalid' }];
    expect(getTooltipFormat(data, field, customFallback)).toBe(customFallback);
  });

  it('uses custom fallback format when only one valid timestamp is provided', () => {
    const customFallback = '%Y-%m-%d';
    const data = [{ timestamp: '2023-01-01T00:00:00' }];
    expect(getTooltipFormat(data, field, customFallback)).toBe(customFallback);
  });
});

describe('calculateValue', () => {
  const testValues = [5, 10, 3, 8, 5, 12];

  it('returns undefined for empty array', () => {
    expect(calculateValue([])).toBeUndefined();
  });

  it('returns undefined for undefined values', () => {
    expect(calculateValue(undefined as any)).toBeUndefined();
  });

  it('calculates first value correctly', () => {
    expect(calculateValue(testValues, 'first')).toBe(5);
  });

  it('calculates last value correctly', () => {
    expect(calculateValue(testValues, 'last')).toBe(12);
  });

  it('calculates min value correctly', () => {
    expect(calculateValue(testValues, 'min')).toBe(3);
  });

  it('calculates max value correctly', () => {
    expect(calculateValue(testValues, 'max')).toBe(12);
  });

  it('calculates mean value correctly', () => {
    // (5 + 10 + 3 + 8 + 5 + 12) / 6 = 43 / 6 = 7.166...
    expect(calculateValue(testValues, 'mean')).toBeCloseTo(7.167, 3);
  });

  it('calculates median value correctly for odd number of values', () => {
    expect(calculateValue([5, 10, 3, 8, 5], 'median')).toBe(5);
  });

  it('calculates median value correctly for even number of values', () => {
    // Median of [3, 5, 5, 8, 10, 12] is (5 + 8) / 2 = 6.5
    expect(calculateValue(testValues, 'median')).toBe(6.5);
  });

  it('calculates variance correctly', () => {
    // Mean = 7.167
    // Variance = ((5-7.167)² + (10-7.167)² + (3-7.167)² + (8-7.167)² + (5-7.167)² + (12-7.167)²) / 6
    // The actual implementation gives 9.81
    expect(calculateValue(testValues, 'variance')).toBeCloseTo(9.81, 2);
  });

  it('calculates count correctly', () => {
    expect(calculateValue(testValues, 'count')).toBe(6);
  });

  it('calculates distinct count correctly', () => {
    expect(calculateValue(testValues, 'distinct_count')).toBe(5); // 5 appears twice
  });

  it('calculates total correctly', () => {
    expect(calculateValue(testValues, 'total')).toBe(43); // 5 + 10 + 3 + 8 + 5 + 12 = 43
  });

  it('defaults to last value when calculation method is not recognized', () => {
    expect(calculateValue(testValues, 'unknown' as any)).toBe(12);
  });

  it('defaults to last value when calculation method is not provided', () => {
    expect(calculateValue(testValues)).toBe(12);
  });

  it('handles single value arrays correctly', () => {
    const singleValue = [42];
    expect(calculateValue(singleValue, 'first')).toBe(42);
    expect(calculateValue(singleValue, 'last')).toBe(42);
    expect(calculateValue(singleValue, 'min')).toBe(42);
    expect(calculateValue(singleValue, 'max')).toBe(42);
    expect(calculateValue(singleValue, 'mean')).toBe(42);
    expect(calculateValue(singleValue, 'median')).toBe(42);
    expect(calculateValue(singleValue, 'variance')).toBe(0);
    expect(calculateValue(singleValue, 'count')).toBe(1);
    expect(calculateValue(singleValue, 'distinct_count')).toBe(1);
    expect(calculateValue(singleValue, 'total')).toBe(42);
  });

  it('handles negative values correctly', () => {
    const negativeValues = [-5, -10, -3];
    expect(calculateValue(negativeValues, 'min')).toBe(-10);
    expect(calculateValue(negativeValues, 'max')).toBe(-3);
    expect(calculateValue(negativeValues, 'total')).toBe(-18);
  });

  it('handles zero values correctly', () => {
    const zeroValues = [0, 0, 0];
    expect(calculateValue(zeroValues, 'min')).toBe(0);
    expect(calculateValue(zeroValues, 'max')).toBe(0);
    expect(calculateValue(zeroValues, 'mean')).toBe(0);
    expect(calculateValue(zeroValues, 'variance')).toBe(0);
    expect(calculateValue(zeroValues, 'total')).toBe(0);
  });
});
