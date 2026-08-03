/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createNumericalStateTimeline,
  createCategoricalStateTimeline,
  createSingleCategoricalStateTimeline,
  createSingleNumericalStateTimeline,
} from './to_expression';
import { VisColumn, VisFieldType, AxisRole } from '../types';
import { defaultStateTimeLineChartStyles } from './state_timeline_config';
import { getColors } from '../theme/default_colors';

describe('State Timeline to_expression', () => {
  const mockData = [
    { timestamp: '2023-01-01', group: 'A', color: 'red', numValue: 10 },
    { timestamp: '2023-01-02', group: 'A', color: 'blue', numValue: 20 },
    { timestamp: '2023-01-03', group: 'B', color: 'red', numValue: 30 },
  ];

  const mergedStateData = [
    { timestamp: '2023-01-01', group: 'A', color: 'red', numValue: 10 },
    { timestamp: '2023-01-02', group: 'A', color: 'red', numValue: 10 },
    { timestamp: '2023-01-03', group: 'A', color: 'blue', numValue: 20 },
    { timestamp: '2023-01-04', group: 'A', color: 'blue', numValue: 20 },
  ];

  const mockTimeColumn: VisColumn = {
    id: 1,
    name: 'Time',
    schema: VisFieldType.Date,
    column: 'timestamp',
  };

  const mockCateColumn1: VisColumn = {
    id: 2,
    name: 'Group',
    schema: VisFieldType.Categorical,
    column: 'group',
  };

  const mockCateColumn2: VisColumn = {
    id: 3,
    name: 'Color',
    schema: VisFieldType.Categorical,
    column: 'color',
  };

  const mockNumColumn: VisColumn = {
    id: 4,
    name: 'NumValue',
    schema: VisFieldType.Numerical,
    column: 'numValue',
  };

  const mockStyles = {
    ...defaultStateTimeLineChartStyles,
  };

  describe('createNumericalStateTimeline', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockTimeColumn,
      [AxisRole.Y]: mockCateColumn1,
      [AxisRole.COLOR]: mockNumColumn,
    };

    it('returns an ECharts spec with dataset and series', () => {
      const result = createNumericalStateTimeline(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
      expect(result.spec).toHaveProperty('xAxis');
      expect(result.spec).toHaveProperty('yAxis');
    });

    it('emits series-target legend items from resolved state colors', () => {
      const palette = getColors().categories;
      const result = createNumericalStateTimeline(mergedStateData, mockStyles, mockAxisMappings);

      expect(result.legendItems).toEqual([
        {
          label: '10',
          color: palette[0],
          target: { type: 'series', name: '10' },
        },
        {
          label: '20',
          color: palette[1],
          target: { type: 'series', name: '20' },
        },
      ]);
      expect(result.spec.series).toEqual([
        expect.objectContaining({ name: '10', itemStyle: { color: palette[0] } }),
        expect.objectContaining({ name: '20', itemStyle: { color: palette[1] } }),
      ]);
    });

    it('throws when required fields are missing', () => {
      expect(() => createNumericalStateTimeline(mockData, mockStyles, {} as any)).toThrow();
    });
  });

  describe('createCategoricalStateTimeline', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockTimeColumn,
      [AxisRole.Y]: mockCateColumn1,
      [AxisRole.COLOR]: mockCateColumn2,
    };

    it('returns an ECharts spec with dataset and series', () => {
      const result = createCategoricalStateTimeline(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
    });

    it('emits legend items using value mapping display text and colors', () => {
      const stylesWithValueMappings = {
        ...mockStyles,
        valueMappingOptions: {
          valueMappings: [
            { type: 'value' as const, value: 'red', displayText: 'Critical', color: '#ff0000' },
            { type: 'value' as const, value: 'blue', displayText: 'Healthy', color: '#00ff00' },
          ],
        },
      };
      const result = createCategoricalStateTimeline(
        mergedStateData,
        stylesWithValueMappings,
        mockAxisMappings
      );

      expect(result.legendItems).toEqual([
        {
          label: 'Critical',
          color: '#ff0000',
          target: { type: 'series', name: 'Critical' },
        },
        {
          label: 'Healthy',
          color: '#00ff00',
          target: { type: 'series', name: 'Healthy' },
        },
      ]);
    });

    it('throws when required fields are missing', () => {
      expect(() => createCategoricalStateTimeline(mockData, mockStyles, {} as any)).toThrow();
    });
  });

  describe('createSingleCategoricalStateTimeline', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockTimeColumn,
      [AxisRole.COLOR]: mockCateColumn2,
    };

    it('returns an ECharts spec with dataset and series', () => {
      const result = createSingleCategoricalStateTimeline(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
    });

    it('emits series-target legend items for single categorical state timelines', () => {
      const palette = getColors().categories;
      const result = createSingleCategoricalStateTimeline(
        mergedStateData,
        mockStyles,
        mockAxisMappings
      );

      expect(result.legendItems).toEqual([
        {
          label: 'red',
          color: palette[1],
          target: { type: 'series', name: 'red' },
        },
        {
          label: 'blue',
          color: palette[0],
          target: { type: 'series', name: 'blue' },
        },
      ]);
    });

    it('throws when required fields are missing', () => {
      expect(() => createSingleCategoricalStateTimeline(mockData, mockStyles, {} as any)).toThrow();
    });
  });

  describe('createSingleNumericalStateTimeline', () => {
    const mockAxisMappings = {
      [AxisRole.X]: mockTimeColumn,
      [AxisRole.COLOR]: mockNumColumn,
    };

    it('returns an ECharts spec with dataset and series', () => {
      const result = createSingleNumericalStateTimeline(mockData, mockStyles, mockAxisMappings);

      expect(result.spec).toHaveProperty('dataset');
      expect(result.spec).toHaveProperty('series');
    });

    it('throws when required fields are missing', () => {
      expect(() => createSingleNumericalStateTimeline(mockData, mockStyles, {} as any)).toThrow();
    });
  });
});
