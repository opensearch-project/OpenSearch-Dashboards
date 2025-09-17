/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  convertMappingsToStrings,
  convertStringsToMappings,
  isValidMapping,
  getColumnMatchFromMapping,
  getColumnsByAxesMapping,
  adaptLegacyData,
} from './visualization_builder_utils';
import { AxisRole, VisColumn, VisFieldType, ThresholdMode, ColorSchemas } from './types';
import { BehaviorSubject } from 'rxjs';
import { ChartConfig } from './visualization_builder.types';
import { ChartStyleControlMap } from './utils/use_visualization_types';

jest.mock('./rule_repository', () => ({
  ALL_VISUALIZATION_RULES: [
    {
      id: 'rule1',
    },
    {
      id: 'rule2',
    },
  ],
}));

jest.mock('./style_panel/threshold/threshold_utils', () => ({
  Colors: {
    ['blues']: {
      baseColor: '#9ecae1',
      colors: [
        '#c6dbef',
        '#9ecae1',
        '#6baed6',
        '#4292c6',
        '#2171b5',
        '#08519c',
        '#08306b',
        '#041f45',
      ],
    },
  },
  transformToThreshold: jest.fn(() => [{ value: 10, color: '#red' }]),
  transformThresholdLinesToThreshold: jest.fn(() => [{ value: 20, color: '#blue' }]),
}));

jest.mock('./theme/default_colors', () => ({
  getColors: jest.fn(() => ({ statusGreen: '#green' })),
}));

describe('visualization_container_utils', () => {
  const mockColumns: VisColumn[] = [
    {
      id: 1,
      name: 'count',
      schema: VisFieldType.Numerical,
      column: 'count',
      validValuesCount: 100,
      uniqueValuesCount: 50,
    },
    {
      id: 2,
      name: 'category',
      schema: VisFieldType.Categorical,
      column: 'category',
      validValuesCount: 100,
      uniqueValuesCount: 10,
    },
    {
      id: 3,
      name: 'timestamp',
      schema: VisFieldType.Date,
      column: 'timestamp',
      validValuesCount: 100,
      uniqueValuesCount: 80,
    },
  ];

  describe('convertMappingsToStrings', () => {
    it('converts axis mappings to string format', () => {
      const mappings = {
        [AxisRole.X]: mockColumns[1],
        [AxisRole.Y]: mockColumns[0],
      };

      const result = convertMappingsToStrings(mappings);

      expect(result).toEqual({
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
      });
    });

    it('handles undefined columns', () => {
      const mappings = {
        [AxisRole.X]: mockColumns[0],
        [AxisRole.Y]: undefined,
      };

      const result = convertMappingsToStrings(mappings);

      expect(result).toEqual({
        [AxisRole.X]: 'count',
        [AxisRole.Y]: undefined,
      });
    });
  });

  describe('convertStringsToMappings', () => {
    it('converts string mappings to column objects', () => {
      const stringMappings = {
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
      };

      const result = convertStringsToMappings(stringMappings, mockColumns);

      expect(result).toEqual({
        [AxisRole.X]: mockColumns[1],
        [AxisRole.Y]: mockColumns[0],
      });
    });

    it('handles non-existent column names', () => {
      const stringMappings = {
        [AxisRole.X]: 'nonexistent',
      };

      const result = convertStringsToMappings(stringMappings, mockColumns);

      expect(result).toEqual({
        [AxisRole.X]: undefined,
      });
    });
  });

  describe('isValidMapping', () => {
    it('returns true for valid mappings', () => {
      const mapping = {
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
      };

      const result = isValidMapping(mapping, mockColumns);

      expect(result).toBe(true);
    });

    it('returns false for invalid mappings', () => {
      const mapping = {
        [AxisRole.X]: 'nonexistent',
      };

      const result = isValidMapping(mapping, mockColumns);

      expect(result).toBe(false);
    });
  });

  describe('getColumnMatchFromMapping', () => {
    it('counts column types from mapping', () => {
      const mapping = {
        [AxisRole.X]: { type: VisFieldType.Categorical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 0 },
      };

      const result = getColumnMatchFromMapping(mapping);

      expect(result).toEqual([1, 1, 0]);
    });

    it('handles multiple columns of same type', () => {
      const mapping = {
        [AxisRole.X]: { type: VisFieldType.Numerical, index: 0 },
        [AxisRole.Y]: { type: VisFieldType.Numerical, index: 1 },
        [AxisRole.COLOR]: { type: VisFieldType.Categorical, index: 0 },
      };

      const result = getColumnMatchFromMapping(mapping);

      expect(result).toEqual([2, 1, 0]);
    });
  });

  describe('getColumnsByAxesMapping', () => {
    it('categorizes columns by their schema type', () => {
      const mapping = {
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
        [AxisRole.COLOR]: 'timestamp',
      };

      const result = getColumnsByAxesMapping(mapping, mockColumns);

      expect(result.numericalColumns).toEqual([mockColumns[0]]);
      expect(result.categoricalColumns).toEqual([mockColumns[1]]);
      expect(result.dateColumns).toEqual([mockColumns[2]]);
    });

    it('handles empty mapping', () => {
      const mapping = {};

      const result = getColumnsByAxesMapping(mapping, mockColumns);

      expect(result.numericalColumns).toEqual([]);
      expect(result.categoricalColumns).toEqual([]);
      expect(result.dateColumns).toEqual([]);
    });

    it('ignores non-existent column names', () => {
      const mapping = {
        [AxisRole.X]: 'nonexistent',
        [AxisRole.Y]: 'count',
      };

      const result = getColumnsByAxesMapping(mapping, mockColumns);

      expect(result.numericalColumns).toEqual([mockColumns[0]]);
      expect(result.categoricalColumns).toEqual([]);
      expect(result.dateColumns).toEqual([]);
    });

    it('handles multiple columns of the same type', () => {
      // Add another numerical column to the mock data
      const extendedColumns = [
        ...mockColumns,
        {
          id: 4,
          name: 'average',
          schema: VisFieldType.Numerical,
          column: 'average',
          validValuesCount: 100,
          uniqueValuesCount: 30,
        },
      ];

      const mapping = {
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
        [AxisRole.Y_SECOND]: 'average',
      };

      const result = getColumnsByAxesMapping(mapping, extendedColumns);

      expect(result.numericalColumns).toHaveLength(2);
      expect(result.numericalColumns).toContainEqual(extendedColumns[0]); // count
      expect(result.numericalColumns).toContainEqual(extendedColumns[3]); // average
      expect(result.categoricalColumns).toEqual([extendedColumns[1]]);
      expect(result.dateColumns).toEqual([]);
    });
  });

  describe('adaptLegacyData', () => {
    let visConfig$: BehaviorSubject<ChartConfig | undefined>;

    beforeEach(() => {
      visConfig$ = new BehaviorSubject<ChartConfig | undefined>(undefined);
    });

    it('handles undefined config', () => {
      adaptLegacyData(visConfig$, undefined);
      expect(visConfig$.value).toBeUndefined();
    });

    it('transforms gauge chart with thresholds and basecolor', () => {
      const config: ChartConfig = {
        type: 'gauge',
        styles: {
          thresholds: [{ value: 10, color: '#red' }],
          baseColor: '#9ecae1',
        } as ChartStyleControlMap['gauge'],
      };

      adaptLegacyData(visConfig$, config);

      expect(visConfig$.value?.styles).toMatchObject({
        thresholdOptions: {
          baseColor: '#9ecae1',
          thresholds: [{ value: 10, color: '#red' }],
          useThresholdColor: false,
        },
      });
    });

    it('transforms metric chart with colorSchema', () => {
      const config: ChartConfig = {
        type: 'metric',
        styles: {
          colorSchema: ColorSchemas.BLUES,
          customRanges: [{ min: 0, max: 100 }],
          useColor: true,
        } as ChartStyleControlMap['metric'],
      };

      adaptLegacyData(visConfig$, config);

      expect(visConfig$.value?.styles).toMatchObject({
        thresholdOptions: {
          baseColor: '#9ecae1',
          thresholds: [{ value: 10, color: '#red' }],
          useThresholdColor: true,
        },
      });
    });

    it('skips metric transformation when thresholdOptions exists', () => {
      const config: ChartConfig = {
        type: 'metric',
        styles: {
          colorSchema: ColorSchemas.BLUES,
          thresholdOptions: { baseColor: '#fffff' },
        } as ChartStyleControlMap['metric'],
      };

      adaptLegacyData(visConfig$, config);

      expect(visConfig$.value?.styles).toMatchObject({
        colorSchema: ColorSchemas.BLUES,
        thresholdOptions: { baseColor: '#fffff' },
      });
    });

    it('transforms heatmap chart with exclusive colorSchema', () => {
      const config: ChartConfig = {
        type: 'heatmap',
        styles: {
          exclusive: {
            colorSchema: ColorSchemas.BLUES,
            customRanges: [{ min: 0, max: 50 }],
            useCustomRanges: true,
          },
        } as ChartStyleControlMap['heatmap'],
      };

      adaptLegacyData(visConfig$, config);

      expect(visConfig$.value?.styles).toMatchObject({
        thresholdOptions: {
          baseColor: '#9ecae1',
          thresholds: [{ value: 10, color: '#red' }],
          useThresholdColor: true,
        },
      });
    });

    it('transforms bar chart with thresholdLines', () => {
      const config: ChartConfig = {
        type: 'bar',
        styles: {
          thresholdLines: [
            {
              value: 30,
              color: '#red',
              show: true,
              style: ThresholdMode.Dashed,
              width: 2,
            },
          ],
        } as ChartStyleControlMap['bar'],
      };

      adaptLegacyData(visConfig$, config);

      expect(visConfig$.value?.styles).toMatchObject({
        thresholdOptions: {
          thresholds: [{ value: 20, color: '#blue' }],
          baseColor: '#green',
          thresholdStyle: ThresholdMode.Dashed,
          useThresholdColor: false,
        },
      });
    });

    it('uses Off style when thresholdLine show is false', () => {
      const config: ChartConfig = {
        type: 'line',
        styles: {
          thresholdLines: [
            {
              value: 30,
              color: '#red',
              show: false,
              style: ThresholdMode.Solid,
              width: 2,
            },
          ],
        } as ChartStyleControlMap['line'],
      };

      adaptLegacyData(visConfig$, config);

      expect(visConfig$.value?.styles).toMatchObject({
        thresholdOptions: {
          thresholds: [{ value: 20, color: '#blue' }],
          baseColor: '#green',
          thresholdStyle: ThresholdMode.Off,
          useThresholdColor: false,
        },
      });
    });
  });
});
