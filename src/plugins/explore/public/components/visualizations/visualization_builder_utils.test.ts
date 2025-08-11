/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  convertMappingsToStrings,
  convertStringsToMappings,
  isValidMapping,
  findRuleByIndex,
  getColumnMatchFromMapping,
} from './visualization_builder_utils';
import { AxisRole, VisColumn, VisFieldType } from './types';

jest.mock('./rule_repository', () => ({
  ALL_VISUALIZATION_RULES: [
    {
      id: 'rule1',
      matchIndex: [1, 1, 0],
    },
    {
      id: 'rule2',
      matchIndex: [0, 1, 1],
    },
  ],
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

  describe('findRuleByIndex', () => {
    it('finds rule by column type counts', () => {
      const mapping = {
        [AxisRole.X]: 'category',
        [AxisRole.Y]: 'count',
      };

      const result = findRuleByIndex(mapping, mockColumns);

      expect(result?.id).toBe('rule1');
    });

    it('returns undefined for no matching rule', () => {
      const mapping = {
        [AxisRole.X]: 'count',
        [AxisRole.Y]: 'count',
      };

      const result = findRuleByIndex(mapping, mockColumns);

      expect(result).toBeUndefined();
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
});
