/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createNumericalStateTimeline,
  createCategoricalStateTimeline,
  createSingleCategoricalStateTimeline,
} from './to_expression';
import { VisColumn, VisFieldType, AxisRole } from '../types';
import { defaultStateTimeLineChartStyles } from './state_timeline_config';

describe('State Timeline to_expression', () => {
  const mockData = [
    { timestamp: '2023-01-01', group: 'A', color: 'red', numValue: 10 },
    { timestamp: '2023-01-02', group: 'A', color: 'blue', numValue: 20 },
    { timestamp: '2023-01-03', group: 'B', color: 'red', numValue: 30 },
  ];

  const mockTimeColumn: VisColumn = {
    id: 1,
    name: 'Time',
    schema: VisFieldType.Date,
    column: 'timestamp',
    validValuesCount: 3,
    uniqueValuesCount: 3,
  };

  const mockCateColumn1: VisColumn = {
    id: 2,
    name: 'Group',
    schema: VisFieldType.Categorical,
    column: 'group',
    validValuesCount: 3,
    uniqueValuesCount: 2,
  };

  const mockCateColumn2: VisColumn = {
    id: 3,
    name: 'Color',
    schema: VisFieldType.Categorical,
    column: 'color',
    validValuesCount: 3,
    uniqueValuesCount: 2,
  };

  const mockNumColumn: VisColumn = {
    id: 4,
    name: 'NumValue',
    schema: VisFieldType.Numerical,
    column: 'numValue',
    validValuesCount: 3,
    uniqueValuesCount: 3,
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

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('xAxis');
      expect(result).toHaveProperty('yAxis');
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

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
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

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('series');
    });

    it('throws when required fields are missing', () => {
      expect(() => createSingleCategoricalStateTimeline(mockData, mockStyles, {} as any)).toThrow();
    });
  });
});
