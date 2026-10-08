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

/*
 * `@elastic/numeral` has no BigInt support, so OpenSearch `long` field values that
 * arrive as a BigInt are formatted here. This mirrors numeral's own `formatNumber`/
 * `formatCurrency` logic, specialized for BigInt — an integer, so there is no
 * fractional part, rounding, or decimal precision to apply.
 *
 * The percent, bytes and ordinal format types reuse numeral's Number arithmetic,
 * which throws a TypeError on a BigInt; those patterns have never supported
 * long-numeral values.
 */

/**
 * Subset of numeral's language object that the BigInt path needs. Obtain it at the
 * call site via `numeral.languageData()` for the active locale.
 */
export interface NumeralLanguageData {
  delimiters: { thousands: string; decimal: string };
  abbreviations: { thousand: string; million: string; billion: string; trillion: string };
  ordinal: (n: number) => string;
  currency: { symbol: string };
}

const IE12 = 1000000000000n;
const IE9 = 1000000000n;
const IE6 = 1000000n;
const IE3 = 1000n;

/**
 * Format a BigInt value with a numeral pattern.
 */
export function formatBigInt(value: bigint, format: string, language: NumeralLanguageData): string {
  // numeral's `formatNumeral` dispatch order: currency, percentage, time, bytes,
  // then plain number.
  if (format.indexOf('$') > -1) {
    return formatCurrency(value, format, language);
  }
  if (format.indexOf('%') > -1) {
    return formatPercentage(value, format, language);
  }
  if (format.indexOf(':') > -1) {
    return formatTime(value);
  }
  if (format.indexOf('b') > -1) {
    return formatBytes(value);
  }
  return formatNumber(value, format, language);
}

function formatNumber(value: bigint, format: string, language: NumeralLanguageData): string {
  let negP = false;
  let signed = false;
  let abbr = '';
  let abbrK = false;
  let abbrM = false;
  let abbrB = false;
  let abbrT = false;
  let abbrForce = false;
  let ord = '';
  const abs = value < 0n ? -value : value;
  let w: string;
  const d = '';
  let neg = false;

  // numeral's `zeroFormat` is unset by default in OpenSearch, so the zero special-case
  // is intentionally omitted (a zero BigInt formats like any other integer).

  // Parentheses for negatives, or an explicit sign. Parentheses win when both present.
  if (format.indexOf('(') > -1) {
    negP = true;
    format = format.slice(1, -1);
  } else if (format.indexOf('+') > -1) {
    signed = true;
    format = format.replace(/\+/g, '');
  }

  // Abbreviation (k/m/b/t). BigInt division truncates, dropping the fractional part.
  if (format.indexOf('a') > -1) {
    abbrK = format.indexOf('aK') >= 0;
    abbrM = format.indexOf('aM') >= 0;
    abbrB = format.indexOf('aB') >= 0;
    abbrT = format.indexOf('aT') >= 0;
    abbrForce = abbrK || abbrM || abbrB || abbrT;

    if (format.indexOf(' a') > -1) {
      abbr = ' ';
      format = format.replace(' a', '');
    } else {
      format = format.replace('a', '');
    }

    if ((abs >= IE12 && !abbrForce) || abbrT) {
      abbr += language.abbreviations.trillion;
      value = value / IE12;
    } else if ((abs < IE12 && abs >= IE9 && !abbrForce) || abbrB) {
      abbr += language.abbreviations.billion;
      value = value / IE9;
    } else if ((abs < IE9 && abs >= IE6 && !abbrForce) || abbrM) {
      abbr += language.abbreviations.million;
      value = value / IE6;
    } else if ((abs < IE6 && abs >= IE3 && !abbrForce) || abbrK) {
      abbr += language.abbreviations.thousand;
      value = value / IE3;
    }
  }

  // Ordinal. numeral's ordinal function does Number arithmetic (e.g. `number % 10`),
  // which throws for a BigInt.
  if (format.indexOf('o') > -1) {
    if (format.indexOf(' o') > -1) {
      ord = ' ';
      format = format.replace(' o', '');
    } else {
      format = format.replace('o', '');
    }
    ord = ord + language.ordinal(value as unknown as number);
  }

  if (format.indexOf('[.]') > -1) {
    format = format.replace('[.]', '.');
  }

  // A BigInt is an integer: no precision/decimals are applied (numeral skips its
  // precision branch for BigInt and uses the raw integer string).
  w = value.toString();

  const thousands = format.indexOf(',');

  if (w.indexOf('-') === 0) {
    w = w.slice(1);
    neg = true;
  }

  if (thousands > -1) {
    w = w.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + language.delimiters.thousands);
  }

  if (format.indexOf('.') === 0) {
    w = '';
  }

  return (
    (negP && neg ? '(' : '') +
    (!negP && neg ? '-' : '') +
    (!neg && signed ? '+' : '') +
    w +
    d +
    (ord || '') +
    (abbr || '') +
    (negP && neg ? ')' : '')
  );
}

function formatCurrency(value: bigint, format: string, language: NumeralLanguageData): string {
  const symbolIndex = format.indexOf('$');
  const openParenIndex = format.indexOf('(');
  const minusSignIndex = format.indexOf('-');
  let space = '';

  if (format.indexOf(' $') > -1) {
    space = ' ';
    format = format.replace(' $', '');
  } else if (format.indexOf('$ ') > -1) {
    space = ' ';
    format = format.replace('$ ', '');
  } else {
    format = format.replace('$', '');
  }

  let output = formatNumber(value, format, language);
  const symbol = language.currency.symbol;

  if (symbolIndex <= 1) {
    if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
      const chars = output.split('');
      let spliceIndex = 1;
      if (symbolIndex < openParenIndex || symbolIndex < minusSignIndex) {
        spliceIndex = 0;
      }
      chars.splice(spliceIndex, 0, symbol + space);
      output = chars.join('');
    } else {
      output = symbol + space + output;
    }
  } else if (output.indexOf(')') > -1) {
    const chars = output.split('');
    chars.splice(-1, 0, space + symbol);
    output = chars.join('');
  } else {
    output = output + space + symbol;
  }

  return output;
}

function formatPercentage(value: bigint, format: string, language: NumeralLanguageData): string {
  // numeral multiplies by 100 (a Number) before formatting. With a BigInt this throws
  // `TypeError: Cannot mix BigInt and other types`.
  const scaled = ((value as unknown as number) * 100) as unknown as bigint;
  let space = '';
  if (format.indexOf(' %') > -1) {
    space = ' ';
    format = format.replace(' %', '');
  } else {
    format = format.replace('%', '');
  }

  let output = formatNumber(scaled, format, language);
  if (output.indexOf(')') > -1) {
    const chars = output.split('');
    chars.splice(-1, 0, space + '%');
    output = chars.join('');
  } else {
    output = output + space + '%';
  }
  return output;
}

function formatBytes(value: bigint): string {
  // numeral floors the value (a Number op) to pick a byte unit. With a BigInt this
  // throws `TypeError: Cannot convert a BigInt value to a number`.
  Math.floor(value as unknown as number);
  // Unreachable; the line above always throws for a BigInt.
  return value.toString();
}

function formatTime(value: bigint): string {
  // numeral applies Math.floor/Math.abs to the value, which throws for a BigInt.
  Math.floor(Math.abs(value as unknown as number));
  // Unreachable; the line above always throws for a BigInt.
  return value.toString();
}
