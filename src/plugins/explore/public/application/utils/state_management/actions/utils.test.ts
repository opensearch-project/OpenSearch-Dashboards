/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { fillMissingTimestamps } from './utils';

describe('fillMissingTimestamps', () => {
  describe('basic functionality', () => {
    it('should fill missing timestamps with zeros', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [
        [baseTime.valueOf(), 5],
        [baseTime.clone().add(2, 'hours').valueOf(), 3],
      ]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(3);
      expect(seriesA[0][1]).toBe(5); // 10:00 - original value
      expect(seriesA[1][1]).toBe(0); // 11:00 - filled with 0
      expect(seriesA[2][1]).toBe(3); // 12:00 - original value
    });

    it('should include start and end timestamps', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const middleTime = moment('2024-01-01 12:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[middleTime.valueOf(), 10]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000', // Start at 10:00
        '2024-01-01 14:00:00.000' // End at 14:00
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(5); // 10:00, 11:00, 12:00, 13:00, 14:00 (inclusive)

      const startTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS').valueOf();
      expect(seriesA[0][0]).toBe(startTime);
      expect(seriesA[0][1]).toBe(0);

      const endTime = moment('2024-01-01 14:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS').valueOf();
      expect(seriesA[4][0]).toBe(endTime);
      expect(seriesA[4][1]).toBe(0);
    });
  });

  describe('multiple series', () => {
    it('should handle multiple series with different gaps', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      // Series A: has 10:00 and 12:00
      seriesMap.set('series-a', [
        [baseTime.valueOf(), 5],
        [baseTime.clone().add(2, 'hours').valueOf(), 3],
      ]);

      // Series B: has only 11:00
      seriesMap.set('series-b', [[baseTime.clone().add(1, 'hour').valueOf(), 7]]);

      // Series C: has 10:00, 11:00, 12:00
      seriesMap.set('series-c', [
        [baseTime.valueOf(), 2],
        [baseTime.clone().add(1, 'hour').valueOf(), 4],
        [baseTime.clone().add(2, 'hours').valueOf(), 6],
      ]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      // All series should have the same length and timestamps
      expect(result.get('series-a')).toHaveLength(3);
      expect(result.get('series-b')).toHaveLength(3);
      expect(result.get('series-c')).toHaveLength(3);

      // Verify each series has correct timestamps
      const timestamps = result.get('series-a')!.map(([ts]) => ts);
      expect(result.get('series-b')!.map(([ts]) => ts)).toEqual(timestamps);
      expect(result.get('series-c')!.map(([ts]) => ts)).toEqual(timestamps);

      // Verify values
      expect(result.get('series-a')!.map(([, count]) => count)).toEqual([5, 0, 3]);
      expect(result.get('series-b')!.map(([, count]) => count)).toEqual([0, 7, 0]);
      expect(result.get('series-c')!.map(([, count]) => count)).toEqual([2, 4, 6]);
    });
  });

  describe('different intervals', () => {
    it('should handle 5 minute intervals', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[baseTime.valueOf(), 10]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '5m',
        '2024-01-01 10:00:00.000',
        '2024-01-01 10:20:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(5); // 10:00, 10:05, 10:10, 10:15, 10:20
    });

    it('should handle 30 minute intervals', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[baseTime.valueOf(), 10]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '30m',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(5); // 10:00, 10:30, 11:00, 11:30, 12:00
    });

    it('should handle 2 hour intervals', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[baseTime.valueOf(), 10]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '2h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 16:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(4); // 10:00, 12:00, 14:00, 16:00
    });

    it('should handle 1 day intervals', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 00:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[baseTime.valueOf(), 10]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1d',
        '2024-01-01 00:00:00.000',
        '2024-01-03 00:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(3); // Jan 1, Jan 2, Jan 3
    });
  });

  describe('edge cases', () => {
    it('should not modify series that already has all timestamps', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      const completeData: Array<[number, number]> = [
        [baseTime.valueOf(), 5],
        [baseTime.clone().add(1, 'hour').valueOf(), 3],
        [baseTime.clone().add(2, 'hours').valueOf(), 7],
      ];

      seriesMap.set('series-a', [...completeData]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(3);
      expect(seriesA.map(([, count]) => count)).toEqual([5, 3, 7]);
    });

    it('should handle empty seriesMap', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      expect(result.size).toBe(0);
    });

    it('should handle single data point in middle of range', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const middleTime = moment('2024-01-01 12:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[middleTime.valueOf(), 42]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 14:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA).toHaveLength(5);
      expect(seriesA[0][1]).toBe(0); // 10:00 - filled
      expect(seriesA[1][1]).toBe(0); // 11:00 - filled
      expect(seriesA[2][1]).toBe(42); // 12:00 - original
      expect(seriesA[3][1]).toBe(0); // 13:00 - filled
      expect(seriesA[4][1]).toBe(0); // 14:00 - filled
    });

    it('should preserve existing counts exactly', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      const originalCounts = [100, 200, 300];
      seriesMap.set('series-a', [
        [baseTime.valueOf(), originalCounts[0]],
        [baseTime.clone().add(1, 'hour').valueOf(), originalCounts[1]],
        [baseTime.clone().add(2, 'hours').valueOf(), originalCounts[2]],
      ]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      const resultCounts = seriesA.map(([, count]) => count);
      expect(resultCounts).toEqual(originalCounts);
    });

    it('should handle unsorted timestamps and sort output', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [
        [baseTime.clone().add(2, 'hours').valueOf(), 3],
        [baseTime.valueOf(), 5],
        [baseTime.clone().add(1, 'hour').valueOf(), 7],
      ]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      const seriesA = result.get('series-a')!;
      expect(seriesA[0][0]).toBeLessThan(seriesA[1][0]);
      expect(seriesA[1][0]).toBeLessThan(seriesA[2][0]);

      expect(seriesA[0][1]).toBe(5); // 10:00
      expect(seriesA[1][1]).toBe(7); // 11:00
      expect(seriesA[2][1]).toBe(3); // 12:00
    });
  });

  describe('return value integrity', () => {
    it('should return a new Map instance', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      seriesMap.set('series-a', [[baseTime.valueOf(), 5]]);

      const result = fillMissingTimestamps(
        seriesMap,
        '1h',
        '2024-01-01 10:00:00.000',
        '2024-01-01 12:00:00.000'
      );

      expect(result).not.toBe(seriesMap);
    });

    it('should not mutate the original seriesMap', () => {
      const seriesMap = new Map<string, Array<[number, number]>>();
      const baseTime = moment('2024-01-01 10:00:00.000', 'YYYY-MM-DD HH:mm:ss.SSS');

      const originalData: Array<[number, number]> = [[baseTime.valueOf(), 5]];
      seriesMap.set('series-a', [...originalData]);

      const originalSize = seriesMap.get('series-a')!.length;

      fillMissingTimestamps(seriesMap, '1h', '2024-01-01 10:00:00.000', '2024-01-01 12:00:00.000');

      expect(seriesMap.get('series-a')!.length).toBe(originalSize);
    });
  });
});
