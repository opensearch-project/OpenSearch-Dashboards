import {
  clamp,
  compareByValueAsc,
  identity,
  mergePartial,
  RecursivePartial,
  getPartialValue,
  getAllKeys,
} from './commons';

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

  describe('getPartialValue', () => {
    interface TestType {
      foo: string;
      bar: number;
      test?: TestType;
    }
    const base: TestType = {
      foo: 'elastic',
      bar: 123,
      test: {
        foo: 'shay',
        bar: 321,
      },
    };
    const partial: RecursivePartial<TestType> = {
      foo: 'elastic',
    };

    it('should return partial if it is defined', () => {
      const result = getPartialValue(base, partial);

      expect(result).toBe(partial);
    });

    it('should return base if partial is undefined', () => {
      const result = getPartialValue(base);

      expect(result).toBe(base);
    });

    it('should return extra partials if partial is undefined', () => {
      const result = getPartialValue(base, undefined, [partial]);

      expect(result).toBe(partial);
    });

    it('should return second partial if partial is undefined', () => {
      // @ts-ignore
      const result = getPartialValue(base, undefined, [undefined, partial]);

      expect(result).toBe(partial);
    });

    it('should return base if no partials are defined', () => {
      // @ts-ignore
      const result = getPartialValue(base, undefined, [undefined, undefined]);

      expect(result).toBe(base);
    });
  });

  describe('getAllKeys', () => {
    const object1 = {
      key1: 1,
      key2: 2,
    };
    const object2 = {
      key3: 3,
      key4: 4,
    };
    const object3 = {
      key5: 5,
      key6: 6,
    };

    it('should return all keys from single object', () => {
      const result = getAllKeys(object1);

      expect(result).toEqual(['key1', 'key2']);
    });

    it('should return all keys from all objects x 2', () => {
      const result = getAllKeys(object1, [object2]);

      expect(result).toEqual(['key1', 'key2', 'key3', 'key4']);
    });

    it('should return all keys from single objects x 3', () => {
      const result = getAllKeys(object1, [object2, object3]);

      expect(result).toEqual(['key1', 'key2', 'key3', 'key4', 'key5', 'key6']);
    });

    it('should return all keys from only defined objects', () => {
      const result = getAllKeys(object1, [null, object2, {}, undefined]);

      expect(result).toEqual(['key1', 'key2', 'key3', 'key4']);
    });
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

    describe('additionalPartials', () => {
      test('should override string value in base with first partial value', () => {
        const partial: PartialTestType = { string: 'test1' };
        const partials: PartialTestType[] = [{ string: 'test2' }, { string: 'test3' }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          string: partial.string,
        });
      });

      test('should override string values in base with first and second partial value', () => {
        const partial: PartialTestType = { number: 4 };
        const partials: PartialTestType[] = [{ string: 'test2' }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          number: partial.number,
          string: partials[0].string,
        });
      });

      test('should override string values in base with first, second and thrid partial value', () => {
        const partial: PartialTestType = { number: 4 };
        const partials: PartialTestType[] = [
          { number: 10, string: 'test2' },
          { number: 20, string: 'nope', boolean: true },
        ];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          number: partial.number,
          string: partials[0].string,
          boolean: partials[1].boolean,
        });
      });

      test('should override complex array value in base', () => {
        const partial: PartialTestType = { array1: [{ string: 'test1' }] };
        const partials: PartialTestType[] = [{ array1: [{ string: 'test2' }] }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          array1: partial.array1,
        });
      });

      test('should override complex array value in base second partial', () => {
        const partial: PartialTestType = {};
        const partials: PartialTestType[] = [{}, { array1: [{ string: 'test2' }] }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          array1: partials[1].array1,
        });
      });

      test('should override simple array value in base', () => {
        const partial: PartialTestType = { array2: [4, 5, 6] };
        const partials: PartialTestType[] = [{ array2: [7, 8, 9] }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          array2: partial.array2,
        });
      });

      test('should override simple array value in base with partial', () => {
        const partial: PartialTestType = {};
        const partials: PartialTestType[] = [{ array2: [7, 8, 9] }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          array2: partials[0].array2,
        });
      });

      test('should override simple array value in base with second partial', () => {
        const partial: PartialTestType = {};
        const partials: PartialTestType[] = [{}, { array2: [7, 8, 9] }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          array2: partials![1].array2,
        });
      });

      test('should override nested values in base', () => {
        const partial: PartialTestType = { nested: { number: 5 } };
        const partials: PartialTestType[] = [{ nested: { number: 10 } }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          nested: {
            ...newBase.nested,
            number: partial!.nested!.number,
          },
        });
      });

      test('should override nested values from partial', () => {
        const partial: PartialTestType = {};
        const partials: PartialTestType[] = [{ nested: { number: 10 } }];
        const newBase = mergePartial(base, partial, {}, partials);
        expect(newBase).toEqual({
          ...newBase,
          nested: {
            ...newBase.nested,
            number: partials![0].nested!.number,
          },
        });
      });
    });

    describe('MergeOptions', () => {
      describe('mergeOptionalPartialValues', () => {
        interface OptionalTestType {
          value1: string;
          value2?: number;
          value3: string;
          value4?: OptionalTestType;
        }
        const defaultBase: OptionalTestType = {
          value1: 'foo',
          value3: 'bar',
          value4: {
            value1: 'foo',
            value3: 'bar',
          },
        };
        const partial1: RecursivePartial<OptionalTestType> = { value1: 'baz', value2: 10 };
        const partial2: RecursivePartial<OptionalTestType> = { value1: 'baz', value4: { value2: 10 } };

        describe('mergeOptionalPartialValues is true', () => {
          test('should merge optional parameters', () => {
            const merged = mergePartial(defaultBase, partial1, { mergeOptionalPartialValues: true });
            expect(merged).toEqual({
              value1: 'baz',
              value2: 10,
              value3: 'bar',
              value4: {
                value1: 'foo',
                value3: 'bar',
              },
            });
          });

          test('should merge nested optional parameters', () => {
            const merged = mergePartial(defaultBase, partial2, { mergeOptionalPartialValues: true });
            expect(merged).toEqual({
              value1: 'baz',
              value3: 'bar',
              value4: {
                value1: 'foo',
                value2: 10,
                value3: 'bar',
              },
            });
          });

          test('should merge optional params from partials', () => {
            type PartialTestTypeOverride = PartialTestType & any;
            const partial: PartialTestTypeOverride = { nick: 'test', number: 6 };
            const partials: (PartialTestTypeOverride)[] = [{ string: 'test', foo: 'bar' }, { array3: [3, 3, 3] }];
            const newBase = mergePartial(base, partial, { mergeOptionalPartialValues: true }, partials);
            expect(newBase).toEqual({
              ...newBase,
              ...partial,
              ...partials[0],
              ...partials[1],
            });
          });
        });

        describe('mergeOptionalPartialValues is false', () => {
          test('should NOT merge optional parameters', () => {
            const merged = mergePartial(defaultBase, partial1, { mergeOptionalPartialValues: false });
            expect(merged).toEqual({
              value1: 'baz',
              value3: 'bar',
              value4: {
                value1: 'foo',
                value3: 'bar',
              },
            });
          });

          test('should NOT merge nested optional parameters', () => {
            const merged = mergePartial(defaultBase, partial2, { mergeOptionalPartialValues: false });
            expect(merged).toEqual({
              value1: 'baz',
              value3: 'bar',
              value4: {
                value1: 'foo',
                value3: 'bar',
              },
            });
          });
        });
      });
    });
  });
});
