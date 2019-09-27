import { XDomain } from '../../chart_types/xy_chart/domains/x_domain';
import { computeXScale } from '../../chart_types/xy_chart/utils/scales';
import { Domain } from '../domain';
import { DateTime, Settings } from 'luxon';
import { ScaleBand } from './scale_band';
import { isLogarithmicScale, ScaleContinuous } from './scale_continuous';
import { ScaleType } from './scales';

describe('Scale Continuous', () => {
  test('shall invert on continuous scale linear', () => {
    const domain: Domain = [0, 2];
    const minRange = 0;
    const maxRange = 100;
    const scale = new ScaleContinuous({ type: ScaleType.Linear, domain, range: [minRange, maxRange] });
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
    const scale = new ScaleContinuous({ type: ScaleType.Time, domain, range: [minRange, maxRange] });
    expect(scale.invert(0)).toBe(startTime.toMillis());
    expect(scale.invert(50)).toBe(midTime.toMillis());
    expect(scale.invert(100)).toBe(endTime.toMillis());
  });
  test('check if a scale is log scale', () => {
    const domain: Domain = [0, 2];
    const range: [number, number] = [0, 100];
    const scaleLinear = new ScaleContinuous({ type: ScaleType.Linear, domain, range });
    const scaleLog = new ScaleContinuous({ type: ScaleType.Log, domain, range });
    const scaleTime = new ScaleContinuous({ type: ScaleType.Time, domain, range });
    const scaleSqrt = new ScaleContinuous({ type: ScaleType.Sqrt, domain, range });
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
    const scaleLinear = new ScaleContinuous({ type: ScaleType.Linear, domain, range });
    expect(scaleLinear.bandwidth).toBe(0);
    expect(scaleLinear.invertWithStep(0, data)).toEqual({ value: 0, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(0.1, data)).toEqual({ value: 0, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(0.4, data)).toEqual({ value: 0.5, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(0.5, data)).toEqual({ value: 0.5, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(0.6, data)).toEqual({ value: 0.5, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(0.7, data)).toEqual({ value: 0.8, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(0.8, data)).toEqual({ value: 0.8, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(0.9, data)).toEqual({ value: 0.8, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(2, data)).toEqual({ value: 2, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(1.7, data)).toEqual({ value: 2, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(0.8 + (2 - 0.8) / 2, data)).toEqual({ value: 0.8, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(0.8 + (2 - 0.8) / 2 - 0.01, data)).toEqual({ value: 0.8, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(0.8 + (2 - 0.8) / 2 + 0.01, data)).toEqual({ value: 2, withinBandwidth: true });
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

    const scaleLinear = computeXScale({ xDomain, totalBarsInCluster: 1, range: [0, 119], barsPadding: 0 });
    expect(scaleLinear.bandwidth).toBe(119 / 3);
    expect(scaleLinear.invertWithStep(0, data)).toEqual({ value: 0, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(40, data)).toEqual({ value: 1, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(41, data)).toEqual({ value: 1, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(79, data)).toEqual({ value: 1, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(80, data)).toEqual({ value: 2, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(81, data)).toEqual({ value: 2, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(120, data)).toEqual({ value: 3, withinBandwidth: false });
  });
  test('can get the right x value on linear scale with regular band 1', () => {
    const domain = [0, 100];
    const data = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

    // we tweak the maxRange removing the bandwidth to correctly compute
    // a band linear scale in computeXScale
    const range: [number, number] = [0, 100 - 10];
    const scaleLinear = new ScaleContinuous(
      { type: ScaleType.Linear, domain, range },
      { bandwidth: 10, minInterval: 10 },
    );
    expect(scaleLinear.bandwidth).toBe(10);
    expect(scaleLinear.invertWithStep(0, data)).toEqual({ value: 0, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(10, data)).toEqual({ value: 10, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(20, data)).toEqual({ value: 20, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(90, data)).toEqual({ value: 90, withinBandwidth: true });
  });
  test('can get the right x value on linear scale with band', () => {
    const data = [0, 10, 20, 50, 90];

    const xDomain: XDomain = {
      domain: [0, 100],
      isBandScale: true,
      minInterval: 10,
      scaleType: ScaleType.Linear,
      type: 'xDomain',
    };
    // we tweak the maxRange removing the bandwidth to correctly compute
    // a band linear scale in computeXScale
    const scaleLinear = computeXScale({ xDomain, totalBarsInCluster: 1, range: [0, 109], barsPadding: 0 });
    expect(scaleLinear.bandwidth).toBe(109 / 11);

    expect(scaleLinear.invertWithStep(0, data)).toEqual({ value: 0, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(9, data)).toEqual({ value: 0, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(10, data)).toEqual({ value: 10, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(19, data)).toEqual({ value: 10, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(20, data)).toEqual({ value: 20, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(29, data)).toEqual({ value: 20, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(30, data)).toEqual({ value: 30, withinBandwidth: false });
    expect(scaleLinear.invertWithStep(39, data)).toEqual({ value: 30, withinBandwidth: false });

    expect(scaleLinear.invertWithStep(40, data)).toEqual({ value: 40, withinBandwidth: false });

    expect(scaleLinear.invertWithStep(50, data)).toEqual({ value: 50, withinBandwidth: true });
    expect(scaleLinear.invertWithStep(59, data)).toEqual({ value: 50, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(60, data)).toEqual({ value: 60, withinBandwidth: false });

    expect(scaleLinear.invertWithStep(90, data)).toEqual({ value: 90, withinBandwidth: true });

    expect(scaleLinear.invertWithStep(100, data)).toEqual({ value: 100, withinBandwidth: false });
  });

  describe('isSingleValue', () => {
    test('should return true for domain with fewer than 2 values', () => {
      const scale = new ScaleContinuous({ type: ScaleType.Linear, domain: [], range: [0, 100] });
      expect(scale.isSingleValue()).toBe(true);
    });
    test('should return true for domain with equal min and max values', () => {
      const scale = new ScaleContinuous({ type: ScaleType.Linear, domain: [1, 1], range: [0, 100] });
      expect(scale.isSingleValue()).toBe(true);
    });
    test('should return false for domain with differing min and max values', () => {
      const scale = new ScaleContinuous({ type: ScaleType.Linear, domain: [1, 2], range: [0, 100] });
      expect(scale.isSingleValue()).toBe(false);
    });
  });

  describe('xScale values with minInterval and bandwidth', () => {
    const domain = [7.053400039672852, 1070.1354763603908];

    it('should return nice ticks when minInterval & bandwidth are 0', () => {
      const scale = new ScaleContinuous(
        {
          type: ScaleType.Linear,
          domain,
          range: [0, 100],
        },
        { minInterval: 0, bandwidth: 0 },
      );
      expect(scale.ticks()).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]);
    });
  });

  describe('time ticks', () => {
    const timezonesToTest = ['Asia/Tokyo', 'Europe/Berlin', 'UTC', 'America/New_York', 'America/Los_Angeles'];

    function getTicksForDomain(domainStart: number, domainEnd: number) {
      const scale = new ScaleContinuous(
        { type: ScaleType.Time, domain: [domainStart, domainEnd], range: [0, 100] },
        { bandwidth: 0, minInterval: 0, timeZone: Settings.defaultZoneName },
      );
      return scale.tickValues;
    }

    const currentTz = Settings.defaultZoneName;

    afterEach(() => {
      Settings.defaultZoneName = currentTz;
    });

    timezonesToTest.map((tz) => {
      describe(`standard tests in ${tz}`, () => {
        beforeEach(() => {
          Settings.defaultZoneName = tz;
        });

        test('should return nice daily ticks', () => {
          const ticks = getTicksForDomain(
            DateTime.fromISO('2019-04-04T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-08T00:00:00.000').toMillis(),
          );

          expect(ticks).toEqual([
            DateTime.fromISO('2019-04-04T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T12:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-05T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-05T12:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-06T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-06T12:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-07T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-07T12:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-08T00:00:00.000').toMillis(),
          ]);
        });

        test('should return nice hourly ticks', () => {
          const ticks = getTicksForDomain(
            DateTime.fromISO('2019-04-04T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T08:00:00.000').toMillis(),
          );

          expect(ticks).toEqual([
            DateTime.fromISO('2019-04-04T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T01:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T02:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T03:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T04:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T05:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T06:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T07:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T08:00:00.000').toMillis(),
          ]);
        });

        test('should return nice yearly ticks', () => {
          const ticks = getTicksForDomain(
            DateTime.fromISO('2010-04-04T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-04-04T04:00:00.000').toMillis(),
          );

          expect(ticks).toEqual([
            DateTime.fromISO('2011-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2012-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2013-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2014-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2015-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2016-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2017-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2018-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-01-01T00:00:00.000').toMillis(),
          ]);
        });

        test('should return nice yearly ticks from leap year to leap year', () => {
          const ticks = getTicksForDomain(
            DateTime.fromISO('2016-02-29T00:00:00.000').toMillis(),
            DateTime.fromISO('2024-04-29T00:00:00.000').toMillis(),
          );

          expect(ticks).toEqual([
            DateTime.fromISO('2017-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2018-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2019-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2020-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2021-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2022-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2023-01-01T00:00:00.000').toMillis(),
            DateTime.fromISO('2024-01-01T00:00:00.000').toMillis(),
          ]);
        });
      });
    });

    describe('dst switch', () => {
      test('should not leave gaps in hourly ticks on dst switch winter to summer time', () => {
        Settings.defaultZoneName = 'Europe/Berlin';

        const ticks = getTicksForDomain(
          DateTime.fromISO('2019-03-31T01:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T10:00:00.000').toMillis(),
        );

        expect(ticks).toEqual([
          DateTime.fromISO('2019-03-31T01:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T02:00:00.000').toMillis(),
          // 3 AM is missing because it is the same as 2 AM
          DateTime.fromISO('2019-03-31T04:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T05:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T06:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T07:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T08:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T09:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T10:00:00.000').toMillis(),
        ]);
      });

      test('should not leave gaps in hourly ticks on dst switch summer to winter time', () => {
        Settings.defaultZoneName = 'Europe/Berlin';

        const ticks = getTicksForDomain(
          DateTime.fromISO('2019-10-27T01:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T09:00:00.000').toMillis(),
        );

        expect(ticks).toEqual([
          DateTime.fromISO('2019-10-27T01:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T02:00:00.000').toMillis(),
          // this is the "first" 3 o'clock still in summer time
          DateTime.fromISO('2019-10-27T03:00:00.000+02:00').toMillis(),
          DateTime.fromISO('2019-10-27T03:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T04:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T05:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T06:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T07:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T08:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T09:00:00.000').toMillis(),
        ]);
      });

      test('should set nice daily ticks on dst switch summer to winter time', () => {
        Settings.defaultZoneName = 'Europe/Berlin';

        const ticks = getTicksForDomain(
          DateTime.fromISO('2019-10-25T16:00:00.000').toMillis(),
          DateTime.fromISO('2019-11-03T08:00:00.000').toMillis(),
        );

        expect(ticks).toEqual([
          DateTime.fromISO('2019-10-26T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-27T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-28T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-29T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-30T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-31T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-11-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-11-02T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-11-03T00:00:00.000').toMillis(),
        ]);
      });

      test('should set nice daily ticks on dst switch winter to summer time', () => {
        Settings.defaultZoneName = 'Europe/Berlin';

        const ticks = getTicksForDomain(
          DateTime.fromISO('2019-03-29T16:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-07T08:00:00.000').toMillis(),
        );

        expect(ticks).toEqual([
          DateTime.fromISO('2019-03-30T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-02T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-03T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-04T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-05T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-06T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-04-07T00:00:00.000').toMillis(),
        ]);
      });

      test('should set nice monthly ticks on two dst switches from winter to winter time', () => {
        Settings.defaultZoneName = 'Europe/Berlin';

        const ticks = getTicksForDomain(
          DateTime.fromISO('2019-03-29T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-11-02T00:00:00.000').toMillis(),
        );

        expect(ticks).toEqual([
          DateTime.fromISO('2019-04-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-05-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-06-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-07-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-08-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-09-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-10-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-11-01T00:00:00.000').toMillis(),
        ]);
      });

      test('should set nice monthly ticks on two dst switches from summer to summer time', () => {
        Settings.defaultZoneName = 'Europe/Berlin';

        const ticks = getTicksForDomain(
          DateTime.fromISO('2018-10-26T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-31T20:00:00.000').toMillis(),
        );

        expect(ticks).toEqual([
          DateTime.fromISO('2018-11-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2018-12-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-01-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-02-01T00:00:00.000').toMillis(),
          DateTime.fromISO('2019-03-01T00:00:00.000').toMillis(),
        ]);
      });
    });
  });
});
