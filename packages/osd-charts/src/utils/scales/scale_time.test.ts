import { DateTime } from 'luxon';
import { ScaleContinuous } from './scale_continuous';
import { ScaleType } from './scales';

describe('[Scale Time] - timezones', () => {
  describe('timezone checks', () => {
    // these tests are only for have a better understanding on how to deal with
    // timezones, isos and formattings
    test('[UTC] check equity of luxon and js Date', () => {
      const DATE_STRING = '2019-01-01T00:00:00.000Z';
      const dateA = DateTime.fromISO(DATE_STRING, { setZone: true });
      const dateAInLocalTime = DateTime.fromISO(DATE_STRING, { setZone: false });
      const dateB = new Date(DATE_STRING);
      expect(dateA.toMillis()).toBe(dateB.getTime());
      expect(dateA.zone.name).toBe('UTC');
      expect(dateA.toISO()).toEqual(DATE_STRING);
      expect(dateB.toISOString()).toEqual(DATE_STRING);
      expect(dateA.toISO()).toEqual(dateB.toISOString());
      // only valid if current timezone is +1
      // expect(dateAInLocalTime.toISO()).toEqual('2019-01-01T01:00:00.000+01:00');
      // if the date is already UTC, doesn't matter if you convert it to utc
      expect(dateA.toUTC().toISO()).toEqual(DATE_STRING);
      expect(dateB.toISOString()).toEqual(DATE_STRING);
      expect(dateB.toISOString()).toEqual(dateA.toUTC().toISO());
      expect(dateB.toISOString()).toEqual(dateAInLocalTime.toUTC().toISO());
    });
    test('[with timezone] check equity of luxon and js Date', () => {
      const DATE_STRING = '2019-01-01T00:00:00.000+05:00';
      const dateA = DateTime.fromISO(DATE_STRING, { setZone: true });
      const dateAInLocalTime = DateTime.fromISO(DATE_STRING, { setZone: false });
      const dateB = new Date(DATE_STRING);
      expect(dateA.toMillis()).toBe(dateB.getTime());
      expect(dateAInLocalTime.toMillis()).toBe(dateB.getTime());
      expect(dateA.zone.name).toBe('UTC+5');
      // setting the setZone to true, the outputted ISO will keep the timezone
      expect(dateA.toISO()).toEqual(DATE_STRING);
      // js date toISOString is always in UTC
      expect(dateB.toISOString()).toEqual('2018-12-31T19:00:00.000Z');
      // if we need the UTC version of the date, just call toUtC()
      expect(dateB.toISOString()).toEqual(dateA.toUTC().toISO());
      expect(dateB.toISOString()).toEqual(dateAInLocalTime.toUTC().toISO());
      // moving everything to UTC is locale independent
      expect(dateA.toUTC().toISO()).toEqual(dateAInLocalTime.toUTC().toISO());
    });
    test('[with timezone from millis] check equity of luxon and js Date', () => {
      const DATE_STRING = '2019-01-01T00:00:00.000+05:00';
      const dateAFromString = DateTime.fromISO(DATE_STRING, { setZone: true });
      expect(dateAFromString.zone.name).toBe('UTC+5');
      expect(dateAFromString.toISO()).toBe(DATE_STRING);

      const dateAMillis = dateAFromString.toMillis();
      const dateAFromMillis = DateTime.fromMillis(dateAMillis, { setZone: true });
      // we cannot reconstruct Timezone from millis, millis specifies UTC only
      expect(dateAFromMillis.toUTC().toISO()).toBe('2018-12-31T19:00:00.000Z');

      const dateAFromStringLocale = DateTime.fromISO(DATE_STRING, { setZone: false });
      // if we don't use setZone we are using locale timezone
      expect(dateAFromStringLocale.zone.name).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);

      const dateAMillisFromLocale = dateAFromStringLocale.toMillis();
      expect(dateAMillisFromLocale).toEqual(dateAMillis);
      const dateAFromMillisLocale = DateTime.fromMillis(dateAMillis, { setZone: true });
      // we cannot reconstruct Timezone from millis, millis specifies UTC only
      expect(dateAFromMillisLocale.toUTC().toISO()).toBe('2018-12-31T19:00:00.000Z');
    });
  });
  describe('invert and ticks on different timezone', () => {
    test('shall invert local', () => {
      const startTime = DateTime.fromISO('2019-01-01T00:00:00.000').toMillis();
      const midTime = DateTime.fromISO('2019-01-02T00:00:00.000').toMillis();
      const endTime = DateTime.fromISO('2019-01-03T00:00:00.000').toMillis();
      const data = [startTime, midTime, endTime];
      const domain = [startTime, endTime];
      const minRange = 0;
      const maxRange = 99;
      const minInterval = (endTime - startTime) / 2;
      const scale = new ScaleContinuous(
        {
          type: ScaleType.Time,
          domain,
          range: [minRange, maxRange],
        },
        { bandwidth: undefined, minInterval, timeZone: 'local' },
      );
      expect(scale.invert(0)).toBe(startTime);
      expect(scale.invert(49.5)).toBe(midTime);
      expect(scale.invert(99)).toBe(endTime);
      expect(scale.invertWithStep(0, data)).toEqual({ value: startTime, withinBandwidth: true });
      expect(scale.invertWithStep(24, data)).toEqual({ value: startTime, withinBandwidth: true });
      expect(scale.invertWithStep(25, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(50, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(74, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(76, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.invertWithStep(100, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.tickValues.length).toBe(9);
      expect(scale.tickValues[0]).toEqual(startTime);
      expect(scale.tickValues[4]).toEqual(midTime);
      expect(scale.tickValues[8]).toEqual(endTime);
    });
    test('shall invert UTC', () => {
      const startTime = DateTime.fromISO('2019-01-01T00:00:00.000Z').toMillis();
      const midTime = DateTime.fromISO('2019-01-02T00:00:00.000Z').toMillis();
      const endTime = DateTime.fromISO('2019-01-03T00:00:00.000Z').toMillis();
      const data = [startTime, midTime, endTime];
      const domain = [startTime, endTime];
      const minRange = 0;
      const maxRange = 99;
      const minInterval = (endTime - startTime) / 2;
      const scale = new ScaleContinuous(
        { type: ScaleType.Time, domain, range: [minRange, maxRange] },
        { bandwidth: undefined, minInterval, timeZone: 'utc' },
      );
      expect(scale.invert(0)).toBe(startTime);
      expect(scale.invert(49.5)).toBe(midTime);
      expect(scale.invert(99)).toBe(endTime);
      expect(scale.invertWithStep(0, data)).toEqual({ value: startTime, withinBandwidth: true });
      expect(scale.invertWithStep(24, data)).toEqual({ value: startTime, withinBandwidth: true });
      expect(scale.invertWithStep(25, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(50, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(74, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(75, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.invertWithStep(100, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.tickValues.length).toBe(9);
      expect(scale.tickValues[0]).toEqual(startTime);
      expect(scale.tickValues[4]).toEqual(midTime);
      expect(scale.tickValues[8]).toEqual(endTime);
    });
    test('shall invert +08:00', () => {
      const startTime = DateTime.fromISO('2019-01-01T00:00:00.000+08:00').toMillis();
      const midTime = DateTime.fromISO('2019-01-02T00:00:00.000+08:00').toMillis();
      const endTime = DateTime.fromISO('2019-01-03T00:00:00.000+08:00').toMillis();
      const data = [startTime, midTime, endTime];
      const domain = [startTime, endTime];
      const minRange = 0;
      const maxRange = 99;
      const minInterval = (endTime - startTime) / 2;
      const scale = new ScaleContinuous(
        {
          type: ScaleType.Time,
          domain,
          range: [minRange, maxRange],
        },
        { bandwidth: undefined, minInterval, timeZone: 'utc+8' },
      );
      expect(scale.invert(0)).toBe(startTime);
      expect(scale.invert(49.5)).toBe(midTime);
      expect(scale.invert(99)).toBe(endTime);
      expect(scale.invertWithStep(0, data)).toEqual({ value: startTime, withinBandwidth: true });
      expect(scale.invertWithStep(24, data)).toEqual({ value: startTime, withinBandwidth: true });

      expect(scale.invertWithStep(25, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(50, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(74, data)).toEqual({ value: midTime, withinBandwidth: true });

      expect(scale.invertWithStep(75, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.invertWithStep(100, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.tickValues.length).toBe(9);
      expect(scale.tickValues[0]).toEqual(startTime);
      expect(scale.tickValues[4]).toEqual(midTime);
      expect(scale.tickValues[8]).toEqual(endTime);
    });
    test('shall invert -08:00', () => {
      const startTime = DateTime.fromISO('2019-01-01T00:00:00.000-08:00').toMillis();
      const midTime = DateTime.fromISO('2019-01-02T00:00:00.000-08:00').toMillis();
      const endTime = DateTime.fromISO('2019-01-03T00:00:00.000-08:00').toMillis();
      const data = [startTime, midTime, endTime];
      const domain = [startTime, endTime];
      const minRange = 0;
      const maxRange = 99;
      const minInterval = (endTime - startTime) / 2;
      const scale = new ScaleContinuous(
        {
          type: ScaleType.Time,
          domain,
          range: [minRange, maxRange],
        },
        { bandwidth: undefined, minInterval, timeZone: 'utc-8' },
      );
      expect(scale.invert(0)).toBe(startTime);
      expect(scale.invert(49.5)).toBe(midTime);
      expect(scale.invert(99)).toBe(endTime);

      expect(scale.invertWithStep(0, data)).toEqual({ value: startTime, withinBandwidth: true });
      expect(scale.invertWithStep(24, data)).toEqual({ value: startTime, withinBandwidth: true });

      expect(scale.invertWithStep(25, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(50, data)).toEqual({ value: midTime, withinBandwidth: true });
      expect(scale.invertWithStep(74, data)).toEqual({ value: midTime, withinBandwidth: true });

      expect(scale.invertWithStep(75, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.invertWithStep(100, data)).toEqual({ value: endTime, withinBandwidth: true });
      expect(scale.tickValues.length).toBe(9);
      expect(scale.tickValues[0]).toEqual(startTime);
      expect(scale.tickValues[4]).toEqual(midTime);
      expect(scale.tickValues[8]).toEqual(endTime);
    });
    test('shall invert all timezones', () => {
      for (let i = -11; i <= 12; i++) {
        const timezone = i === 0 ? 'utc' : i > 0 ? `utc+${i}` : `utc${i}`;
        const startTime = DateTime.fromISO('2019-01-01T00:00:00.000', {
          zone: timezone,
        }).toMillis();
        const midTime = DateTime.fromISO('2019-01-02T00:00:00.000', { zone: timezone }).toMillis();
        const endTime = DateTime.fromISO('2019-01-03T00:00:00.000', { zone: timezone }).toMillis();
        const data = [startTime, midTime, endTime];
        const domain = [startTime, endTime];
        const minRange = 0;
        const maxRange = 99;
        const minInterval = (endTime - startTime) / 2;
        const scale = new ScaleContinuous(
          { type: ScaleType.Time, domain, range: [minRange, maxRange] },
          { bandwidth: undefined, minInterval, timeZone: timezone },
        );
        const formatFunction = (d: number) => {
          return DateTime.fromMillis(d, { zone: timezone }).toISO();
        };
        expect(scale.invert(0)).toBe(startTime);
        expect(scale.invert(49.5)).toBe(midTime);
        expect(scale.invert(99)).toBe(endTime);
        expect(scale.invertWithStep(0, data)).toEqual({ value: startTime, withinBandwidth: true });
        expect(scale.invertWithStep(24, data)).toEqual({ value: startTime, withinBandwidth: true });
        expect(scale.invertWithStep(25, data)).toEqual({ value: midTime, withinBandwidth: true });
        expect(scale.invertWithStep(50, data)).toEqual({ value: midTime, withinBandwidth: true });
        expect(scale.invertWithStep(74, data)).toEqual({ value: midTime, withinBandwidth: true });
        expect(scale.invertWithStep(75, data)).toEqual({ value: endTime, withinBandwidth: true });
        expect(scale.invertWithStep(100, data)).toEqual({ value: endTime, withinBandwidth: true });
        expect(scale.tickValues.length).toBe(9);
        expect(scale.tickValues[0]).toEqual(startTime);
        expect(scale.tickValues[4]).toEqual(midTime);
        expect(scale.tickValues[8]).toEqual(endTime);
        expect(formatFunction(scale.tickValues[0])).toEqual(
          DateTime.fromISO('2019-01-01T00:00:00.000', {
            zone: timezone,
          }).toISO(),
        );
        expect(formatFunction(scale.tickValues[4])).toEqual(
          DateTime.fromISO('2019-01-02T00:00:00.000', {
            zone: timezone,
          }).toISO(),
        );
        expect(formatFunction(scale.tickValues[8])).toEqual(
          DateTime.fromISO('2019-01-03T00:00:00.000', {
            zone: timezone,
          }).toISO(),
        );
      }
    });
  });
});
