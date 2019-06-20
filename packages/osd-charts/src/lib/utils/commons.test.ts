import { clamp, compareByValueAsc, identity, mergePartial, RecursivePartial } from './commons';

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

  describe('mergePartial', () => {
    let baseClone: TestType;
    interface TestType {
      string: string;
      number: number;
      boolean: boolean;
      array1: Partial<TestType>[];
      array2: number[];
      nested: Partial<TestType>;
    }
    type PartialTestType = RecursivePartial<TestType>;
    const base: TestType = {
      string: 'string1',
      boolean: false,
      number: 1,
      array1: [
        {
          string: 'string2',
        },
      ],
      array2: [1, 2, 3],
      nested: {
        string: 'string2',
        number: 2,
      },
    };

    beforeAll(() => {
      baseClone = JSON.parse(JSON.stringify(base)) as TestType;
    });

    test('should allow partial to be undefined', () => {
      expect(mergePartial('test')).toBe('test');
    });

    test('should override base value with partial', () => {
      expect(mergePartial(1 as number, 2)).toBe(2);
    });

    test('should NOT return original base structure', () => {
      expect(mergePartial(base)).not.toBe(base);
    });

    test('should override string value in base', () => {
      const partial: PartialTestType = { string: 'test' };
      const newBase = mergePartial(base, partial);
      expect(newBase).toEqual({
        ...newBase,
        string: partial.string,
      });
    });

    test('should override boolean value in base', () => {
      const partial: PartialTestType = { boolean: true };
      const newBase = mergePartial(base, partial);
      expect(newBase).toEqual({
        ...newBase,
        boolean: partial.boolean,
      });
    });

    test('should override number value in base', () => {
      const partial: PartialTestType = { number: 3 };
      const newBase = mergePartial(base, partial);
      expect(newBase).toEqual({
        ...newBase,
        number: partial.number,
      });
    });

    test('should override complex array value in base', () => {
      const partial: PartialTestType = { array1: [{ string: 'test' }] };
      const newBase = mergePartial(base, partial);
      expect(newBase).toEqual({
        ...newBase,
        array1: partial!.array1,
      });
    });

    test('should override simple array value in base', () => {
      const partial: PartialTestType = { array2: [4, 5, 6] };
      const newBase = mergePartial(base, partial);
      expect(newBase).toEqual({
        ...newBase,
        array2: partial!.array2,
      });
    });

    test('should override nested values in base', () => {
      const partial: PartialTestType = { nested: { number: 5 } };
      const newBase = mergePartial(base, partial);
      expect(newBase).toEqual({
        ...newBase,
        nested: {
          ...newBase.nested,
          number: partial!.nested!.number,
        },
      });
    });

    test('should not mutate base structure', () => {
      const partial: PartialTestType = { number: 3 };
      mergePartial(base, partial);
      expect(base).toEqual(baseClone);
    });
  });
});
