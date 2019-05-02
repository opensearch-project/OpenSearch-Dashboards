import { DateTime } from 'luxon';
import { XDomain } from '../../series/domains/x_domain';
import { computeXScale } from '../../series/scales';
import { Domain } from '../domain';
import { ScaleBand } from './scale_band';
import { isLogarithmicScale, ScaleContinuous } from './scale_continuous';
import { ScaleType } from './scales';

describe('Scale Continuous', () => {
  test('shall invert on continuous scale linear', () => {
    const domain: Domain = [0, 2];
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
    const domain: Domain = [0, 2];
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
  test('can get the right x value on linear scale', () => {
    const domain: Domain = [0, 2];
    const data = [0, 0.5, 0.8, 2];
    const range: [number, number] = [0, 2];
    const scaleLinear = new ScaleContinuous(ScaleType.Linear, domain, range);
    expect(scaleLinear.bandwidth).toBe(0);
    expect(scaleLinear.invertWithStep(0, data)).toBe(0);
    expect(scaleLinear.invertWithStep(0.1, data)).toBe(0);

    expect(scaleLinear.invertWithStep(0.4, data)).toBe(0.5);
    expect(scaleLinear.invertWithStep(0.5, data)).toBe(0.5);
    expect(scaleLinear.invertWithStep(0.6, data)).toBe(0.5);

    expect(scaleLinear.invertWithStep(0.7, data)).toBe(0.8);
    expect(scaleLinear.invertWithStep(0.8, data)).toBe(0.8);
    expect(scaleLinear.invertWithStep(0.9, data)).toBe(0.8);

    expect(scaleLinear.invertWithStep(2, data)).toBe(2);

    expect(scaleLinear.invertWithStep(1.7, data)).toBe(2);

    expect(scaleLinear.invertWithStep(0.8 + (2 - 0.8) / 2, data)).toBe(0.8);
    expect(scaleLinear.invertWithStep(0.8 + (2 - 0.8) / 2 - 0.01, data)).toBe(0.8);

    expect(scaleLinear.invertWithStep(0.8 + (2 - 0.8) / 2 + 0.01, data)).toBe(2);
  });
  test('invert with step x value on linear band scale', () => {
    const data = [0, 1, 2];
    const xDomain: XDomain = {
      domain: [0, 2],
      isBandScale: true,
      minInterval: 1,
      scaleType: ScaleType.Linear,
      type: 'xDomain',
    };

    const scaleLinear = computeXScale(xDomain, 1, 0, 120, 0);
    expect(scaleLinear.bandwidth).toBe(40);
    expect(scaleLinear.invertWithStep(0, data)).toBe(0);
    expect(scaleLinear.invertWithStep(40, data)).toBe(1);

    expect(scaleLinear.invertWithStep(41, data)).toBe(1);
    expect(scaleLinear.invertWithStep(79, data)).toBe(1);

    expect(scaleLinear.invertWithStep(80, data)).toBe(2);
    expect(scaleLinear.invertWithStep(81, data)).toBe(2);
    expect(scaleLinear.invertWithStep(120, data)).toBe(2);
  });
  test('can get the right x value on linear scale with regular band 1', () => {
    const domain = [0, 100];
    const data = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

    // we tweak the maxRange removing the bandwidth to correctly compute
    // a band linear scale in computeXScale
    const range: [number, number] = [0, 100 - 10];
    const scaleLinear = new ScaleContinuous(ScaleType.Linear, domain, range, 10, 10);
    expect(scaleLinear.bandwidth).toBe(10);
    expect(scaleLinear.invertWithStep(0, data)).toBe(0);
    expect(scaleLinear.invertWithStep(10, data)).toBe(10);
    expect(scaleLinear.invertWithStep(20, data)).toBe(20);
    expect(scaleLinear.invertWithStep(90, data)).toBe(90);
  });
  test('can get the right x value on linear scale with band', () => {
    const data = [0, 10, 20, 50, 90];
    // we tweak the maxRange removing the bandwidth to correctly compute
    // a band linear scale in computeXScale

    const xDomain: XDomain = {
      domain: [0, 100],
      isBandScale: true,
      minInterval: 10,
      scaleType: ScaleType.Linear,
      type: 'xDomain',
    };

    const scaleLinear = computeXScale(xDomain, 1, 0, 110, 0);
    // const scaleLinear = new ScaleContinuous(ScaleType.Linear, domain, range, 10, 10);
    expect(scaleLinear.bandwidth).toBe(10);

    expect(scaleLinear.invertWithStep(0, data)).toBe(0);
    expect(scaleLinear.invertWithStep(5, data)).toBe(0);
    expect(scaleLinear.invertWithStep(9, data)).toBe(0);

    expect(scaleLinear.invertWithStep(10, data)).toBe(10);
    expect(scaleLinear.invertWithStep(11, data)).toBe(10);
    expect(scaleLinear.invertWithStep(19, data)).toBe(10);

    expect(scaleLinear.invertWithStep(20, data)).toBe(20);
    expect(scaleLinear.invertWithStep(21, data)).toBe(20);
    expect(scaleLinear.invertWithStep(25, data)).toBe(20);
    expect(scaleLinear.invertWithStep(29, data)).toBe(20);
    expect(scaleLinear.invertWithStep(30, data)).toBe(20);
    expect(scaleLinear.invertWithStep(39, data)).toBe(20);
    expect(scaleLinear.invertWithStep(40, data)).toBe(50);
    expect(scaleLinear.invertWithStep(50, data)).toBe(50);
    expect(scaleLinear.invertWithStep(90, data)).toBe(90);
  });
});
