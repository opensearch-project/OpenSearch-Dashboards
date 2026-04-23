/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { applyAxisStyling, getAxisConfig, getSchemaByAxis, mergeStyles } from './utils';
import { AxisRole, Positions, VisFieldType, StandardAxes } from '../types';
import { ChartStyles, StyleOptions } from './use_visualization_types';

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
    const config = applyAxisStyling({ axis: defaultAxis, axisStyle: defaultAxisStyle });
    expect(config.grid).toBe(true);
    expect(config.orient).toBe(Positions.LEFT);
    expect(config.title).toBe('Custom Title');
    expect(config.labelAngle).toBe(45);
    expect(config.labelLimit).toBe(10);
    expect(config.labelOverlap).toBe('greedy');
  });

  it('disables axis when show is false', () => {
    const config = applyAxisStyling({
      axis: defaultAxis,
      axisStyle: { ...defaultAxisStyle, show: false },
    });
    expect(config.title).toBeNull();
    expect(config.labels).toBe(false);
    expect(config.ticks).toBe(false);
    expect(config.domain).toBe(false);
  });

  it('disables grid when disableGrid is true', () => {
    const config = applyAxisStyling({
      axis: defaultAxis,
      axisStyle: defaultAxisStyle,
      disableGrid: true,
    });
    expect(config.grid).toBe(false);
  });

  it('disables grid when showLines is false', () => {
    const config = applyAxisStyling({
      axis: defaultAxis,
      axisStyle: {
        ...defaultAxisStyle,
        grid: { showLines: false },
      },
    });
    expect(config.grid).toBe(false);
  });

  it('disables labels when labels.show is false', () => {
    const config = applyAxisStyling({
      axis: defaultAxis,
      axisStyle: {
        ...defaultAxisStyle,
        labels: { show: false, filter: false, rotate: 0, truncate: 0 },
      },
    });
    expect(config.labels).toBe(false);
    expect(config.labelAngle).toBeUndefined();
    expect(config.labelLimit).toBeUndefined();
  });

  it('uses default label settings when labels.show is true with default rotate and truncate', () => {
    const config = applyAxisStyling({
      axis: defaultAxis,
      axisStyle: {
        ...defaultAxisStyle,
        labels: { show: true, filter: false, rotate: 0, truncate: 0 },
      },
    });
    expect(config.labels).toBe(true);
    expect(config.labelAngle).toBe(0);
    expect(config.labelLimit).toBe(100);
  });

  it('preserves existing labelAngle and labelLimit when rotate and truncate are provided', () => {
    const config = applyAxisStyling({
      axis: defaultAxis,
      axisStyle: {
        ...defaultAxisStyle,
        labels: { show: true, filter: false, rotate: 30, truncate: 20 },
      },
    });
    expect(config.labels).toBe(true);
    expect(config.labelAngle).toBe(30);
    expect(config.labelLimit).toBe(20);
  });
});

describe('getAxisConfig', () => {
  it('returns undefined when axes are missing', () => {
    const { xAxis, yAxis } = getAxisConfig({}, {});
    expect(xAxis).toBeUndefined();
    expect(yAxis).toBeUndefined();
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

describe('mergeStyles', () => {
  it('should return a copy of dest when source is undefined', () => {
    const dest = ({ color: 'red', size: 10 } as unknown) as ChartStyles;
    const result = mergeStyles(dest, undefined);

    // Result should equal dest but not be the same object
    expect(result).toEqual(dest);
    expect(result).not.toBe(dest);
  });

  it('should merge top-level properties', () => {
    const dest = ({ color: 'red', size: 10 } as unknown) as ChartStyles;
    const source = ({ color: 'blue', weight: 'bold' } as unknown) as StyleOptions;
    const result = mergeStyles(dest, source);

    expect(result).toEqual({
      color: 'blue',
      size: 10,
      weight: 'bold',
    });
  });

  it('should merge nested objects by replacing properties', () => {
    const dest = ({
      font: {
        family: 'Arial',
        size: 12,
        style: 'normal',
      },
    } as unknown) as ChartStyles;

    const source = ({
      font: {
        size: 14,
        weight: 'bold',
      },
    } as unknown) as StyleOptions;

    const result = mergeStyles(dest, source);

    // The nested object should have properties from both objects
    expect(result).toEqual({
      font: {
        family: 'Arial',
        size: 14,
        style: 'normal',
        weight: 'bold',
      },
    });
  });

  it('should replace arrays instead of merging them', () => {
    const dest = ({
      colors: ['red', 'green', 'blue'],
    } as unknown) as ChartStyles;

    const source = ({
      colors: ['yellow', 'purple'],
    } as unknown) as StyleOptions;

    const result = mergeStyles(dest, source);

    // Arrays should be replaced, not merged
    expect(result).toEqual({
      colors: ['yellow', 'purple'],
    });
  });

  it('should handle complex nested structures', () => {
    const dest = ({
      title: 'Chart',
      axes: {
        x: {
          title: 'X Axis',
          labels: {
            show: true,
            rotate: 0,
          },
        },
        y: {
          title: 'Y Axis',
          labels: {
            show: true,
            rotate: 0,
          },
        },
      },
      legend: {
        show: true,
        position: 'right',
      },
    } as unknown) as ChartStyles;

    const source = ({
      title: 'Updated Chart',
      axes: {
        x: {
          labels: {
            rotate: 45,
          },
        },
        y: {
          title: 'Updated Y Axis',
        },
      },
      legend: {
        position: 'bottom',
      },
    } as unknown) as StyleOptions;

    const result = mergeStyles(dest, source);

    expect(result).toEqual({
      title: 'Updated Chart',
      axes: {
        x: {
          title: 'X Axis',
          labels: {
            show: true,
            rotate: 45,
          },
        },
        y: {
          title: 'Updated Y Axis',
          labels: {
            show: true,
            rotate: 0,
          },
        },
      },
      legend: {
        show: true,
        position: 'bottom',
      },
    });
  });

  it('should handle null values', () => {
    const dest = ({
      title: 'Chart',
      subtitle: 'Subtitle',
    } as unknown) as ChartStyles;

    const source = ({
      title: null,
      description: 'Description',
    } as unknown) as StyleOptions;

    const result = mergeStyles(dest, source);

    expect(result).toEqual({
      title: null,
      subtitle: 'Subtitle',
      description: 'Description',
    });
  });

  it('should handle empty objects', () => {
    const dest = ({
      title: 'Chart',
      config: {
        showGrid: true,
        showLabels: true,
      },
    } as unknown) as ChartStyles;

    const source = ({
      config: {},
    } as unknown) as StyleOptions;

    const result = mergeStyles(dest, source);

    // Empty object should not override properties
    expect(result).toEqual({
      title: 'Chart',
      config: {
        showGrid: true,
        showLabels: true,
      },
    });
  });

  it('should not override with undefined values in source', () => {
    const dest = ({
      title: 'Chart',
      subtitle: 'Subtitle',
    } as unknown) as ChartStyles;

    const source = ({
      title: undefined,
      description: 'Description',
    } as unknown) as StyleOptions;

    const result = mergeStyles(dest, source);

    // Undefined values should not override
    expect(result).toEqual({
      title: 'Chart',
      subtitle: 'Subtitle',
      description: 'Description',
    });
  });
});
