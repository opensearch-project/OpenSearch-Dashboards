/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { stringify, parse } from './json';

describe('json', () => {
  it('can parse', () => {
    const input = {
      a: [
        { A: 1 },
        { B: '2' },
        { C: [1, 2, 3, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'] },
      ],
      b: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      c: {
        i: {},
        ii: [],
        iii: '',
        iv: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
    };
    const result = parse(JSON.stringify(input));
    expect(result).toEqual(input);
  });

  it('can stringify', () => {
    const input = {
      a: [
        { A: 1 },
        { B: '2' },
        { C: [1, 2, 3, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'] },
      ],
      b: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      c: {
        i: {},
        ii: [],
        iii: '',
        iv: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      },
    };
    const result = stringify(input);
    expect(result).toEqual(JSON.stringify(input));
  });

  it('can apply a reviver while parsing', () => {
    const input = {
      A: 255,
      B: {
        i: [[]],
        ii: 'Lorem ipsum',
        iii: {},
        rand: Math.random(),
      },
    };
    const text = JSON.stringify(input);
    function reviver(this: any, key: string, val: any) {
      if (Array.isArray(val) && toString.call(this) === '[object Object]') this._hasArrays = true;
      else if (typeof val === 'string') val = `<![CDATA[${val}]]>`;
      else if (typeof val === 'number') val = val.toString(16);
      else if (toString.call(this) === '[object Object]' && key === 'rand' && val === input.B.rand)
        this._found = true;
      return val;
    }

    expect(parse(text, reviver)).toEqual(JSON.parse(text, reviver));
  });

  it('can apply a replacer and spaces while stringifying', () => {
    const input = {
      A: 255,
      B: {
        i: [[]],
        ii: 'Lorem ipsum',
        iii: {},
        rand: Math.random(),
      },
    };

    function replacer(this: any, key: string, val: any) {
      if (Array.isArray(val) && val.length === 0) val.push('<empty>');
      else if (typeof val === 'string') val = `<![CDATA[${val}]]>`;
      else if (typeof val === 'number') val = val.toString(16);
      else if (toString.call(this) === '[object Object]' && key === 'rand' && val === input.B.rand)
        val = 1;
      return val;
    }

    expect(stringify(input, replacer, 2)).toEqual(JSON.stringify(input, replacer, 2));
  });

  it('can handle long numerals while parsing', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n;
    const text =
      `{` +
      // The space before and after the values, and the lack of spaces before comma are intentional
      `"\\":${longPositive}": "[ ${longNegative.toString()}, ${longPositive.toString()} ]", ` +
      `"positive": ${longPositive.toString()}, ` +
      `"array": [ ${longNegative.toString()}, ${longPositive.toString()} ], ` +
      `"negative": ${longNegative.toString()},` +
      `"number": 102931203123987` +
      `}`;

    const result = parse(text);
    expect(result.positive).toBe(longPositive);
    expect(result.negative).toBe(longNegative);
    expect(result.array).toEqual([longNegative, longPositive]);
    expect(result['":' + longPositive]).toBe(
      `[ ${longNegative.toString()}, ${longPositive.toString()} ]`
    );
    expect(result.number).toBe(102931203123987);
  });

  it('can handle BigInt values while stringifying', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n;
    const input = {
      [`": ${longPositive}`]: `[ ${longNegative.toString()}, ${longPositive.toString()} ]`,
      positive: longPositive,
      negative: longNegative,
      array: [longNegative, longPositive],
      number: 102931203123987,
    };

    expect(stringify(input)).toMatchSnapshot();
  });

  it('can apply a reviver on long numerals while parsing', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n;
    const text =
      `{` +
      // The space before and after the values, and the lack of spaces before comma are intentional
      `"\\":${longPositive}": "[ ${longNegative.toString()}, ${longPositive.toString()} ]", ` +
      `"positive": ${longPositive.toString()}, ` +
      `"array": [ ${longNegative.toString()}, ${longPositive.toString()} ], ` +
      `"negative": ${longNegative.toString()},` +
      `"number": 102931203123987` +
      `}`;

    const reviver = (key: string, val: any) => (typeof val === 'bigint' ? val * 3n : val);

    const result = parse(text, reviver);
    expect(result.positive).toBe(longPositive * 3n);
    expect(result.negative).toBe(longNegative * 3n);
    expect(result.array).toEqual([longNegative * 3n, longPositive * 3n]);
    expect(result['":' + longPositive]).toBe(
      `[ ${longNegative.toString()}, ${longPositive.toString()} ]`
    );
    expect(result.number).toBe(102931203123987);
  });

  it('can apply a replacer and spaces values while stringifying BigInts', () => {
    const longPositive = BigInt(Number.MAX_SAFE_INTEGER) * 2n;
    const longNegative = BigInt(Number.MIN_SAFE_INTEGER) * 2n;
    const input = {
      [`": ${longPositive}`]: `[ ${longNegative.toString()}, ${longPositive.toString()} ]`,
      positive: longPositive,
      negative: longNegative,
      array: [longNegative, longPositive, []],
      number: 102931203123987,
    };

    function replacer(this: any, key: string, val: any) {
      if (typeof val === 'bigint') val = val * 3n;
      else if (Array.isArray(val) && val.length === 0) val.push('<empty>');
      else if (typeof val === 'string') val = `<![CDATA[${val}]]>`;
      else if (typeof val === 'number') val = val.toString(16);
      return val;
    }

    expect(stringify(input, replacer, 4)).toMatchSnapshot();
  });
});
