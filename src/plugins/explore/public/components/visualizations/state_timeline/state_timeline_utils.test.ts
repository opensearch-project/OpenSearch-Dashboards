/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValueMapping } from '../types';
import {
  mergeCategoricalData,
  mergeSingleCategoricalData,
  mergeNumericalData,
} from './state_timeline_utils';

const mockData = [
  { timestamp: '2023-01-01T10:00:00Z', category: 'A', status: 'active', value: 5 },
  { timestamp: '2023-01-01T11:00:00Z', category: 'A', status: 'active', value: 15 },
  { timestamp: '2023-01-01T12:00:00Z', category: 'B', status: 'inactive', value: 25 },
];

describe('state_timeline_utils', () => {
  describe('mergeCategoricalData', () => {
    it('returns original data when required fields are missing', () => {
      const [result, mappings] = mergeCategoricalData(mockData);
      expect(result).toEqual(mockData);
      expect(mappings).toEqual([]);
    });

    it('filters valid mappings based on data', () => {
      const mappings: ValueMapping[] = [
        { type: 'value', value: 'active', displayText: 'Active' },
        { type: 'value', value: 'nonexistent', displayText: 'Not Found' },
      ];

      const [result, validMappings] = mergeCategoricalData(
        mockData,
        'timestamp',
        'category',
        'status',
        mappings
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);
      expect(validMappings?.[0].value).toBe('active');
    });

    it('uses fallback when no valid mappings exist', () => {
      const mappings: ValueMapping[] = [
        { type: 'value', value: 'nonexistent', displayText: 'Not Found' },
      ];

      const [result, validMappings] = mergeCategoricalData(
        mockData,
        'timestamp',
        'category',
        'status',
        mappings
      );

      expect(validMappings).toEqual([]);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T11:00:00Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedCount: 2,
        },
        {
          category: 'B',
          end: '2023-01-01T12:00:00Z',
          mergedCount: 1,
          start: '2023-01-01T12:00:00Z',
          status: 'inactive',
          timestamp: '2023-01-01T12:00:00Z',
          value: 25,
        },
      ]);
    });

    it('able to merge data by mapping', () => {
      const mappings: ValueMapping[] = [{ type: 'value', value: 'active', displayText: 'Active' }];

      const [result, validMappings] = mergeCategoricalData(
        mockData,
        'timestamp',
        'category',
        'status',
        mappings
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T11:00:00Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedCount: 2,
        },
      ]);
    });

    it('able to disable values by threhsold', () => {
      const data = [
        { timestamp: '2023-01-01T10:00:00Z', category: 'A', status: 'active', value: 5 },
        { timestamp: '2023-01-01T11:00:00Z', category: 'A', status: 'active', value: 15 },
        { timestamp: '2023-01-01T12:00:00Z', category: 'A', status: 'inactive', value: 15 },
        { timestamp: '2023-01-01T12:00:00Z', category: 'B', status: 'inactive', value: 25 },
      ];
      const mappings: ValueMapping[] = [{ type: 'value', value: 'active', displayText: 'Active' }];

      const [result, validMappings] = mergeCategoricalData(
        data,
        'timestamp',
        'category',
        'status',
        mappings,
        '10m'
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T11:10:00.000Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedCount: 2,
        },
      ]);
    });

    it('able to connect null values between same entries by threhsold', () => {
      const data = [
        { timestamp: '2023-01-01T10:00:00Z', category: 'A', status: 'active', value: 5 },
        { timestamp: '2023-01-01T11:00:00Z', category: 'A', status: 'active', value: 15 },
        { timestamp: '2023-01-01T12:00:00Z', category: 'A', status: 'inactive', value: 15 },
        { timestamp: '2023-01-01T12:30:00Z', category: 'A', status: 'active', value: 15 },
        { timestamp: '2023-01-01T12:00:00Z', category: 'B', status: 'inactive', value: 25 },
      ];
      const mappings: ValueMapping[] = [{ type: 'value', value: 'active', displayText: 'Active' }];

      const [result, validMappings] = mergeCategoricalData(
        data,
        'timestamp',
        'category',
        'status',
        mappings,
        undefined,
        '2h'
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T12:30:00Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedCount: 2,
        },
        {
          timestamp: '2023-01-01T12:30:00Z',
          start: '2023-01-01T12:30:00Z',
          end: '2023-01-01T12:30:00Z',
          category: 'A',
          status: 'active',
          value: 15,
          mergedCount: 1,
        },
      ]);
    });
  });

  describe('mergeSingleCategoricalData', () => {
    it('returns original data when required fields are missing', () => {
      const [result, mappings] = mergeSingleCategoricalData(mockData);
      expect(result).toEqual(mockData);
      expect(mappings).toEqual([]);
    });

    it('processes single categorical field correctly', () => {
      const mappings: ValueMapping[] = [
        { type: 'value', value: 'A', displayText: 'Category A' },
        { type: 'value', value: 'B', displayText: 'Category B' },
      ];

      const [result, validMappings] = mergeSingleCategoricalData(
        mockData,
        'timestamp',
        'category',
        mappings
      );

      expect(validMappings).toHaveLength(2);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',

          end: '2023-01-01T12:00:00Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedCount: 2,
        },
        {
          category: 'B',
          end: '2023-01-01T12:00:00Z',

          mergedCount: 1,
          start: '2023-01-01T12:00:00Z',
          status: 'inactive',
          timestamp: '2023-01-01T12:00:00Z',
          value: 25,
        },
      ]);
    });
  });

  describe('mergeNumericalData', () => {
    it('returns original data when required fields are missing', () => {
      const [result, mappings] = mergeNumericalData(mockData);
      expect(result).toEqual(mockData);
      expect(mappings).toEqual([]);
    });

    it('filters ranges based on data values', () => {
      const mappings: ValueMapping[] = [
        { type: 'range', range: { min: 0, max: 20 }, displayText: 'Medium' },
        { type: 'range', range: { min: 100, max: 200 }, displayText: 'High' },
      ];

      const [result, validRanges] = mergeNumericalData(
        mockData,
        'timestamp',
        'category',
        'value',
        mappings
      );

      expect(validRanges).toHaveLength(1); // Only ranges that contain data values
      expect(validRanges?.[0].range?.min).toBe(0);
      expect(validRanges?.[0].range?.max).toBe(20);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T11:00:00Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedLabel: '[0,20)',
          mergedCount: 2,
        },
      ]);
    });

    it('uses fallback when no valid ranges exist', () => {
      const mappings: ValueMapping[] = [
        { type: 'range', range: { min: 100, max: 200 }, displayText: 'High' },
      ];

      const [result, validRanges] = mergeNumericalData(
        mockData,
        'timestamp',
        'category',
        'value',
        mappings
      );

      expect(validRanges).toEqual([]);
      expect(result).toMatchObject([
        {
          timestamp: '2023-01-01T10:00:00Z',
          start: '2023-01-01T10:00:00Z',
          end: '2023-01-01T11:00:00Z',
          category: 'A',
          status: 'active',
          value: 5,
          mergedCount: 2,
        },
        {
          timestamp: '2023-01-01T12:00:00Z',
          start: '2023-01-01T12:00:00Z',
          end: '2023-01-01T12:00:00Z',
          category: 'B',
          status: 'inactive',
          value: 25,
          mergedCount: 1,
        },
      ]);
    });
  });
});
