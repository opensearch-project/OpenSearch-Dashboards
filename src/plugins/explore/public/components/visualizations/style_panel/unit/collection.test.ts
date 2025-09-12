/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  UnitsCollection,
  getUnitById,
  shortNumber,
  computingDate,
  currencyFormat,
  computing,
  dataUnits,
} from './collection';

// Mock Date.now for consistent testing
const mockDateNow = jest.spyOn(Date, 'now');
const MOCK_TIMESTAMP = 1640995200000; // 2022-01-01 00:00:00 UTC

describe('UnitsCollection', () => {
  it('should contain all expected categories', () => {
    expect(UnitsCollection).toHaveProperty('misc');
    expect(UnitsCollection).toHaveProperty('currency');
    expect(UnitsCollection).toHaveProperty('data');
    expect(UnitsCollection).toHaveProperty('temperature');
    expect(UnitsCollection).toHaveProperty('time');
  });

  it('should have units with required properties', () => {
    const miscUnits = UnitsCollection.misc.units;
    expect(miscUnits[0]).toHaveProperty('id');
    expect(miscUnits[0]).toHaveProperty('name');
  });

  it('should have display functions for currency units', () => {
    const dollarUnit = UnitsCollection.currency.units.find((u) => u.id === 'dollars');
    expect(dollarUnit?.display).toBeDefined();
    expect(typeof dollarUnit?.display).toBe('function');
  });

  it('should have all expected currency units', () => {
    const currencyUnits = UnitsCollection.currency.units;
    const expectedCurrencies = ['dollars', 'pounds', 'euro', 'yuan', 'yen', 'rubles'];

    expectedCurrencies.forEach((currency) => {
      const unit = currencyUnits.find((u) => u.id === currency);
      expect(unit).toBeDefined();
      expect(unit?.display).toBeDefined();
      expect(typeof unit?.display).toBe('function');
    });
  });

  it('should format currency values using display function', () => {
    const dollarUnit = getUnitById('dollars');
    expect(dollarUnit?.display?.(100, '$')).toBe('$ 100');

    const euroUnit = getUnitById('euro');
    expect(euroUnit?.display?.(50.75, '€')).toBe('€ 50.75');

    const yuanUnit = getUnitById('yuan');
    expect(yuanUnit?.display?.(25.99, '¥')).toBe('¥ 25.99');

    const yenUnit = getUnitById('yen');
    expect(yenUnit?.display?.(25.99, '¥')).toBe('¥ 25.99');

    const poundUnit = getUnitById('pounds');
    expect(poundUnit?.display?.(25.99, '£')).toBe('£ 25.99');

    const rubleUnit = getUnitById('rubles');
    expect(rubleUnit?.display?.(25.99, '₽')).toBe('₽ 25.99');
  });

  it('should have correct symbols for each currency', () => {
    expect(getUnitById('dollars')?.symbol).toBe('$');
    expect(getUnitById('pounds')?.symbol).toBe('£');
    expect(getUnitById('euro')?.symbol).toBe('€');
    expect(getUnitById('yuan')?.symbol).toBe('¥');
    expect(getUnitById('yen')?.symbol).toBe('¥');
    expect(getUnitById('rubles')?.symbol).toBe('₽');
  });

  it('should have all expected data units', () => {
    const data = UnitsCollection.data.units;
    const expectedDataUnits = [
      'bits',
      'bytes',
      'kilobytes',
      'kibibytes',
      'megabytes',
      'mebibytes',
      'gigabytes',
      'gibibytes',
      'terabytes',
      'tebibytes',
      'petabytes',
      'pebibytes',
    ];

    expectedDataUnits.forEach((d) => {
      const unit = data.find((u) => u.id === d);
      expect(unit).toBeDefined();
      expect(unit?.display).toBeDefined();
      expect(typeof unit?.display).toBe('function');
    });
  });

  it('should have all expected time units', () => {
    const data = UnitsCollection.time.units;
    const expectedTimeUnits = [
      'year',
      'month',
      'week',
      'day',
      'hour',
      'minute',
      'second',
      'millisecond',
    ];

    expectedTimeUnits.forEach((d) => {
      const unit = data.find((u) => u.id === d);
      expect(unit).toBeDefined();
      expect(unit?.display).toBeDefined();
      expect(typeof unit?.display).toBe('function');
    });
  });

  it('should have all expected mass units', () => {
    const data = UnitsCollection.mass.units;
    const expectedMassUnits = ['milligram', 'gram', 'pound_mass', 'kilogram', 'metric'];

    expectedMassUnits.forEach((d) => {
      const unit = data.find((u) => u.id === d);
      expect(unit).toBeDefined();
      expect(unit?.symbol).toBeDefined();
      expect(typeof unit?.symbol).toBe('string');
      expect(unit?.display).toBeDefined();
      expect(typeof unit?.display).toBe('function');
    });
  });

  it('should have all expected length units', () => {
    const data = UnitsCollection.length.units;
    const expectedLengthUnits = ['millimeter', 'inch', 'feet', 'meter', 'kilometer', 'mile'];

    expectedLengthUnits.forEach((d) => {
      const unit = data.find((u) => u.id === d);
      expect(unit).toBeDefined();
      expect(unit?.symbol).toBeDefined();
      expect(typeof unit?.symbol).toBe('string');
      expect(unit?.display).toBeDefined();
      expect(typeof unit?.display).toBe('function');
    });
  });

  it('should add proper unit for misc values using display function', () => {
    const integerUnit = getUnitById('integer');
    expect(integerUnit?.display?.(100.12)).toBe(100);

    const shortUnit = getUnitById('short');
    expect(shortUnit?.display?.(1000)).toBe('1 K');
  });

  it('should add proper unit for data values using display function', () => {
    const bits = getUnitById('bits');
    expect(bits?.display?.(100.12, 'b')).toBe('12.52 B');

    const kbits = getUnitById('bytes');
    expect(kbits?.display?.(100.12, 'B')).toBe('100.12 B');

    const kilobytes = getUnitById('kilobytes');
    expect(kilobytes?.display?.(100.12, 'kB')).toBe('97.77 KiB');

    const kibibytes = getUnitById('kibibytes');
    expect(kibibytes?.display?.(100.12, 'KiB')).toBe('100.12 KiB');

    const megabytes = getUnitById('megabytes');
    expect(megabytes?.display?.(100.12, 'MB')).toBe('95.48 MiB');

    const mebibytes = getUnitById('mebibytes');
    expect(mebibytes?.display?.(100.12, 'MiB')).toBe('100.12 MiB');

    const gigabytes = getUnitById('gigabytes');
    expect(gigabytes?.display?.(100.12, 'GB')).toBe('93.24 GiB');

    const gibibytes = getUnitById('gibibytes');
    expect(gibibytes?.display?.(100.12, 'GiB')).toBe('100.12 GiB');

    const terabytes = getUnitById('terabytes');
    expect(terabytes?.display?.(100.12, 'TB')).toBe('91.06 TiB');

    const tebibytes = getUnitById('tebibytes');
    expect(tebibytes?.display?.(100.12, 'TiB')).toBe('100.12 TiB');
  });

  it('should add proper unit for time values using display function', () => {
    const year = getUnitById('year');
    expect(year?.display?.(1000, 'years')).toBe('1000 years');

    const month = getUnitById('month');
    expect(month?.display?.(1000, 'months')).toBe('82.19 years');

    const week = getUnitById('week');
    expect(week?.display?.(1000, 'weeks')).toBe('19.18 years');

    const day = getUnitById('day');
    expect(day?.display?.(1000, 'days')).toBe('2.74 years');

    const hour = getUnitById('hour');
    expect(hour?.display?.(1000, 'hours')).toBe('1.39 months');

    const minute = getUnitById('minute');
    expect(minute?.display?.(1000, 'minutes')).toBe('16.67 hours');

    const second = getUnitById('second');
    expect(second?.display?.(1000, 'seconds')).toBe('16.67 minutes');
    const millisecond = getUnitById('millisecond');
    expect(millisecond?.display?.(1000, 'milliseconds')).toBe('1 seconds');
  });
});

describe('getUnitById', () => {
  it('should return unit by id', () => {
    const unit = getUnitById('dollars');
    expect(unit?.name).toBe('Dollars ($)');
    expect(unit?.symbol).toBe('$');
  });

  it('should return undefined for invalid id', () => {
    const unit = getUnitById('invalid');
    expect(unit).toBeUndefined();
  });

  it('should handle undefined id', () => {
    const unit = getUnitById(undefined);
    expect(unit).toBeUndefined();
  });
});

describe('shortNumber', () => {
  it('should format numbers less than 1000', () => {
    expect(shortNumber(0)).toBe('0 ');
    expect(shortNumber(123)).toBe('123 ');
    expect(shortNumber(999)).toBe('999 ');
  });

  it('should format thousands', () => {
    expect(shortNumber(1000)).toBe('1 K');
    expect(shortNumber(1500)).toBe('1.5 K');
    expect(shortNumber(999999)).toBe('1000 K');
  });

  it('should format millions', () => {
    expect(shortNumber(1000000)).toBe('1 M');
    expect(shortNumber(2500000)).toBe('2.5 M');
    expect(shortNumber(999999999)).toBe('1000 M');
  });

  it('should format billions', () => {
    expect(shortNumber(1000000000)).toBe('1 B');
    expect(shortNumber(3750000000)).toBe('3.75 B');
  });

  it('should format trillions', () => {
    expect(shortNumber(1000000000000)).toBe('1 T');
    expect(shortNumber(5250000000000)).toBe('5.25 T');
  });

  it('should format quadrillions', () => {
    expect(shortNumber(1000000000000000)).toBe('1 Q');
    expect(shortNumber(7890000000000000)).toBe('7.89 Q');
  });

  it('should handle very large numbers', () => {
    expect(shortNumber(999000000000000000)).toBe('999 Q');
  });
});

describe('computingDate', () => {
  describe('ISO format', () => {
    it('should format timestamp as ISO string', () => {
      const result = computingDate(1640995200000, 'iso');
      expect(result).toBe('Sat, 01 Jan 2022 00:00:00 GMT');
    });

    it('should handle different timestamps', () => {
      const result = computingDate(1609459200000, 'iso'); // 2021-01-01
      expect(result).toBe('Fri, 01 Jan 2021 00:00:00 GMT');
    });
  });

  describe('fromNow format', () => {
    beforeAll(() => {
      mockDateNow.mockReturnValue(MOCK_TIMESTAMP);
    });

    afterAll(() => {
      mockDateNow.mockRestore();
    });

    it('should show milliseconds ago for very recent times', () => {
      const result = computingDate(MOCK_TIMESTAMP - 500, 'fromNow');
      expect(result).toBe('500 milliseconds ago');
    });

    it('should show seconds ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 5000, 'fromNow');
      expect(result).toBe('5 seconds ago');
    });

    it('should show minutes ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 300000, 'fromNow');
      expect(result).toBe('5 minutes ago');
    });

    it('should show hours ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 7200000, 'fromNow');
      expect(result).toBe('2 hours ago');
    });

    it('should show days ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 172800000, 'fromNow');
      expect(result).toBe('2 days ago');
    });

    it('should show weeks ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 1209600000, 'fromNow');
      expect(result).toBe('2 weeks ago');
    });

    it('should show months ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 5184000000, 'fromNow');
      expect(result).toBe('2 months ago');
    });

    it('should show years ago', () => {
      const result = computingDate(MOCK_TIMESTAMP - 31536000000, 'fromNow');
      expect(result).toBe('1 years ago');
    });

    it('should show future times with "after"', () => {
      const result = computingDate(MOCK_TIMESTAMP + 3600000, 'fromNow');
      expect(result).toBe('1 hours after');
    });
  });

  describe('default format', () => {
    it('should default to UTC string', () => {
      const result = computingDate(1640995200000);
      expect(result).toBe('Sat, 01 Jan 2022 00:00:00 GMT');
    });

    it('should handle undefined symbol', () => {
      const result = computingDate(1640995200000, undefined);
      expect(result).toBe('Sat, 01 Jan 2022 00:00:00 GMT');
    });
  });
});

describe('currencyFormat', () => {
  it('should display currency symbol', () => {
    const result = currencyFormat(12, '$');
    expect(result).toBe('$ 12');
  });

  it('should round to 2 decimal places', () => {
    const result = currencyFormat(12.1234, '$');
    expect(result).toBe('$ 12.12');
  });

  it('should handle different currency symbols', () => {
    expect(currencyFormat(100, '€')).toBe('€ 100');
    expect(currencyFormat(50, '£')).toBe('£ 50');
    expect(currencyFormat(75, '¥')).toBe('¥ 75');
    expect(currencyFormat(75, '¥')).toBe('¥ 75');
    expect(currencyFormat(200, '₽')).toBe('₽ 200');
  });
});

describe('computing', () => {
  it('should compute the decent unit with the base unit', () => {
    const result = computing(1000, dataUnits, 'B');
    expect(result).toBe('1 kB');
  });
});
