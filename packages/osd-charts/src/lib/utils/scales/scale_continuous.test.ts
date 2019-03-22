import { DateTime } from 'luxon';
import { ScaleContinuous } from './scale_continuous';
import { ScaleType } from './scales';

describe.only('Scale Continuous', () => {
  /**
   * These tests cover the following cases:
   * line/area with simple linear scale
   * line/area chart with time scale (ac: w axis)
   * barscale with linear scale (bc: with linear x axis)
   * barscale with time scale (bc: with time x axis)
   * bar + line with linear scale (mc: bar and lines)
   * bar + line with time scale (missing story)
   * bar clustered with time scale (bc: time clustered using various specs)
   * bar clustered with linear scale (bc: clustered multiple series specs)
   */
  test('shall invert on continuous scale linear', () => {
    const domain = [0, 2];
    const minRange = 0;
    const maxRange = 100;
    const scale = new ScaleContinuous(domain, [minRange, maxRange], ScaleType.Linear);
    expect(scale.invert(0)).toBe(0);
    expect(scale.invert(50)).toBe(1);
    expect(scale.invert(100)).toBe(2);
  });
  test('shall invert on continuous scale time', () => {
    const startTime = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' });
    const midTime = DateTime.fromISO('2019-01-02T00:00:00.000', { zone: 'utc' });
    const endTime = DateTime.fromISO('2019-01-03T00:00:00.000', { zone: 'utc' });
    const domain = [startTime.toMillis(), endTime.toMillis()];
    const minRange = 0;
    const maxRange = 100;
    const scale = new ScaleContinuous(domain, [minRange, maxRange], ScaleType.Time);
    expect(scale.invert(0)).toBe(startTime.toMillis());
    expect(scale.invert(50)).toBe(midTime.toMillis());
    expect(scale.invert(100)).toBe(endTime.toMillis());
  });
});
