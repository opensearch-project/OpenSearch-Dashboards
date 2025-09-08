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
  it('should display currency symbol ', () => {
    const result = currencyFormat(12, '$');
    expect(result).toBe('$ 12');
  });

  it('should round to 2 decimal places', () => {
    const result = currencyFormat(12.1234, '$');
    expect(result).toBe('$ 12.12');
  });
});

describe('computing', () => {
  it('should compute the decent unit with the base unit', () => {
    const result = computing(1000, dataUnits, 'B');
    expect(result).toBe('1 kB');
  });
});
