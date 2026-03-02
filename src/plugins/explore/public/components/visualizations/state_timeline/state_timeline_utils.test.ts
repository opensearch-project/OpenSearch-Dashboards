/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValueMapping } from '../types';
import {
  mergeDataCore,
  convertThresholdsToValueMappings,
  createStateTimeLineSpec,
  mergeInAGroup,
} from './state_timeline_utils';
import { StateTimeLineChartStyle } from './state_timeline_config';
import { EChartsSpecState } from '../utils/echarts_spec';

const mockData = [
  { timestamp: '2023-01-01T10:00:00Z', category: 'A', status: 'active', value: 5 },
  { timestamp: '2023-01-01T11:00:00Z', category: 'A', status: 'active', value: 15 },
  { timestamp: '2023-01-01T12:00:00Z', category: 'B', status: 'inactive', value: 25 },
];

describe('state_timeline_utils', () => {
  describe('convertThresholdsToValueMappings', () => {
    it('converts thresholds to value mappings', () => {
      const thresholds = [
        { value: 0, color: 'green' },
        { value: 10, color: 'yellow' },
        { value: 20, color: 'red' },
      ];

      const result = convertThresholdsToValueMappings(thresholds);

      expect(result).toEqual([
        { type: 'range', range: { min: 0, max: 10 }, color: 'green' },
        { type: 'range', range: { min: 10, max: 20 }, color: 'yellow' },
        { type: 'range', range: { min: 20, max: undefined }, color: 'red' },
      ]);
    });

    it('handles empty thresholds array', () => {
      const result = convertThresholdsToValueMappings([]);
      expect(result).toEqual([]);
    });
  });

  describe('mergeDataCore', () => {
    it('merges data with value mappings', () => {
      const valueMappings: ValueMapping[] = [{ type: 'value', value: 'active', color: 'green' }];

      const result = mergeDataCore({
        timestampField: 'timestamp',
        mappingField: 'status',
        valueMappings,
        useValueMappingColor: true,
      })(mockData);

      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('start');
      expect(result[0]).toHaveProperty('end');
      expect(result).toMatchObject([
        {
          category: 'A',
          displayText: undefined,
          duration: '2h',
          end: '2023-01-01T12:00:00Z',
          mergedColor: 'green',
          mergedCount: 2,
          mergedLabel: 'active',
          start: '2023-01-01T10:00:00Z',
          status: 'active',
          timestamp: '2023-01-01T10:00:00Z',
          value: 5,
        },
      ]);
    });

    it('merges data with range mappings', () => {
      const rangeMappings: ValueMapping[] = [
        { type: 'range', range: { min: 0, max: 15 }, color: 'green' },
      ];

      const result = mergeDataCore({
        timestampField: 'timestamp',
        mappingField: 'value',
        rangeMappings,
        useValueMappingColor: true,
      })(mockData);

      expect(result).toMatchObject([
        {
          category: 'A',
          displayText: undefined,
          duration: '1h',
          end: '2023-01-01T11:00:00Z',
          mergedColor: 'green',
          mergedCount: 1,
          mergedLabel: '[0,15)',
          start: '2023-01-01T10:00:00Z',
          status: 'active',
          timestamp: '2023-01-01T10:00:00Z',
          value: 5,
        },
        {
          category: 'A',
          displayText: undefined,
          duration: '1h',
          end: '2023-01-01T12:00:00Z',
          mergedColor: undefined,
          mergedCount: 1,
          mergedLabel: '_unmatched_',
          start: '2023-01-01T11:00:00Z',
          status: 'active',
          timestamp: '2023-01-01T11:00:00Z',
          value: 15,
        },
      ]);
    });

    it('handles grouped data', () => {
      const rangeMappings: ValueMapping[] = [
        { type: 'range', range: { min: 0, max: 15 }, color: 'green' },
      ];
      const result = mergeDataCore({
        timestampField: 'timestamp',
        groupField: 'category',
        mappingField: 'status',
        rangeMappings,
      })(mockData);

      expect(result).toMatchSnapshot();
    });

    it('handles disconnect threshold', () => {
      const result = mergeDataCore({
        timestampField: 'timestamp',
        mappingField: 'status',
        disconnectThreshold: '30m',
      })(mockData);

      expect(result).toMatchSnapshot();
    });
  });

  describe('createStateTimeLineSpec', () => {
    const mockStyles: StateTimeLineChartStyle = {
      exclusive: { rowHeight: 0.8, showValues: true },
    } as StateTimeLineChartStyle;

    const mockState = {
      transformedData: [
        [
          ['timestamp', 'category', 'start', 'end', 'mergedLabel', 'mergedColor', 'displayText'],
          [
            '2023-01-01T10:00:00Z',
            'A',
            '2023-01-01T10:00:00Z',
            '2023-01-01T11:00:00Z',
            'active',
            'green',
            'Active',
          ],
        ],
        [
          ['timestamp', 'category', 'start', 'end', 'mergedLabel', 'mergedColor', 'displayText'],
          [
            '2023-01-01T10:00:00Z',
            'A',
            '2023-01-01T10:00:00Z',
            '2023-01-01T11:00:00Z',
            'inactive',
            'red',
            'Not Active',
          ],
        ],
      ],
      yAxisConfig: { show: true },
    } as EChartsSpecState;

    it('creates state timeline spec without group field', () => {
      const result = createStateTimeLineSpec({ styles: mockStyles })(mockState);

      expect(result.series).toHaveLength(2);
      expect(result.series?.[0].type).toBe('custom');
      expect(result.series?.[0].name).toBe('Active');
      expect(result.series?.[1].type).toBe('custom');
      expect(result.series?.[1].name).toBe('Not Active');
      expect(result.yAxisConfig.min).toBe(0);
      expect(result.yAxisConfig.max).toBe(10); // fake y
      expect(result.yAxisConfig.axisLabel.show).toBe(false);
    });

    it('creates state timeline spec with group field', () => {
      const result = createStateTimeLineSpec({
        styles: mockStyles,
        groupField: 'category',
      })(mockState);

      expect(result.yAxisConfig).toBe(mockState.yAxisConfig);
      expect(result.series).toHaveLength(2);
      expect(result.series?.[0].type).toBe('custom');
      expect(result.series?.[0].name).toBe('Active');
      expect(result.series?.[0].encode?.y).toBe('category');
      expect(result.series?.[1].type).toBe('custom');
      expect(result.series?.[1].name).toBe('Not Active');
      expect(result.series?.[1].encode?.y).toBe('category');
    });
  });

  describe('mergeInAGroup', () => {
    it('processes data and flushes buffer correctly', () => {
      const merged: any[] = [];
      const storeState = { buffer: [], currentValue: undefined };
      const mockFindTarget = jest.fn((value) => value);
      const mockMergeFn = jest.fn((buffer) => ({
        merged: true,
        count: buffer.length,
      }));

      const data = [
        { timestamp: '2023-01-01T10:00:00Z', status: 'active' },
        { timestamp: '2023-01-01T11:00:00Z', status: 'active' },
        { timestamp: '2023-01-01T12:00:00Z', status: 'inactive' },
      ];

      mergeInAGroup({
        sorted: data,
        timestampField: 'timestamp',
        valueField: 'status',
        merged,
        storeState,
        findTarget: mockFindTarget,
        mergeFn: mockMergeFn,
      });

      expect(mockMergeFn).toHaveBeenCalled();
      expect(merged).toMatchObject([{ count: 2, merged: true }]);
    });

    it('handles null values with connect threshold', () => {
      const merged: any[] = [];
      const storeState = { buffer: [], currentValue: undefined };
      const mockFindTarget = jest.fn((value) => value);
      const mockMergeFn = jest.fn((buffer) => ({
        merged: true,
        count: buffer.length,
      }));

      const data = [
        { timestamp: '2023-01-01T10:00:00Z', status: 'active' },
        { timestamp: '2023-01-01T10:01:00Z', status: 'active' },
        { timestamp: '2023-01-01T10:05:00Z', status: null },
        { timestamp: '2023-01-01T10:10:00Z', status: 'inactive' },
      ];

      mergeInAGroup({
        sorted: data,
        timestampField: 'timestamp',
        valueField: 'status',
        connectThreshold: '1h',
        merged,
        storeState,
        findTarget: mockFindTarget,
        mergeFn: mockMergeFn,
      });

      expect(merged).toMatchObject([{ count: 3, merged: true }]);
    });
  });
});
