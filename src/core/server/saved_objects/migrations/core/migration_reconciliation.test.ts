/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import {
  anyTypeExceedsThresholds,
  computePerTypeDeltas,
  MigrationIntegrityConfig,
  sumCounts,
} from './migration_reconciliation';

const cfg: Pick<
  MigrationIntegrityConfig,
  'failOnAbsoluteDeltaPerType' | 'failOnDeltaPercentPerType'
> = {
  failOnAbsoluteDeltaPerType: 10,
  failOnDeltaPercentPerType: 5,
};

describe('migration_reconciliation', () => {
  describe('computePerTypeDeltas', () => {
    it('computes deltas for each source type', () => {
      const source = new Map([
        ['index-pattern', 82],
        ['config', 1],
      ]);
      const dest = new Map([
        ['index-pattern', 9],
        ['config', 1],
      ]);
      expect(computePerTypeDeltas(source, dest)).toEqual([
        {
          type: 'index-pattern',
          sourceCount: 82,
          destCount: 9,
          delta: 73,
          deltaPercent: (73 / 82) * 100,
        },
        { type: 'config', sourceCount: 1, destCount: 1, delta: 0, deltaPercent: 0 },
      ]);
    });

    it('treats missing types in dest as destCount=0', () => {
      const source = new Map([['foo', 5]]);
      const dest = new Map();
      expect(computePerTypeDeltas(source, dest)).toEqual([
        { type: 'foo', sourceCount: 5, destCount: 0, delta: 5, deltaPercent: 100 },
      ]);
    });

    it('does not report dest-only types', () => {
      const source = new Map([['a', 3]]);
      const dest = new Map([
        ['a', 3],
        ['b', 99], // extra type in dest — legal, not our concern
      ]);
      const deltas = computePerTypeDeltas(source, dest);
      expect(deltas.map((d) => d.type)).toEqual(['a']);
    });

    it('handles sourceCount=0 without divide-by-zero', () => {
      const source = new Map([['empty', 0]]);
      const dest = new Map([['empty', 0]]);
      expect(computePerTypeDeltas(source, dest)).toEqual([
        { type: 'empty', sourceCount: 0, destCount: 0, delta: 0, deltaPercent: 0 },
      ]);
    });
  });

  describe('anyTypeExceedsThresholds', () => {
    it('returns null when all deltas are under both thresholds', () => {
      const deltas = [{ type: 't', sourceCount: 100, destCount: 99, delta: 1, deltaPercent: 1 }];
      expect(anyTypeExceedsThresholds(deltas, cfg)).toBeNull();
    });

    it('returns null when only absolute threshold is exceeded (tiny pct)', () => {
      // 15 absolute, 0.15% — over absolute (10) but under percent (5%).
      const deltas = [
        { type: 't', sourceCount: 10000, destCount: 9985, delta: 15, deltaPercent: 0.15 },
      ];
      expect(anyTypeExceedsThresholds(deltas, cfg)).toBeNull();
    });

    it('returns null when only percent threshold is exceeded (tiny absolute)', () => {
      // 1 of 3 missing = 33% but only 1 absolute.
      const deltas = [
        { type: 't', sourceCount: 3, destCount: 2, delta: 1, deltaPercent: (1 / 3) * 100 },
      ];
      expect(anyTypeExceedsThresholds(deltas, cfg)).toBeNull();
    });

    it('returns the failing delta when BOTH thresholds are exceeded', () => {
      // 73 of 82 missing = 89%.
      const deltas = [
        {
          type: 'index-pattern',
          sourceCount: 82,
          destCount: 9,
          delta: 73,
          deltaPercent: (73 / 82) * 100,
        },
      ];
      const failing = anyTypeExceedsThresholds(deltas, cfg);
      expect(failing).not.toBeNull();
      expect(failing!.type).toBe('index-pattern');
      expect(failing!.delta).toBe(73);
    });

    it('returns the first failing type when multiple types fail', () => {
      const deltas = [
        { type: 'a', sourceCount: 100, destCount: 10, delta: 90, deltaPercent: 90 },
        { type: 'b', sourceCount: 200, destCount: 20, delta: 180, deltaPercent: 90 },
      ];
      expect(anyTypeExceedsThresholds(deltas, cfg)!.type).toBe('a');
    });

    it('does not fire on a type with zero source docs (deltaPercent=0)', () => {
      const deltas = [{ type: 't', sourceCount: 0, destCount: 0, delta: 0, deltaPercent: 0 }];
      expect(anyTypeExceedsThresholds(deltas, cfg)).toBeNull();
    });
  });

  describe('sumCounts', () => {
    it('sums all values in the map', () => {
      expect(
        sumCounts(
          new Map([
            ['a', 3],
            ['b', 7],
          ])
        )
      ).toBe(10);
    });

    it('returns 0 on empty map', () => {
      expect(sumCounts(new Map())).toBe(0);
    });
  });
});
