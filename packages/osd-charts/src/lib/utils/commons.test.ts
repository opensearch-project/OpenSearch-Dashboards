import { clamp, compareByValueAsc, identity } from './commons';

describe('commons utilities', () => {
  test('can clamp a value to min max', () => {
    expect(clamp(0, 0, 1)).toBe(0);
    expect(clamp(1, 0, 1)).toBe(1);

    expect(clamp(1.1, 0, 1)).toBe(1);
    expect(clamp(-0.1, 0, 1)).toBe(0);

    expect(clamp(0.1, 0, 1)).toBe(0.1);
    expect(clamp(0.8, 0, 1)).toBe(0.8);
  });

  test('identity', () => {
    expect(identity('text')).toBe('text');
    expect(identity(2)).toBe(2);
    const a = {};
    expect(identity(a)).toBe(a);
    expect(identity(null)).toBe(null);
    expect(identity(undefined)).toBe(undefined);
    const fn = () => ({});
    expect(identity(fn)).toBe(fn);
  });

  test('compareByValueAsc', () => {
    expect(compareByValueAsc(10, 20)).toBeLessThan(0);
    expect(compareByValueAsc(20, 10)).toBeGreaterThan(0);
    expect(compareByValueAsc(10, 10)).toBe(0);
  });
});
