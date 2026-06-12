/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * @jest-environment node
 */

// @ts-ignore
import numeral from '@elastic/numeral';
// @ts-ignore
import numeralLanguages from '@elastic/numeral/languages';
import { formatBigInt, NumeralLanguageData } from './format_bigint';
import goldenCorpus from './__fixtures__/numeral_bigint_golden.json';

/**
 * `numeral_bigint_golden.json` was captured from the forked `@amoo-miki/numeral@2.6.0`
 * package (the implementation OpenSearch shipped before moving to stock
 * `@elastic/numeral` + this helper). Every case asserts that `formatBigInt` reproduces
 * the fork's exact output — or its exact throw — so the migration is provably a
 * no-op for BigInt field-format values.
 */
interface GoldenCase {
  value: string;
  pattern: string;
  locale: string;
  output: string;
}

const THROW_PREFIX = 'THROW: ';

describe('formatBigInt', () => {
  // Register the same locale data the field-format converter registers.
  beforeAll(() => {
    numeralLanguages.forEach((numeralLanguage: Record<string, any>) => {
      numeral.language(numeralLanguage.id, numeralLanguage.lang);
    });
  });

  const languageDataFor = (locale: string): NumeralLanguageData => {
    const previous = numeral.language();
    numeral.language(locale);
    const data = (numeral as any).languageData();
    numeral.language(previous);
    return data;
  };

  describe('parity with the forked @amoo-miki/numeral golden corpus', () => {
    const cases = goldenCorpus as GoldenCase[];

    it('covers the full captured matrix', () => {
      // Guard against an accidentally truncated fixture.
      expect(cases.length).toBe(576);
    });

    cases.forEach(({ value, pattern, locale, output }) => {
      const expectsThrow = output.startsWith(THROW_PREFIX);
      const title = `${locale} | ${value} | ${pattern} => ${
        expectsThrow ? '<throws>' : JSON.stringify(output)
      }`;

      it(title, () => {
        const language = languageDataFor(locale);
        if (expectsThrow) {
          expect(() => formatBigInt(BigInt(value), pattern, language)).toThrow();
        } else {
          expect(formatBigInt(BigInt(value), pattern, language)).toBe(output);
        }
      });
    });
  });

  describe('readable spot checks (en)', () => {
    const en = (): NumeralLanguageData => {
      numeral.language('en');
      return (numeral as any).languageData();
    };

    it('formats a 64-bit max integer with grouping and no precision loss', () => {
      expect(formatBigInt(9223372036854775807n, '0,0.[000]', en())).toBe(
        '9,223,372,036,854,775,807'
      );
    });

    it('renders the 64-bit min integer in a currency pattern with parentheses', () => {
      expect(formatBigInt(-9223372036854775808n, '($0,0.[00])', en())).toBe(
        '($9,223,372,036,854,775,808)'
      );
    });

    it('keeps numeral abbreviation behavior (truncating, decimals dropped)', () => {
      expect(formatBigInt(9007199254740991n, '0.0a', en())).toBe('9007t');
    });

    it('applies the explicit sign prefix', () => {
      expect(formatBigInt(1234567890n, '+0,0', en())).toBe('+1,234,567,890');
    });

    it('throws on percent patterns, as the forked package did', () => {
      expect(() => formatBigInt(123n, '0,0.[000]%', en())).toThrow();
    });

    it('throws on bytes patterns, as the forked package did', () => {
      expect(() => formatBigInt(123n, '0,0.[0]b', en())).toThrow();
    });
  });

  describe('locale sensitivity', () => {
    it('uses the locale thousands delimiter (fr)', () => {
      const fr = languageDataFor('fr');
      expect(formatBigInt(1234567890n, '0,0.[000]', fr)).toBe('1 234 567 890');
    });
  });
});
