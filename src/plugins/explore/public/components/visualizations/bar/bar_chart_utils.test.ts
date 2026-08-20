/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildBarRadius, buildValueLabel, inferTimeIntervals } from './bar_chart_utils';
import { TimeUnit } from '../types';
import { BarChartStyle } from './bar_vis_config';

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

  describe('buildBarRadius', () => {
    const unstacked = { isStacked: false, isTopSegment: true };

    it('returns no radius by default', () => {
      expect(buildBarRadius({ seriesEncode: 'y', ...unstacked })).toEqual({});
      expect(buildBarRadius({ barRadius: 0, seriesEncode: 'y', ...unstacked })).toEqual({});
    });

    it('rounds the top corners of vertical bars', () => {
      expect(buildBarRadius({ barRadius: 8, seriesEncode: 'y', ...unstacked })).toEqual({
        borderRadius: [8, 8, 0, 0],
      });
    });

    it('rounds the right corners of horizontal bars', () => {
      expect(buildBarRadius({ barRadius: 8, seriesEncode: 'x', ...unstacked })).toEqual({
        borderRadius: [0, 8, 8, 0],
      });
    });

    it('only rounds the topmost segment when stacked', () => {
      expect(
        buildBarRadius({ barRadius: 8, seriesEncode: 'y', isStacked: true, isTopSegment: false })
      ).toEqual({});
      expect(
        buildBarRadius({ barRadius: 8, seriesEncode: 'y', isStacked: true, isTopSegment: true })
      ).toEqual({ borderRadius: [8, 8, 0, 0] });
    });
  });

  describe('buildValueLabel', () => {
    const styles = (overrides: Partial<BarChartStyle>) =>
      ({ showValues: true, ...overrides }) as BarChartStyle;

    it('returns nothing when showValues is off', () => {
      expect(
        buildValueLabel({
          styles: { showValues: false } as unknown as BarChartStyle,
          seriesField: 'count',
          headers: ['category', 'count'],
        })
      ).toEqual({});
    });

    it('formats the value of its own column', () => {
      const { label } = buildValueLabel({
        styles: styles({}),
        seriesField: 'count',
        headers: ['category', 'count'],
      }) as any;

      expect(label.show).toBe(true);
      expect(label.position).toBe('inside');
      expect(label.formatter({ value: ['a', 12.345] })).toBe('12.35');
    });

    it('adds a percent unit when stacking to 100%', () => {
      const { label } = buildValueLabel({
        styles: styles({ stackMode: 'percentage' }),
        seriesField: 'count',
        headers: ['category', 'count'],
      }) as any;

      expect(label.formatter({ value: ['a', 0.23456] })).toBe('23.46%');
    });
  });
});
