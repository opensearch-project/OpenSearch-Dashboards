import { DateTime } from 'luxon';
import { ScaleBand } from './scale_band';
import { isLogarithmicScale, ScaleContinuous } from './scale_continuous';
import { ScaleType } from './scales';

describe('Scale Continuous', () => {
  test('shall invert on continuous scale linear', () => {
    const domain = [0, 2];
    const minRange = 0;
    const maxRange = 100;
    const scale = new ScaleContinuous(ScaleType.Linear, domain, [minRange, maxRange]);
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
    const scale = new ScaleContinuous(ScaleType.Time, domain, [minRange, maxRange]);
    expect(scale.invert(0)).toBe(startTime.toMillis());
    expect(scale.invert(50)).toBe(midTime.toMillis());
    expect(scale.invert(100)).toBe(endTime.toMillis());
  });
  test('check if a scale is log scale', () => {
    const domain = [0, 2];
    const range: [number, number] = [0, 100];
    const scaleLinear = new ScaleContinuous(ScaleType.Linear, domain, range);
    const scaleLog = new ScaleContinuous(ScaleType.Log, domain, range);
    const scaleTime = new ScaleContinuous(ScaleType.Time, domain, range);
    const scaleSqrt = new ScaleContinuous(ScaleType.Sqrt, domain, range);
    const scaleBand = new ScaleBand(domain, range);
    expect(isLogarithmicScale(scaleLinear)).toBe(false);
    expect(isLogarithmicScale(scaleLog)).toBe(true);
    expect(isLogarithmicScale(scaleTime)).toBe(false);
    expect(isLogarithmicScale(scaleSqrt)).toBe(false);
    expect(isLogarithmicScale(scaleBand)).toBe(false);
  });
});
