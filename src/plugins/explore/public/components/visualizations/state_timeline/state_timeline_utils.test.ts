/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValueMapping } from '../types';
import {
  mergeCategoricalData,
  mergeSingleCategoricalData,
  mergeNumericalDataCore,
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
        mappings,
        undefined,
        undefined,
        'useValueMapping'
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
        mappings,
        undefined,
        undefined,
        'useValueMapping'
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

    it('uses fallback when filter option is set to none', () => {
      const mappings: ValueMapping[] = [
        { type: 'value', value: 'nonexistent', displayText: 'Not Found' },
      ];

      const [result, validMappings] = mergeCategoricalData(
        mockData,
        'timestamp',
        'category',
        'status',
        mappings,
        undefined,
        undefined,
        'none'
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
        mappings,
        undefined,
        undefined,
        'useValueMapping'
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: '2023-01-01T10:00:00Z',
            start: '2023-01-01T10:00:00Z',
            end: '2023-01-01T11:00:00Z',
            category: 'A',
            status: 'active',
            value: 5,
            mergedCount: 2,
            duration: '1h',
          }),
        ])
      );
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
        '10m',
        undefined,
        'useValueMapping'
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: '2023-01-01T10:00:00Z',
            start: '2023-01-01T10:00:00Z',
            end: '2023-01-01T11:10:00.000Z',
            category: 'A',
            status: 'active',
            value: 5,
            mergedCount: 2,
            duration: '1h 10m',
          }),
        ])
      );
    });

    it('able to connect null values between same entries by threhsold', () => {
      const data = [
        { timestamp: '2023-01-01T10:00:00Z', category: 'A', status: 'active', value: 5 },
        { timestamp: '2023-01-01T11:00:00Z', category: 'A', status: null, value: 15 },
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
        '2h',
        'useValueMapping'
      );

      expect(validMappings).toMatchObject([
        { type: 'value', value: 'active', displayText: 'Active' },
      ]);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: '2023-01-01T10:00:00Z',
            start: '2023-01-01T10:00:00Z',
            end: '2023-01-01T12:00:00Z',
            category: 'A',
            status: 'active',
            value: 5,
            mergedCount: 2,
          }),
          expect.objectContaining({
            timestamp: '2023-01-01T12:30:00Z',
            start: '2023-01-01T12:30:00Z',
            end: '2023-01-01T12:30:00Z',
            category: 'A',
            status: 'active',
            value: 15,
            mergedCount: 1,
          }),
        ])
      );
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
        mappings,
        undefined,
        undefined,
        'useValueMapping'
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

  describe('mergeNumericalDataCore', () => {
    it('returns original data when required fields are missing', () => {
      const [result, mappings] = mergeNumericalDataCore(mockData);
      expect(result).toEqual(mockData);
      expect(mappings).toEqual([]);
    });

    it('filters ranges based on data values', () => {
      const mappings: ValueMapping[] = [
        { type: 'range', range: { min: 0, max: 20 }, displayText: 'Medium' },
        { type: 'range', range: { min: 100, max: 200 }, displayText: 'High' },
      ];

      const [result, validRanges] = mergeNumericalDataCore(
        mockData,
        'timestamp',
        'category',
        'value',
        mappings,
        [],
        undefined,
        undefined,
        'useValueMapping'
      );

      expect(validRanges).toHaveLength(1); // Only ranges that contain data values
      expect(validRanges?.[0].range?.min).toBe(0);
      expect(validRanges?.[0].range?.max).toBe(20);

      expect(result[0]).toMatchObject({
        timestamp: '2023-01-01T10:00:00Z',
        start: '2023-01-01T10:00:00Z',
        end: '2023-01-01T11:00:00Z',
        category: 'A',
        status: 'active',
        value: 5,
        mergedLabel: '[0,20)',
        mergedCount: 2,
        duration: '1h',
      });
    });

    it('should create a fake mapping range for invalid data entry', () => {
      const mappings: ValueMapping[] = [
        { type: 'range', range: { min: 0, max: 20 }, displayText: 'Medium' },
        { type: 'range', range: { min: 100, max: 200 }, displayText: 'High' },
      ];

      const [result, validRanges] = mergeNumericalDataCore(
        mockData,
        'timestamp',
        'category',
        'value',
        mappings,
        [],
        undefined,
        undefined,
        'useValueMapping'
      );

      expect(validRanges).toHaveLength(1); // Only ranges that contain data values
      expect(validRanges?.[0].range?.min).toBe(0);
      expect(validRanges?.[0].range?.max).toBe(20);
      expect(result[1]).toMatchObject({
        timestamp: '2023-01-01T12:00:00Z',
        start: '2023-01-01T12:00:00Z',
        end: '2023-01-01T12:00:00Z',
        category: 'B',
        status: 'inactive',
        value: 25,
        mergedLabel: '[Infinity,Infinity)',
        mergedCount: 1,
        duration: '0s',
      });
    });

    it('should handle both value mappings and range mappings', () => {
      const mappings: ValueMapping[] = [
        { type: 'range', range: { min: 0, max: 20 }, displayText: 'Medium' },
        { type: 'range', range: { min: 100, max: 200 }, displayText: 'High' },
      ];

      const valueMappings: ValueMapping[] = [{ type: 'range', value: '15', displayText: 'low' }];

      const [result, validRanges, validValues] = mergeNumericalDataCore(
        mockData,
        'timestamp',
        'category',
        'value',
        mappings,
        valueMappings,
        undefined,
        undefined,
        'useValueMapping'
      );

      expect(validRanges).toHaveLength(1); // Only ranges that contain data values
      expect(validRanges?.[0].range?.min).toBe(0);
      expect(validRanges?.[0].range?.max).toBe(20);
      expect(validValues).toHaveLength(1);
      expect(validValues?.[0].value).toBe('15');
      expect(result[0]).toMatchObject({
        timestamp: '2023-01-01T10:00:00Z',
        start: '2023-01-01T10:00:00Z',
        end: '2023-01-01T11:00:00Z',
        category: 'A',
        status: 'active',
        value: 5,
        mergedLabel: '[0,20)',
        mergedCount: 1,
        duration: '1h',
      });
      expect(result[1]).toMatchObject({
        timestamp: '2023-01-01T11:00:00Z',
        start: '2023-01-01T11:00:00Z',
        end: '2023-01-01T11:00:00Z',
        category: 'A',
        status: 'active',
        value: 15,
        mergedLabel: '15',
        mergedCount: 1,
        duration: '0s',
      });
    });

    it('uses categorical state timeline fallback when no valid ranges exist', () => {
      const mappings: ValueMapping[] = [
        { type: 'range', range: { min: 100, max: 200 }, displayText: 'High' },
      ];

      const [result, validRanges] = mergeNumericalDataCore(
        mockData,
        'timestamp',
        'category',
        'value',
        mappings,
        undefined,
        undefined,
        'useValueMapping'
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
          mergedCount: 1,
          duration: '1h',
        },

        {
          timestamp: '2023-01-01T11:00:00Z',
          start: '2023-01-01T11:00:00Z',
          end: '2023-01-01T11:00:00Z',
          category: 'A',
          status: 'active',
          value: 15,
          mergedCount: 1,
          duration: '0s',
        },
        {
          timestamp: '2023-01-01T12:00:00Z',
          start: '2023-01-01T12:00:00Z',
          end: '2023-01-01T12:00:00Z',
          category: 'B',
          status: 'inactive',
          value: 25,
          mergedCount: 1,
          duration: '0s',
        },
      ]);
    });
  });
});
