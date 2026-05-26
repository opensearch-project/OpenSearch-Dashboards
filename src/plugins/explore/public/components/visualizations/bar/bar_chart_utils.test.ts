/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { inferTimeIntervals } from './bar_chart_utils';
import { TimeUnit } from '../types';

describe('bar_chart_utils', () => {
  describe('inferTimeIntervals', () => {
    it('returns DATE for empty data', () => {
      expect(inferTimeIntervals([], 'date')).toBe(TimeUnit.DATE);
    });

    it('returns YEAR for large intervals', () => {
      const data = [{ date: '2020-01-01' }, { date: '2023-01-01' }];
      expect(inferTimeIntervals(data, 'date')).toBe(TimeUnit.YEAR);
    });

    it('returns SECOND for small intervals', () => {
      const now = Date.now();
      const data = [{ date: new Date(now) }, { date: new Date(now + 1000) }];
      expect(inferTimeIntervals(data, 'date')).toBe(TimeUnit.SECOND);
    });
  });
});
