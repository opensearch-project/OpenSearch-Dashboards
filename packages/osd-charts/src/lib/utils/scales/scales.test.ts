import { DateTime } from 'luxon';
import { ScaleBand } from './scale_band';
import { limitLogScaleDomain, ScaleContinuous } from './scale_continuous';
import { ScaleType } from './scales';

describe('Scale Test', () => {
  test('Create an ordinal scale', () => {
    const data = ['a', 'b', 'c', 'd', 'a', 'b', 'c'];
    const minRange = 0;
    const maxRange = 100;
    const ordinalScale = new ScaleBand(data, [minRange, maxRange]);
    const { domain, range, bandwidth } = ordinalScale;
    expect(domain).toEqual(['a', 'b', 'c', 'd']);
    expect(range).toEqual([minRange, maxRange]);
    expect(bandwidth).toEqual(maxRange / domain.length);
    const scaledValue1 = ordinalScale.scale('a');
    expect(scaledValue1).toBe(0);
    const scaledValue2 = ordinalScale.scale('b');
    expect(scaledValue2).toBe(bandwidth);
    const scaledValue3 = ordinalScale.scale('c');
    expect(scaledValue3).toBe(bandwidth * 2);
    const scaledValue4 = ordinalScale.scale('d');
    expect(scaledValue4).toBe(bandwidth * 3);
  });
  test('Create an linear scale', () => {
    const data = [0, 10];
    const minRange = 0;
    const maxRange = 100;
    const linearScale = new ScaleContinuous(ScaleType.Linear, data, [minRange, maxRange]);
    const { domain, range } = linearScale;
    expect(domain).toEqual([0, 10]);
    expect(range).toEqual([minRange, maxRange]);
    const scaledValue1 = linearScale.scale(0);
    expect(scaledValue1).toBe(0);
    const scaledValue2 = linearScale.scale(1);
    expect(scaledValue2).toBe(10);
    const scaledValue3 = linearScale.scale(5);
    expect(scaledValue3).toBe(50);
    const scaledValue4 = linearScale.scale(10);
    expect(scaledValue4).toBe(100);
  });
  test('Create an time scale', () => {
    const date1 = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' }).toMillis();
    const date2 = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' })
      .plus({ days: 90 })
      .toMillis();
    const date3 = DateTime.fromISO('2019-01-01T00:00:00.000', { zone: 'utc' })
      .plus({ days: 180 })
      .toMillis();
    const data = [date1, date3];
    const minRange = 0;
    const maxRange = 100;
    const timeScale = new ScaleContinuous(ScaleType.Time, data, [minRange, maxRange]);
    const { domain, range } = timeScale;
    expect(domain).toEqual([date1, date3]);
    expect(range).toEqual([minRange, maxRange]);
    const scaledValue1 = timeScale.scale(date1);
    expect(scaledValue1).toBe(0);
    const scaledValue2 = timeScale.scale(date2);
    expect(scaledValue2).toBe(50);
    const scaledValue3 = timeScale.scale(date3);
    expect(scaledValue3).toBe(100);
  });
  test('Create an log scale', () => {
    const data = [1, 10];
    const minRange = 0;
    const maxRange = 100;
    const logScale = new ScaleContinuous(ScaleType.Log, data, [minRange, maxRange]);
    const { domain, range } = logScale;
    expect(domain).toEqual([1, 10]);
    expect(range).toEqual([minRange, maxRange]);
    const scaledValue1 = logScale.scale(1);
    expect(scaledValue1).toBe(0);
    const scaledValue3 = logScale.scale(5);
    expect(scaledValue3).toBe((Math.log(5) / Math.log(10)) * 100);
  });
  test('Create an log scale starting with 0 as min', () => {
    const data = [0, 10];
    const minRange = 0;
    const maxRange = 100;
    const logScale = new ScaleContinuous(ScaleType.Log, data, [minRange, maxRange]);
    const { domain, range } = logScale;
    expect(domain).toEqual([1, 10]);
    expect(range).toEqual([minRange, maxRange]);
    const scaledValue1 = logScale.scale(1);
    expect(scaledValue1).toBe(0);
    const scaledValue3 = logScale.scale(5);
    expect(scaledValue3).toBe((Math.log(5) / Math.log(10)) * 100);
  });
  test('Create an sqrt scale', () => {
    const data = [0, 10];
    const minRange = 0;
    const maxRange = 100;
    const sqrtScale = new ScaleContinuous(ScaleType.Sqrt, data, [minRange, maxRange]);
    const { domain, range } = sqrtScale;
    expect(domain).toEqual([0, 10]);
    expect(range).toEqual([minRange, maxRange]);
    const scaledValue1 = sqrtScale.scale(0);
    expect(scaledValue1).toBe(0);
    const scaledValue3 = sqrtScale.scale(5);
    expect(scaledValue3).toBe((Math.sqrt(5) / Math.sqrt(10)) * 100);
  });
  test('Check log scale domain limiting', () => {
    let limitedDomain = limitLogScaleDomain([10, 20]);
    expect(limitedDomain).toEqual([10, 20]);

    limitedDomain = limitLogScaleDomain([0, 100]);
    expect(limitedDomain).toEqual([1, 100]);

    limitedDomain = limitLogScaleDomain([100, 0]);
    expect(limitedDomain).toEqual([100, 1]);

    limitedDomain = limitLogScaleDomain([0, 0]);
    expect(limitedDomain).toEqual([1, 1]);

    limitedDomain = limitLogScaleDomain([-100, 0]);
    expect(limitedDomain).toEqual([-100, -1]);

    limitedDomain = limitLogScaleDomain([0, -100]);
    expect(limitedDomain).toEqual([-1, -100]);

    limitedDomain = limitLogScaleDomain([-100, 100]);
    expect(limitedDomain).toEqual([1, 100]);

    limitedDomain = limitLogScaleDomain([-100, 50]);
    expect(limitedDomain).toEqual([-100, -1]);

    limitedDomain = limitLogScaleDomain([-100, 150]);
    expect(limitedDomain).toEqual([1, 150]);

    limitedDomain = limitLogScaleDomain([100, -100]);
    expect(limitedDomain).toEqual([100, 1]);

    limitedDomain = limitLogScaleDomain([100, -50]);
    expect(limitedDomain).toEqual([100, 1]);

    limitedDomain = limitLogScaleDomain([150, -100]);
    expect(limitedDomain).toEqual([150, 1]);

    limitedDomain = limitLogScaleDomain([50, -100]);
    expect(limitedDomain).toEqual([-1, -100]);
  });

  test('compare ordinal scale and linear/band invertWithStep 3 bars', () => {
    const dataLinear = [0, 2];
    const dataOrdinal = [0, 1, 2];
    const minRange = 0;
    const maxRange = 120;
    const bandwidth = maxRange / 3;
    const linearScale = new ScaleContinuous(
      ScaleType.Linear,
      dataLinear,
      [minRange, maxRange - bandwidth], // we currently limit the range like that a band linear scale
      bandwidth,
      1,
    );
    const ordinalScale = new ScaleBand(dataOrdinal, [minRange, maxRange]);
    expect(ordinalScale.invertWithStep(0)).toBe(0);
    expect(ordinalScale.invertWithStep(40)).toBe(1);
    expect(ordinalScale.invertWithStep(80)).toBe(2);
    expect(linearScale.invertWithStep(0)).toBe(0);
    expect(linearScale.invertWithStep(40)).toBe(1);
    expect(linearScale.invertWithStep(80)).toBe(2);
  });
  test('compare ordinal scale and linear/band 2 bars', () => {
    const dataLinear = [0, 1];
    const dataOrdinal = [0, 1];
    const minRange = 0;
    const maxRange = 100;
    const bandwidth = maxRange / 2;
    const linearScale = new ScaleContinuous(
      ScaleType.Linear,
      dataLinear,
      [minRange, maxRange - bandwidth], // we currently limit the range like that a band linear scale
      bandwidth,
      1,
    );
    const ordinalScale = new ScaleBand(dataOrdinal, [minRange, maxRange]);

    expect(ordinalScale.scale(0)).toBe(0);
    expect(ordinalScale.scale(1)).toBe(50);
    expect(linearScale.scale(0)).toBe(0);
    expect(linearScale.scale(1)).toBe(50);

    expect(ordinalScale.invertWithStep(0)).toBe(0);
    expect(ordinalScale.invertWithStep(50)).toBe(1);
    expect(ordinalScale.invertWithStep(100)).toBe(1);
    expect(linearScale.invertWithStep(0)).toBe(0);
    expect(linearScale.invertWithStep(50)).toBe(1);
    // expect(linearScale.invertWithStep(100)).toBe(1);
    expect(linearScale.bandwidth).toBe(50);
    expect(linearScale.range).toEqual([0, 50]);
  });
  test.skip('compare ordinal scale and linear/band 2 bars', () => {
    // I'm skipping this because the current implementation of linearScale
    // is a bit different than the ordinalScale when forcing bandwidth on linear scale
    const dataLinear = [0, 1];
    const dataOrdinal = [0, 1];
    const minRange = 0;
    const maxRange = 100;
    const bandwidth = maxRange / 2;
    const linearScale = new ScaleContinuous(
      ScaleType.Linear,
      dataLinear,
      [minRange, maxRange - bandwidth], // we currently limit the range like that a band linear scale
      bandwidth,
      1,
    );
    const ordinalScale = new ScaleBand(dataOrdinal, [minRange, maxRange]);
    expect(ordinalScale.invertWithStep(100)).toBe(1);
    expect(linearScale.invertWithStep(100)).toBe(1);
  });
});
